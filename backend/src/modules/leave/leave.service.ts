import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeaveDTO, LeaveStatus } from './dto/leave.dto';
import {
  countWorkingDays,
  fallsInBlackout,
  rangesOverlap,
} from './leave-calculator';

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private audit: AuditService,
  ) {}

  private async getApproverContext(approverUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: approverUserId },
      include: { roles: true, employee: true },
    });
    if (!user) throw new NotFoundException('Approver user not found');
    const isAdmin = user.roles.some((r) => r.code === 'admin');
    const isHr = user.roles.some((r) => r.code === 'hr');
    const isManager = user.roles.some((r) => r.code === 'manager');
    return { user, isAdmin, isHr, isManager };
  }

  private async resolveTypeAndPolicy(typeCodeOrId: string) {
    const leaveType =
      (await this.prisma.leaveType.findUnique({
        where: { code: typeCodeOrId.toUpperCase() },
        include: { policy: true },
      })) ??
      (await this.prisma.leaveType.findUnique({
        where: { id: typeCodeOrId },
        include: { policy: true },
      }));
    return leaveType;
  }

  async create(data: CreateLeaveDTO) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const typeKey = data.type ?? 'ANNUAL';
    const leaveType = await this.resolveTypeAndPolicy(typeKey);
    const policy = leaveType?.policy;
    const weekendDays: number[] = (policy?.weekendDays as any) ?? [6, 0];
    const holidays = await this.prisma.holiday.findMany();
    const workingDays = countWorkingDays(start, end, weekendDays, holidays);

    if (workingDays === 0) {
      throw new BadRequestException(
        'Selected range covers no working days (weekends/holidays only).',
      );
    }
    if (policy) {
      if (workingDays < policy.minDaysPerRequest) {
        throw new BadRequestException(
          `Minimum ${policy.minDaysPerRequest} working day(s) per request for ${leaveType!.code}.`,
        );
      }
      if (workingDays > policy.maxDaysPerRequest) {
        throw new BadRequestException(
          `Maximum ${policy.maxDaysPerRequest} working day(s) per request for ${leaveType!.code}.`,
        );
      }
      if (policy.advanceNoticeDays > 0) {
        const noticeDeadline = new Date(start);
        noticeDeadline.setDate(noticeDeadline.getDate() - policy.advanceNoticeDays);
        if (new Date() > noticeDeadline) {
          throw new BadRequestException(
            `Requires ${policy.advanceNoticeDays} day(s) advance notice for ${leaveType!.code}.`,
          );
        }
      }
      const blackout = fallsInBlackout(start, end, policy.blackoutPeriods as any);
      if (blackout) {
        throw new BadRequestException(
          `Request falls within a blackout period${blackout.reason ? `: ${blackout.reason}` : ''}.`,
        );
      }
    }

    const overlapping = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: data.employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      },
    });
    for (const other of overlapping) {
      if (rangesOverlap(start, end, other.startDate, other.endDate)) {
        throw new ConflictException(
          `Overlaps with existing ${other.status} request ${other.id}.`,
        );
      }
    }

    if (policy && !policy.allowNegativeBalance && leaveType) {
      const balance = await this.computeBalance(data.employeeId, leaveType.id);
      if (balance.available < workingDays) {
        throw new BadRequestException(
          `Insufficient balance: ${balance.available} day(s) available for ${leaveType.code}.`,
        );
      }
    }

    const created = await this.prisma.leaveRequest.create({
      data: {
        startDate: start,
        endDate: end,
        type: leaveType?.code ?? typeKey,
        reason: data.reason,
        status: LeaveStatus.PENDING,
        workingDays,
        employee: { connect: { id: data.employeeId } },
        leaveType: leaveType ? { connect: { id: leaveType.id } } : undefined,
      },
      include: { employee: { include: { manager: true } } },
    });

    // charge §4.3: Employee → Direct Manager. Notify manager (if any).
    const managerUserId = created.employee.manager?.userId ?? null;
    if (managerUserId) {
      await this.notifications.dispatch({
        userId: managerUserId,
        subject: `Leave request from ${created.employee.fullName}`,
        message: `${created.employee.fullName} requested ${workingDays} working day(s) of ${created.type} leave from ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}.`,
        type: 'leave.submitted',
        channel: 'both',
      });
    } else {
      // No direct manager — fall through to admins.
      const admins = await this.prisma.user.findMany({
        where: { isActive: true, roles: { some: { code: 'admin' } } },
        select: { id: true },
      });
      await Promise.all(
        admins.map((a) =>
          this.notifications.dispatch({
            userId: a.id,
            subject: `Leave request needs review`,
            message: `${created.employee.fullName} submitted a leave request and has no direct manager assigned.`,
            type: 'leave.submitted',
            channel: 'in_app',
          }),
        ),
      );
    }

    return created;
  }

  async findAll() {
    return this.prisma.leaveRequest.findMany({
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, leaveType: true },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }

  /**
   * charge.docx §4.3 — process approval/rejection.
   * Allowed actors:
   *   - The direct manager of the requestor (manager role + manager.userId === approver)
   *   - Any user with admin role (HR override)
   */
  async processDecision(
    id: string,
    approverUserId: string,
    decision: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
    rejectionReason?: string,
  ) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { manager: true } } },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decide on a ${leave.status} request. Modify it first to restart approval.`,
      );
    }

    const ctx = await this.getApproverContext(approverUserId);
    const isDirectManager =
      !!leave.employee.manager &&
      leave.employee.manager.userId === approverUserId;
    if (!ctx.isAdmin && !ctx.isHr && !isDirectManager) {
      throw new ForbiddenException(
        'Only the direct manager or an admin can decide this leave request.',
      );
    }

    if (decision === LeaveStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const now = new Date();
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: decision,
        approvedById: approverUserId,
        managerApprovalAt: isDirectManager ? now : leave.managerApprovalAt ?? null,
        decidedAt: now,
        rejectionReason: decision === LeaveStatus.REJECTED ? rejectionReason : null,
      },
      include: { employee: true },
    });

    await this.audit.log({
      action: decision === LeaveStatus.APPROVED ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      userId: approverUserId,
      module: 'leave',
      resourceId: id,
      oldValue: { status: leave.status },
      newValue: { status: decision, rejectionReason: updated.rejectionReason },
    });

    // Notify the requestor.
    if (updated.employee.userId) {
      await this.notifications.dispatch({
        userId: updated.employee.userId,
        subject:
          decision === LeaveStatus.APPROVED
            ? 'Leave request approved'
            : 'Leave request rejected',
        message:
          decision === LeaveStatus.APPROVED
            ? `Your leave from ${updated.startDate.toISOString().slice(0, 10)} to ${updated.endDate.toISOString().slice(0, 10)} has been approved.`
            : `Your leave request was rejected. Reason: ${rejectionReason}`,
        type: 'leave.decision',
        channel: 'both',
        critical: decision === LeaveStatus.REJECTED,
      });
    }

    return updated;
  }

  /** Legacy method: kept for any existing callers. Prefer processDecision. */
  async updateStatus(id: string, status: LeaveStatus) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status, decidedAt: new Date() },
    });
  }

  /**
   * charge.docx §4.3 — modifying a pending request restarts approval.
   * Only the requestor (or admin) may modify a pending request.
   */
  async modifyPending(
    id: string,
    requesterEmployeeId: string,
    isAdmin: boolean,
    patch: { startDate?: string; endDate?: string; reason?: string },
  ) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (!isAdmin && leave.employeeId !== requesterEmployeeId) {
      throw new ForbiddenException('Cannot modify another employee\'s request');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be modified');
    }
    const startDate = patch.startDate ? new Date(patch.startDate) : leave.startDate;
    const endDate = patch.endDate ? new Date(patch.endDate) : leave.endDate;
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        startDate,
        endDate,
        reason: patch.reason ?? leave.reason,
        // reset approval stage — restart full workflow
        approvedById: null,
        managerApprovalAt: null,
        decidedAt: null,
      },
    });
  }

  /**
   * charge.docx §4.3 — Team & organization leave calendar.
   * Returns leaves intersecting the [from, to] window with optional filters.
   */
  async calendar(opts: {
    from: Date;
    to: Date;
    departmentId?: string;
    type?: string;
    includePending?: boolean;
  }) {
    const statuses: string[] = [LeaveStatus.APPROVED];
    if (opts.includePending) statuses.push(LeaveStatus.PENDING);
    return this.prisma.leaveRequest.findMany({
      where: {
        status: { in: statuses },
        startDate: { lte: opts.to },
        endDate: { gte: opts.from },
        ...(opts.type ? { type: opts.type } : {}),
        ...(opts.departmentId
          ? { employee: { departmentId: opts.departmentId } }
          : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
            department: { select: { name: true } },
            jobTitle: { select: { title: true } },
          },
        },
        leaveType: { select: { id: true, code: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async cancel(id: string, requesterEmployeeId: string, isManagerOrAdmin: boolean) {
    const leave = await this.findOne(id);
    if (!isManagerOrAdmin && leave.employeeId !== requesterEmployeeId) {
      throw new ForbiddenException('Cannot cancel another employee\'s leave request');
    }
    if (leave.status === LeaveStatus.REJECTED || leave.status === 'cancelled') {
      throw new BadRequestException('Leave request already finalized');
    }
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
  }

  /** charge.docx §4.3: balance per leave type. */
  async computeBalance(employeeId: string, leaveTypeId: string) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
      include: { policy: true },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const policy = leaveType.policy;
    const annualGrant = policy?.annualEntitlementDays ?? 0;
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveTypeId,
        startDate: { gte: yearStart },
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      },
    });

    let used = 0;
    let pending = 0;
    for (const r of requests) {
      const d = r.workingDays ?? 0;
      if (r.status === LeaveStatus.APPROVED) used += d;
      else pending += d;
    }

    return {
      leaveType: { id: leaveType.id, code: leaveType.code, name: leaveType.name },
      entitlement: annualGrant,
      used,
      pending,
      available: Math.max(0, annualGrant - used - pending),
    };
  }

  async balancesForEmployee(employeeId: string) {
    const types = await this.prisma.leaveType.findMany({
      where: { isActive: true },
      include: { policy: true },
    });
    return Promise.all(
      types.map((t) => this.computeBalance(employeeId, t.id)),
    );
  }

  async historyForEmployee(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.leaveRequest.delete({ where: { id } });
  }
}
