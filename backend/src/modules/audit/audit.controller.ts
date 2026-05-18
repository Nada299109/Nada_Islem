import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/auth.jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CheckPermissions } from '../auth/permissions.decorator';
import { AuthUser } from '../auth/auth.user.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('me')
  @ApiOperation({ description: 'List audit logs for the current authenticated user' })
  async findMine(@AuthUser() user: any) {
    return this.auditService.findByUser(user.id);
  }

  @Get()
  @CheckPermissions({ module: 'audit', action: 'read' })
  @ApiOperation({ description: 'List all audit logs (admin only)' })
  async findAll() {
    return this.auditService.findAll();
  }

  @Get('user/:userId')
  @CheckPermissions({ module: 'audit', action: 'read' })
  @ApiOperation({ description: 'Get audit logs for a specific user (admin only)' })
  async findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }
}
