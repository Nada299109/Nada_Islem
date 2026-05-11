import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService, OTP_PURPOSE } from '../auth/otp.service';
import { CreateEmployeeDTO } from './dto/create-employee.dto';
import { UpdateEmployeeDTO } from './dto/update-employee.dto';
import { BulkUpdateDTO } from './dto/bulk-update.dto';
import { getEmployeeIdFromUser, isDirector } from '../auth/auth-access.helper';

export interface EmployeeListParams {
  query?: string;
  departmentId?: string;
  roleId?: string;
  status?: string;
  contractType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
  ) {}

  private ensureDirectorAccess(user: any) {
    if (!isDirector(user)) {
      throw new ForbiddenException(
        'Only directors can manage other employee records',
      );
    }
  }

  private getScopedEmployeeId(user: any): string {
    const employeeId = getEmployeeIdFromUser(user);

    if (!employeeId) {
      throw new ForbiddenException('Authenticated user is not linked to an employee');
    }

    return employeeId;
  }

  private employeeInclude = {
    user: {
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    },
    manager: true,
    jobTitle: true,
    department: true,
  };

  private buildScalarData(data: CreateEmployeeDTO | UpdateEmployeeDTO) {
    return {
      fullName: (data as any).fullName,
      personalEmail: data.personalEmail,
      phone: data.phone,
      address: data.address,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      status: data.status,
      contractType: data.contractType,
      workLocation: data.workLocation,
      salaryGrade: data.salaryGrade,
      probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : undefined,
      hrNotes: data.hrNotes,
      emergencyName: data.emergencyName,
      emergencyPhone: data.emergencyPhone,
      emergencyRelation: data.emergencyRelation,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
    };
  }

  private async resolveDepartmentId(value?: string): Promise<string | undefined> {
    if (!value) return undefined;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    if (isUuid) {
      const existing = await this.prisma.department.findUnique({ where: { id: value } });
      if (existing) return existing.id;
    }
    const byName = await this.prisma.department.findFirst({ where: { name: value } });
    if (byName) return byName.id;
    const created = await this.prisma.department.create({ data: { name: value } });
    return created.id;
  }

  async create(data: CreateEmployeeDTO, user: any) {
    this.ensureDirectorAccess(user);

    const departmentId = await this.resolveDepartmentId(data.department);

    const employee = await this.prisma.employee.create({
      data: {
        ...(this.buildScalarData(data) as any),
        fullName: data.fullName,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
        user: data.userId
          ? { connect: { id: data.userId } }
          : undefined,
        manager: data.managerId
          ? { connect: { id: data.managerId } }
          : undefined,
        jobTitle: data.jobTitleId
          ? { connect: { id: data.jobTitleId } }
          : undefined,
      },
      include: this.employeeInclude,
    });

    if (data.userId && data.roleId) {
      await this.prisma.user.update({
        where: { id: data.userId },
        data: {
          roles: {
            set: [{ id: data.roleId }],
          },
        },
      });

      return this.findOne(employee.id, user);
    }

    return employee;
  }

  async findAll(user: any, params: EmployeeListParams = {}) {
    const scope = isDirector(user)
      ? undefined
      : { id: this.getScopedEmployeeId(user) };

    const where: Prisma.EmployeeWhereInput = {
      AND: [
        params.query
          ? {
              OR: [
                { fullName: { contains: params.query, mode: 'insensitive' } },
                { personalEmail: { contains: params.query, mode: 'insensitive' } },
                { phone: { contains: params.query, mode: 'insensitive' } },
                { id: { contains: params.query, mode: 'insensitive' } },
                { user: { email: { contains: params.query, mode: 'insensitive' } } },
                { user: { username: { contains: params.query, mode: 'insensitive' } } },
              ],
            }
          : {},
        params.departmentId ? { departmentId: params.departmentId } : {},
        params.status ? { status: params.status } : {},
        params.contractType ? { contractType: params.contractType } : {},
        params.roleId
          ? { user: { roles: { some: { id: params.roleId } } } }
          : {},
        scope ?? {},
      ],
    };

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));
    const sortBy = params.sortBy ?? 'fullName';
    const sortDir = params.sortDir ?? 'asc';

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: this.employeeInclude,
        orderBy: { [sortBy]: sortDir } as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: any) {
    if (!isDirector(user) && this.getScopedEmployeeId(user) !== id) {
      throw new ForbiddenException('You can only access your own employee profile');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: this.employeeInclude,
    });

    if (!employee) throw new NotFoundException('Employee not found');

    return employee;
  }

  async update(id: string, data: UpdateEmployeeDTO, user: any) {
    if (!isDirector(user) && this.getScopedEmployeeId(user) !== id) {
      throw new ForbiddenException('You can only update your own employee profile');
    }

    const departmentId = await this.resolveDepartmentId(data.department);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...this.buildScalarData(data),
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
        manager: data.managerId
          ? { connect: { id: data.managerId } }
          : undefined,
        jobTitle: data.jobTitleId
          ? { connect: { id: data.jobTitleId } }
          : undefined,
        user: data.roleId
          ? {
              update: {
                roles: {
                  set: [{ id: data.roleId }],
                },
              },
            }
          : undefined,
      },
      include: this.employeeInclude,
    });
  }

  /** charge.docx §4.1: soft-delete (status=inactive, login revoked, data retained). */
  async deactivate(id: string, user: any) {
    this.ensureDirectorAccess(user);

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status: 'inactive' },
      });
      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { isActive: false },
        });
      }
    });

    return this.findOne(id, user);
  }

  /** charge.docx §4.1: reactivate (access restored, optional OTP regen). */
  async reactivate(id: string, user: any, regenerateOtp = false) {
    this.ensureDirectorAccess(user);

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status: 'active' },
      });
      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { isActive: true, failedLoginAttempts: 0, lockedUntil: null },
        });
      }
    });

    let otpInfo: { otp: string; expiresAt: Date } | undefined;
    if (regenerateOtp && employee.userId) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { mustChangePassword: true },
      });
      otpInfo = await this.otpService.issue(employee.userId, OTP_PURPOSE.FIRST_LOGIN);
    }

    return { employee: await this.findOne(id, user), otp: otpInfo };
  }

  /**
   * charge.docx §4.1: deactivation is soft. Hard delete kept admin-only and only
   * usable for orphan records that never had login access.
   */
  async remove(id: string, user: any) {
    this.ensureDirectorAccess(user);

    return this.prisma.employee.delete({
      where: { id },
      include: this.employeeInclude,
    });
  }

  async bulkImport(employees: CreateEmployeeDTO[], user: any) {
    this.ensureDirectorAccess(user);

    // charge.docx §4.1: emails and Employee IDs are unique system-wide.
    // Pre-flight uniqueness check across the batch and against existing records.
    const inboundEmails = employees
      .map((e) => (e as any).personalEmail)
      .filter(Boolean) as string[];
    const seen = new Set<string>();
    const duplicateInBatch = new Set<string>();
    for (const e of inboundEmails) {
      const norm = e.toLowerCase();
      if (seen.has(norm)) duplicateInBatch.add(norm);
      else seen.add(norm);
    }
    const existingUsers = inboundEmails.length
      ? await this.prisma.user.findMany({
          where: { email: { in: inboundEmails, mode: 'insensitive' } },
          select: { email: true },
        })
      : [];
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const results: Array<{
      row: number;
      success: boolean;
      id?: string;
      error?: string;
      input?: any;
    }> = [];
    for (let row = 0; row < employees.length; row++) {
      const emp = employees[row];
      const email = ((emp as any).personalEmail as string | undefined)?.toLowerCase();
      if (email && duplicateInBatch.has(email)) {
        results.push({
          row,
          success: false,
          error: `Duplicate email within batch: ${email}`,
          input: emp,
        });
        continue;
      }
      if (email && existingEmails.has(email)) {
        results.push({
          row,
          success: false,
          error: `Email already exists: ${email}`,
          input: emp,
        });
        continue;
      }
      try {
        const result = await this.create(emp, user);
        results.push({ row, success: true, id: result?.id });
      } catch (err: any) {
        results.push({
          row,
          success: false,
          error: err?.message ?? 'Unknown error',
          input: emp,
        });
      }
    }
    return {
      total: employees.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async bulkUpdate(dto: BulkUpdateDTO, user: any) {
    this.ensureDirectorAccess(user);

    const updates: Prisma.EmployeeUpdateManyArgs['data'] = {};
    if (dto.status) updates.status = dto.status;
    if (dto.departmentId) updates.departmentId = dto.departmentId;
    if (dto.contractType) updates.contractType = dto.contractType;

    let employeesUpdated = 0;
    if (Object.keys(updates).length > 0) {
      const r = await this.prisma.employee.updateMany({
        where: { id: { in: dto.ids } },
        data: updates,
      });
      employeesUpdated = r.count;
    }

    let usersUpdated = 0;
    if (dto.roleId) {
      const linked = await this.prisma.employee.findMany({
        where: { id: { in: dto.ids }, userId: { not: null } },
        select: { userId: true },
      });
      for (const e of linked) {
        if (!e.userId) continue;
        await this.prisma.user.update({
          where: { id: e.userId },
          data: { roles: { set: [{ id: dto.roleId }] } },
        });
        usersUpdated += 1;
      }
    }

    return { employeesUpdated, usersUpdated };
  }

  async bulkSetStatus(ids: string[], status: 'active' | 'inactive', user: any) {
    this.ensureDirectorAccess(user);

    const employees = await this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });

    await this.prisma.$transaction([
      this.prisma.employee.updateMany({
        where: { id: { in: ids } },
        data: { status },
      }),
      ...employees
        .filter((e) => e.userId)
        .map((e) =>
          this.prisma.user.update({
            where: { id: e.userId! },
            data: {
              isActive: status === 'active',
              ...(status === 'active'
                ? { failedLoginAttempts: 0, lockedUntil: null }
                : {}),
            },
          }),
        ),
    ]);

    return { count: employees.length };
  }

  /** charge.docx §4.1: bulk export Excel/CSV. CSV implemented; Excel uses same rows client-side. */
  async exportCsv(user: any, params: EmployeeListParams = {}): Promise<string> {
    const all = await this.findAll(user, { ...params, page: 1, pageSize: 10000 });
    const header = [
      'id',
      'fullName',
      'personalEmail',
      'phone',
      'department',
      'jobTitle',
      'status',
      'contractType',
      'workLocation',
      'joinDate',
    ];
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = all.items.map((e: any) =>
      [
        e.id,
        e.fullName,
        e.personalEmail ?? '',
        e.phone ?? '',
        e.department?.name ?? '',
        e.jobTitle?.title ?? '',
        e.status,
        e.contractType ?? '',
        e.workLocation ?? '',
        e.joinDate ? new Date(e.joinDate).toISOString().slice(0, 10) : '',
      ]
        .map(escape)
        .join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  // Keep search() as a thin wrapper for back-compat with /search/advanced
  async search(
    user: any,
    query?: string,
    departmentId?: string,
    status?: string,
  ) {
    const result = await this.findAll(user, {
      query,
      departmentId,
      status,
      page: 1,
      pageSize: 200,
    });
    return result.items;
  }
}
