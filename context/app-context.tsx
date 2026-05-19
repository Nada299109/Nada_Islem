'use client'

import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import {
  MOCK_AUDIT_LOGS,
  MOCK_DOCUMENTS,
  MOCK_EMPLOYEES,
  MOCK_FEEDBACK,
  MOCK_LEAVES,
  MOCK_PAYROLL,
  MOCK_SURVEYS,
  MOCK_TICKETS,
  MOCK_TRAINING,
} from '@/lib/mock-data'
import { DEMO_APP_STATE_KEY, DEMO_AUTH_STATE_KEY, createId } from '@/lib/demo-storage'
import { api } from '@/lib/api'

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  joinDate: string
  status: 'active' | 'inactive'
  managerId?: string
  roleId?: string
  roleName?: string
  roleCode?: string
  permissions?: string[]
  // charge.docx §4.1 optional fields + birthday
  dateOfBirth?: string
  address?: string
  contractType?: 'CDI' | 'CDD' | 'Internship' | 'Contractor' | ''
  workLocation?: string
  salaryGrade?: string
  probationEndDate?: string
  hrNotes?: string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelation?: string
}

// charge.docx §4.12 — Time Tracking
export type AttendanceState = 'idle' | 'working' | 'on_break' | 'ended'

export interface AttendanceEvent {
  id: string
  type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
  occurredAt: string
  source: 'user' | 'hr_correction' | 'auto'
  reason?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  workedMinutes: number
  breakMinutes: number
  status: 'open' | 'closed' | 'flagged' | 'on_leave'
  events: AttendanceEvent[]
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  type: 'annual' | 'sick' | 'personal'
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface TicketCategory {
  id: string
  name: string
  description?: string
}

export interface TicketComment {
  id: string
  content: string
  createdAt: string
  authorId: string
  authorName: string
  isInternal?: boolean
}

export interface TicketAttachment {
  id: string
  filename: string
  size: number
  mime: string
  isResolution: boolean
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'open' | 'in_progress' | 'pending_employee' | 'resolved' | 'closed'
  categoryId?: string
  categoryName?: string
  employeeId: string
  employeeName?: string
  assignedToId?: string
  assignedToName?: string
  createdAt: string
  closedAt?: string
  slaDeadline?: string
  slaStatus?: 'ON_TRACK' | 'NEAR_BREACH' | 'BREACHED'
  location?: string
  comments?: TicketComment[]
  attachments?: TicketAttachment[]
  resolutionRating?: number
  resolutionFeedback?: string
  mergedIntoId?: string
}

export interface TrainingPlan {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  employeeId: string
  employeeName?: string
}

export interface Payroll {
  id: string
  employeeId: string
  employeeName?: string
  status: 'draft' | 'processed' | 'paid'
  periodStart: string
  periodEnd: string
  netAmount: number
  month: number
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
}

export interface Document {
  id: string
  title: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  version: number
  isLatest: boolean
  parentId?: string
  description?: string
  category?: string
  type?: 'company' | 'personal'
  isPublic: boolean
  uploadedById: string
  uploadedByName?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  isDeleted?: boolean
}

export interface DocumentAccessLog {
  id: string
  documentId: string
  userId: string
  action: 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'DELETE'
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface Survey {
  id: string
  title: string
  description?: string
  questions: any[]
  isActive: boolean
  createdAt: string
}

export interface SurveyResponse {
  id: string
  surveyId: string
  userId?: string
  answers: any
  createdAt: string
}

export interface PerformanceFeedback {
  id: string
  content: string
  rating?: number
  employeeId: string
  employeeName?: string
  authorId: string
  authorName?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  module?: string
  details?: string
  userId: string
  userName?: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning'
  createdAt: string
  isRead: boolean
  userId?: string            // target a specific user account id
  targetEmployeeId?: string  // target a specific employee record id (mapped to user via auth state)
  audienceRoles?: string[]   // fan-out to all users in these roles ('admin' | 'hr' | 'manager' | 'employee')
}

export interface ToolRecord {
  id: string
  name: string
  description: string
  category: string
  url: string
  visibility: string[]
  active: boolean
}

export interface RoleRecord {
  id: string
  name: string
  code: string
  description: string
  permissions: string[]
  memberCount: number
  system: boolean
}

export interface OnboardingTask {
  id: string
  label: string
  done: boolean
}

export interface OnboardingPlan {
  id: string
  employeeId: string
  progress: number
  mentor: string
  startDate: string
  tasks: OnboardingTask[]
}

export interface AppSettings {
  companyName: string
  supportEmail: string
  timezone: string
}

export interface LeaveType {
  id: string
  code: string
  name: string
  annualEntitlementDays: number
  isActive: boolean
}

export interface Holiday {
  id: string
  date: string
  name: string
  recurring: boolean
}

export interface FacilityLocation {
  id: string
  name: string
  type: string
  building?: string
  floor?: string
  isActive: boolean
}

export interface FacilityAsset {
  id: string
  name: string
  type?: string
  serialNumber?: string
  status: 'active' | 'under_maintenance' | 'retired'
  locationId: string
}

export interface FacilityRequest {
  id: string
  title: string
  description: string
  issueType: string
  urgency: 'low' | 'normal' | 'high' | 'critical'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  reporterEmployeeId: string
  locationId: string
  assetId?: string
  photos: { id: string; filename: string; size: number }[]
  ticketId?: string
  createdAt: string
}

interface AppState {
  employees: Employee[]
  leaveRequests: LeaveRequest[]
  leaveTypes: LeaveType[]
  holidays: Holiday[]
  tickets: Ticket[]
  ticketCategories: TicketCategory[]
  trainingPlans: TrainingPlan[]
  payrolls: Payroll[]
  documents: Document[]
  documentLogs: DocumentAccessLog[]
  surveys: Survey[]
  performanceFeedback: PerformanceFeedback[]
  auditLogs: AuditLog[]
  notifications: NotificationItem[]
  tools: ToolRecord[]
  roles: RoleRecord[]
  onboardingPlans: OnboardingPlan[]
  settings: AppSettings
  attendance: AttendanceRecord[]
  facilityLocations: FacilityLocation[]
  facilityAssets: FacilityAsset[]
  facilityRequests: FacilityRequest[]
}

interface AppContextType extends AppState {
  isLoading: boolean
  error: string | null
  addEmployee: (employee: Partial<Employee>) => Promise<void>
  addBulkEmployees: (employees: Partial<Employee>[]) => Promise<void>
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  submitLeaveRequest: (request: Partial<LeaveRequest>) => Promise<void>
  updateLeaveRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>
  getEmployeeLeaves: (employeeId: string) => LeaveRequest[]
  createTicket: (ticket: Partial<Ticket>) => Promise<void>
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>
  addTicketComment: (ticketId: string, content: string) => Promise<void>
  assignTicket: (id: string, employeeId: string) => Promise<void>
  createTrainingPlan: (plan: Partial<TrainingPlan>) => Promise<void>
  generatePayroll: (data: Partial<Payroll>) => Promise<void>
  uploadDocument: (formData: FormData) => Promise<void>
  uploadNewVersion: (documentId: string, formData: FormData) => Promise<void>
  downloadDocument: (id: string, fileName: string) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  submitSurveyResponse: (surveyId: string, answers: any) => Promise<void>
  createPerformanceFeedback: (data: Partial<PerformanceFeedback>) => Promise<void>
  fetchAuditLogs: () => Promise<void>
  refreshData: () => Promise<void>
  advancedSearch: (query: string, departmentId?: string, status?: string) => Promise<void>
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addTool: (tool: Partial<ToolRecord>) => void
  updateTool: (id: string, tool: Partial<ToolRecord>) => void
  addRole: (role: Partial<RoleRecord>) => void
  updateRole: (id: string, role: Partial<RoleRecord>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  toggleOnboardingTask: (planId: string, taskId: string) => void
  // Bulk employee
  bulkActivateEmployees: (ids: string[], active: boolean) => Promise<void>
  exportEmployeesCsv: () => void
  // Leave config
  upsertLeaveType: (lt: Partial<LeaveType>) => void
  upsertHoliday: (h: Partial<Holiday>) => void
  cancelLeaveRequest: (id: string) => void
  getLeaveBalance: (employeeId: string) => Array<{ leaveType: LeaveType; entitlement: number; used: number; pending: number; available: number }>
  // Attendance
  getMyAttendanceState: () => { state: AttendanceState; record?: AttendanceRecord }
  submitAttendanceAction: (action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => Promise<void>
  getTeamAttendance: () => Array<{ employeeId: string; fullName: string; state: AttendanceState; workedMinutes: number; breakMinutes: number }>
  // Documents
  rateTicket: (id: string, rating: number, feedback?: string) => Promise<void>
  mergeTicket: (sourceId: string, targetId: string) => Promise<void>
  setCommentInternal: (commentId: string, isInternal: boolean) => void
  // Facility
  upsertFacilityLocation: (loc: Partial<FacilityLocation>) => void
  upsertFacilityAsset: (asset: Partial<FacilityAsset>) => void
  createFacilityRequest: (req: Partial<FacilityRequest>) => Promise<void>
  escalateFacilityToTicket: (id: string) => Promise<void>
  isDemoMode: boolean
}

const defaultTicketCategories: TicketCategory[] = [
  { id: '1', name: 'IT Support', description: 'Accounts, access, devices' },
  { id: '2', name: 'Facility', description: 'Building, space, maintenance' },
  { id: '3', name: 'HR', description: 'Policies, contracts, payroll requests' },
]

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Leave approved',
    message: 'Your annual leave request has been approved.',
    type: 'success',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    userId: 'user-employee',
  },
  {
    id: 'notif-2',
    title: 'New document published',
    message: 'The updated employee handbook is now available in the library.',
    type: 'info',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    audienceRoles: ['admin', 'hr', 'manager', 'employee'],
  },
]

const defaultLeaveTypes: LeaveType[] = [
  { id: 'lt-annual', code: 'ANNUAL', name: 'Annual Leave', annualEntitlementDays: 22, isActive: true },
  { id: 'lt-sick', code: 'SICK', name: 'Sick Leave', annualEntitlementDays: 12, isActive: true },
  { id: 'lt-emergency', code: 'EMERGENCY', name: 'Emergency Leave', annualEntitlementDays: 3, isActive: true },
  { id: 'lt-unpaid', code: 'UNPAID', name: 'Unpaid Leave', annualEntitlementDays: 0, isActive: true },
  { id: 'lt-maternity', code: 'MATERNITY', name: 'Maternity / Paternity', annualEntitlementDays: 30, isActive: true },
  { id: 'lt-bereavement', code: 'BEREAVEMENT', name: 'Bereavement', annualEntitlementDays: 5, isActive: true },
]

const defaultHolidays: Holiday[] = [
  { id: 'h-1', date: `${new Date().getFullYear()}-01-01`, name: 'New Year', recurring: true },
  { id: 'h-2', date: `${new Date().getFullYear()}-05-01`, name: 'Labor Day', recurring: true },
]

const defaultFacilityLocations: FacilityLocation[] = [
  { id: 'loc-1', name: 'HQ – Floor 1 Open Space', type: 'office_area', building: 'HQ', floor: '1', isActive: true },
  { id: 'loc-2', name: 'HQ – Meeting Room A', type: 'meeting_room', building: 'HQ', floor: '2', isActive: true },
  { id: 'loc-3', name: 'HQ – Cafeteria', type: 'cafeteria', building: 'HQ', floor: '0', isActive: true },
]

const defaultTools: ToolRecord[] = [
  {
    id: 'tool-1',
    name: 'Google Workspace',
    description: 'Email, Meet, Drive and shared docs',
    category: 'Communication',
    url: 'https://workspace.google.com/',
    visibility: ['employee', 'manager', 'admin'],
    active: true,
  },
  {
    id: 'tool-2',
    name: 'Jira Software',
    description: 'Project planning and sprint execution',
    category: 'Project Management',
    url: 'https://www.atlassian.com/software/jira',
    visibility: ['manager', 'admin'],
    active: true,
  },
  {
    id: 'tool-3',
    name: 'Confluence',
    description: 'Knowledge base and procedures',
    category: 'Documentation',
    url: 'https://www.atlassian.com/software/confluence',
    visibility: ['employee', 'manager', 'admin'],
    active: true,
  },
  {
    id: 'tool-4',
    name: 'Expensify',
    description: 'Expense claims and reimbursement requests',
    category: 'Finance',
    url: 'https://www.expensify.com/',
    visibility: ['employee', 'manager', 'admin'],
    active: true,
  },
]

// roles.docx Table 2.1 — single source of truth for per-role permissions.
const EMPLOYEE_BASELINE_PERMS = [
  'profile.read',
  'profile.update',
  'dashboard.read',
  'dashboard.customize',
  'notifications.read',
  'notifications.update',
  'leave.create',
  'leave.cancel',
  'leave.read',
  'tickets.create',
  'tickets.read',
  'tickets.update',
  'facility.create',
  'facility.read',
  'documents.read',
  'documents.upload_personal',
  'payroll.view',
  'tools.read',
  'attendance.create',
  'attendance.read',
  'feedback.submit',
]

const MANAGER_PERMS = [
  ...EMPLOYEE_BASELINE_PERMS,
  'leave.approve',
  'leave.read_team',
  'tickets.read_team',
  'attendance.read_team',
  'employees.read',
  'users.read',
  'reports.read',
]

const HR_PERMS = [
  ...EMPLOYEE_BASELINE_PERMS,
  // Leave 4.3
  'leave.approve',
  'leave.read_team',
  'leave.configure',
  // Tickets 4.4
  'tickets.read_team',
  'tickets.assign',
  'tickets.manage',
  // Attendance 4.12
  'attendance.read_team',
  'attendance.manage',
  'attendance.configure',
  // Documents 4.7
  'documents.manage',
  // Payroll 4.8
  'payroll.manage',
  // Tools 4.11
  'tools.manage',
  // Facility 4.5
  'facility.manage',
  // Employee 4.1
  'employees.read',
  'employees.create',
  'employees.update',
  'employees.manage',
  'users.create',
  'users.read',
  'users.manage',
  // Role/Permission 4.2
  'roles.manage',
  'permissions.manage',
  // Operational
  'reports.read',
  'training.manage',
]

const ADMIN_PERMS = [
  ...HR_PERMS,
  // System Administration — Admin-only per matrix.
  'dashboard.configure',
  'tickets.configure',
  'audit.read',
  'settings.manage',
  'security.manage',
]

const defaultRoles: RoleRecord[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    code: 'admin',
    description: 'System Administrator: full platform governance, audit, security, configuration (roles.docx)',
    permissions: ADMIN_PERMS,
    memberCount: 1,
    system: true,
  },
  {
    id: 'role-hr',
    name: 'HR',
    code: 'hr',
    description:
      'HR Administrator: employee lifecycle, role mgmt, leave/payroll/attendance/document operations (roles.docx)',
    permissions: HR_PERMS,
    memberCount: 0,
    system: true,
  },
  {
    id: 'role-manager',
    name: 'Manager',
    code: 'manager',
    description: 'Manager: team-scoped approvals, calendar, ticket performance, attendance monitoring',
    permissions: MANAGER_PERMS,
    memberCount: 2,
    system: true,
  },
  {
    id: 'role-employee',
    name: 'Employee',
    code: 'employee',
    description: 'Employee: self-service for leaves, tickets, attendance, payslips, personal docs',
    permissions: EMPLOYEE_BASELINE_PERMS,
    memberCount: 9,
    system: true,
  },
]

function assignDefaultRoleToEmployee(employee: Employee, roles: RoleRecord[]) {
  if (employee.roleId) return employee

  const normalizedEmail = employee.email.toLowerCase()
  const adminRole = roles.find(role => role.code === 'admin')
  const managerRole = roles.find(role => role.code === 'manager')
  const hrRole = roles.find(role => role.code === 'hr')
  const employeeRole = roles.find(role => role.code === 'employee')

  const inferredRole =
    normalizedEmail === 'nada.br@intraconnect.com'
      ? adminRole
      : normalizedEmail === 'akram.tr@intraconnect.com'
        ? managerRole
        : employee.department === 'HR'
          ? hrRole ?? employeeRole
          : employeeRole

  if (!inferredRole) return employee

  return {
    ...employee,
    roleId: inferredRole.id,
    roleName: inferredRole.name,
    roleCode: inferredRole.code,
    permissions: inferredRole.permissions,
  }
}

function synchronizeRoles(state: AppState): AppState {
  const employees = state.employees.map(employee => {
    const employeeWithFallback = assignDefaultRoleToEmployee(employee, state.roles)
    const role = state.roles.find(item => item.id === employeeWithFallback.roleId)

    if (!role) {
      return {
        ...employeeWithFallback,
        roleName: employeeWithFallback.roleName || 'Unassigned',
        permissions: employeeWithFallback.permissions || [],
      }
    }

    return {
      ...employeeWithFallback,
      roleId: role.id,
      roleName: role.name,
      roleCode: role.code,
      permissions: role.permissions,
    }
  })

  const roles = state.roles.map(role => ({
    ...role,
    memberCount: employees.filter(employee => employee.roleId === role.id).length,
  }))

  return {
    ...state,
    employees,
    roles,
  }
}

const DEFAULT_ONBOARDING_TEMPLATE: { key: string; label: string }[] = [
  { key: 'contract', label: 'Sign employment contract' },
  { key: 'documents', label: 'Upload identity documents' },
  { key: 'first_login', label: 'Complete first-login and OTP setup' },
  { key: 'profile', label: 'Complete personal profile' },
  { key: 'tools', label: 'Set up email and collaboration tools' },
  { key: 'orientation', label: 'Attend first-day orientation' },
  { key: 'manager_intro', label: 'Meet direct manager' },
  { key: 'compliance', label: 'Complete compliance training' },
  { key: 'security', label: 'Read security policy and NDA' },
]

function buildOnboardingPlan(employee: Employee, mentorName?: string): OnboardingPlan {
  const tasks = DEFAULT_ONBOARDING_TEMPLATE.map(t => ({
    id: `${employee.id}-task-${t.key}`,
    label: t.label,
    done: false,
  }))
  return {
    id: `onboard-${employee.id}`,
    employeeId: employee.id,
    mentor: mentorName ?? 'Akram Trimech',
    startDate: employee.joinDate,
    progress: 0,
    tasks,
  }
}

function createDefaultOnboardingPlans(employees: Employee[]): OnboardingPlan[] {
  return employees.slice(0, 5).map((employee, index) => {
    const plan = buildOnboardingPlan(
      employee,
      index % 2 === 0 ? 'Akram Trimech' : 'Nada Ben Romdhane',
    )
    // Pre-fill some tasks for seeded demo employees so the list isn't empty.
    const seedDone = index === 0 ? 7 : index === 1 ? 5 : index === 2 ? 3 : index === 3 ? 2 : 1
    plan.tasks = plan.tasks.map((task, i) => ({ ...task, done: i < seedDone }))
    plan.progress = Math.round((seedDone / plan.tasks.length) * 100)
    return plan
  })
}

function buildDefaultState(): AppState {
  const employees = [...MOCK_EMPLOYEES]
  const roles = [...defaultRoles]
  const payrolls = MOCK_PAYROLL.map((item, index) => {
    const periodStart = item.periodStart || '2026-03-01'
    const periodEnd = item.periodEnd || '2026-03-31'
    const startDate = new Date(periodStart)
    const basicSalary = Math.round(item.netAmount * 1.12)
    const allowances = Math.round(item.netAmount * 0.08)
    const deductions = Math.max(basicSalary + allowances - item.netAmount, 0)

    return {
      ...item,
      id: item.id || `pay-${index + 1}`,
      status: item.status || 'paid',
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      basicSalary,
      allowances,
      deductions,
      netSalary: item.netAmount,
      netAmount: item.netAmount,
      periodStart,
      periodEnd,
    }
  })

  return synchronizeRoles({
    employees,
    leaveRequests: [...MOCK_LEAVES],
    leaveTypes: defaultLeaveTypes,
    holidays: defaultHolidays,
    tickets: [...MOCK_TICKETS],
    ticketCategories: defaultTicketCategories,
    trainingPlans: [...MOCK_TRAINING],
    payrolls,
    documents: [...MOCK_DOCUMENTS],
    documentLogs: [],
    surveys: [...MOCK_SURVEYS],
    performanceFeedback: [...MOCK_FEEDBACK],
    auditLogs: [...MOCK_AUDIT_LOGS],
    notifications: defaultNotifications,
    tools: defaultTools,
    roles,
    onboardingPlans: createDefaultOnboardingPlans(employees),
    settings: {
      companyName: 'IntraConnect',
      supportEmail: 'support@intraconnect.local',
      timezone: 'Africa/Tunis',
    },
    attendance: [],
    facilityLocations: defaultFacilityLocations,
    facilityAssets: [],
    facilityRequests: [],
  })
}

/**
 * Merge stored system roles with the latest defaults so that existing demo
 * users automatically receive new system roles (e.g. HR) and refreshed
 * permission lists without needing to clear localStorage.
 */
function mergeSystemRoles(storedRoles: RoleRecord[]): RoleRecord[] {
  const byCode = new Map<string, RoleRecord>()
  storedRoles.forEach(r => byCode.set(r.code, r))
  defaultRoles.forEach(def => {
    const existing = byCode.get(def.code)
    if (!existing) {
      byCode.set(def.code, def)
    } else if (def.system) {
      // Refresh permissions on system roles to match the latest defaults.
      byCode.set(def.code, { ...existing, permissions: def.permissions, system: true })
    }
  })
  return Array.from(byCode.values())
}

function readAppState(): AppState {
  if (typeof window === 'undefined') return buildDefaultState()

  const stored = window.localStorage.getItem(DEMO_APP_STATE_KEY)
  if (!stored) return buildDefaultState()

  try {
    const parsed = JSON.parse(stored) as Partial<AppState>
    const merged: AppState = {
      ...buildDefaultState(),
      ...parsed,
      roles: mergeSystemRoles(parsed.roles ?? []),
    }
    return synchronizeRoles(merged)
  } catch {
    return buildDefaultState()
  }
}

function persistAppState(state: AppState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DEMO_APP_STATE_KEY, JSON.stringify(state))
}

function getAuthUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_STATE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user || null
  } catch {
    return null
  }
}

function getCurrentEmployeeSnapshot(state: AppState) {
  const user = getAuthUser()
  if (!user) return null

  return state.employees.find(employee => employee.id === user.employeeId) || null
}

export const AppContext = createContext<AppContextType>({
  ...buildDefaultState(),
  isLoading: false,
  error: null,
  isDemoMode: true,
  addEmployee: async () => {},
  addBulkEmployees: async () => {},
  updateEmployee: async () => {},
  deleteEmployee: async () => {},
  submitLeaveRequest: async () => {},
  updateLeaveRequest: async () => {},
  getEmployeeLeaves: () => [],
  createTicket: async () => {},
  updateTicket: async () => {},
  addTicketComment: async () => {},
  assignTicket: async () => {},
  createTrainingPlan: async () => {},
  generatePayroll: async () => {},
  uploadDocument: async () => {},
  uploadNewVersion: async () => {},
  downloadDocument: async () => {},
  deleteDocument: async () => {},
  submitSurveyResponse: async () => {},
  createPerformanceFeedback: async () => {},
  fetchAuditLogs: async () => {},
  refreshData: async () => {},
  advancedSearch: async () => {},
  markNotificationRead: () => {},
  markAllNotificationsRead: () => {},
  addTool: () => {},
  updateTool: () => {},
  addRole: () => {},
  updateRole: () => {},
  updateSettings: () => {},
  toggleOnboardingTask: () => {},
  bulkActivateEmployees: async () => {},
  exportEmployeesCsv: () => {},
  upsertLeaveType: () => {},
  upsertHoliday: () => {},
  cancelLeaveRequest: () => {},
  getLeaveBalance: () => [],
  getMyAttendanceState: () => ({ state: 'idle' as AttendanceState }),
  submitAttendanceAction: async () => {},
  getTeamAttendance: () => [],
  rateTicket: async () => {},
  mergeTicket: async () => {},
  setCommentInternal: () => {},
  upsertFacilityLocation: () => {},
  upsertFacilityAsset: () => {},
  createFacilityRequest: async () => {},
  escalateFacilityToTicket: async () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildDefaultState())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employeeDirectory, setEmployeeDirectory] = useState<Employee[]>([])

  useEffect(() => {
    const initialState = readAppState()
    setState(initialState)
    setEmployeeDirectory(initialState.employees)
    setIsLoading(false)
  }, [])

  const commit = useCallback((updater: (previous: AppState) => AppState) => {
    setState(previous => {
      const next = updater(previous)
      persistAppState(next)
      return next
    })
  }, [])

  const appendAudit = useCallback((draft: AppState, action: string, module: string, details: string) => {
    const user = getAuthUser()

    draft.auditLogs = [
      {
        id: createId('audit'),
        action,
        module,
        details,
        userId: user?.id || 'system',
        userName: user?.name || 'System',
        createdAt: new Date().toISOString(),
      },
      ...draft.auditLogs,
    ]
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    const next = readAppState()
    setState(next)
    setEmployeeDirectory(next.employees)
    setIsLoading(false)
  }, [])

  const advancedSearch = useCallback(async (query: string, departmentId?: string, status?: string) => {
    setIsLoading(true)
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = state.employees.filter(employee => {
      const matchesQuery =
        !normalizedQuery ||
        employee.name.toLowerCase().includes(normalizedQuery) ||
        employee.email.toLowerCase().includes(normalizedQuery) ||
        employee.phone.toLowerCase().includes(normalizedQuery)

      const matchesDepartment = !departmentId || employee.department === departmentId
      const matchesStatus = !status || employee.status === status.toLowerCase()

      return matchesQuery && matchesDepartment && matchesStatus
    })

    setEmployeeDirectory(filtered)
    setIsLoading(false)
  }, [state.employees])

  const addEmployee = useCallback(async (employee: Partial<Employee>) => {
    const dto = {
      fullName: employee.name || 'New Employee',
      personalEmail: employee.email || undefined,
      phone: employee.phone || undefined,
      address: employee.address || undefined,
      dateOfBirth: employee.dateOfBirth || undefined,
      department: employee.department || 'General',
      status: employee.status || 'active',
      contractType: employee.contractType || undefined,
      workLocation: employee.workLocation || undefined,
      salaryGrade: employee.salaryGrade || undefined,
      probationEndDate: employee.probationEndDate || undefined,
      hrNotes: employee.hrNotes || undefined,
      emergencyName: employee.emergencyName || undefined,
      emergencyPhone: employee.emergencyPhone || undefined,
      emergencyRelation: employee.emergencyRelation || undefined,
      joinDate: employee.joinDate || new Date().toISOString().split('T')[0],
      managerId: employee.managerId || undefined,
    }

    let createdId = createId('emp')
    try {
      const created = await api.post('/employee', dto)
      if (created?.id) createdId = created.id
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to create employee on the backend.')
    }

    commit(previous => {
      const next = structuredClone(previous)
      const newEmployee: Employee = {
        id: createdId,
        name: employee.name || 'New Employee',
        email: employee.email || `employee-${next.employees.length + 1}@intraconnect.com`,
        phone: employee.phone || '+216 00 000 000',
        department: employee.department || 'General',
        position: employee.position || 'Staff',
        joinDate: employee.joinDate || new Date().toISOString().split('T')[0],
        status: employee.status || 'active',
        managerId: employee.managerId,
        roleId: employee.roleId,
        roleName: employee.roleName,
        roleCode: employee.roleCode,
        permissions: employee.permissions || [],
      }

      next.employees = [newEmployee, ...next.employees]
      // charge.docx §4.1 — auto-generate onboarding plan from default template.
      if (!next.onboardingPlans.some(p => p.employeeId === newEmployee.id)) {
        next.onboardingPlans = [buildOnboardingPlan(newEmployee), ...next.onboardingPlans]
      }
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'CREATE_EMPLOYEE', 'EMPLOYEES', `Created employee ${newEmployee.name}`)
      appendAudit(next, 'CREATE_ONBOARDING', 'ONBOARDING', `Auto-generated onboarding plan for ${newEmployee.name}`)
      return synchronized
    })
  }, [appendAudit, commit])

  const addBulkEmployees = useCallback(async (employees: Partial<Employee>[]) => {
    commit(previous => {
      const next = structuredClone(previous)
      const created = employees.map(employee => ({
        id: createId('emp'),
        name: employee.name || employee['fullName' as keyof Employee] as string || 'Imported Employee',
        email: employee.email || `${createId('user')}@intraconnect.com`,
        phone: employee.phone || '+216 00 000 000',
        department: employee.department || 'General',
        position: employee.position || 'Staff',
        joinDate: employee.joinDate || new Date().toISOString().split('T')[0],
        status: employee.status || 'active',
        managerId: employee.managerId,
        roleId: employee.roleId || defaultRoles.find(role => role.code === 'employee')?.id,
        roleName: employee.roleName || 'Employee',
        roleCode: employee.roleCode || 'employee',
        permissions: employee.permissions || [],
      }))

      next.employees = [...created, ...next.employees]
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'BULK_IMPORT_EMPLOYEE', 'EMPLOYEES', `Imported ${created.length} employees`)
      return synchronized
    })
  }, [appendAudit, commit])

  const updateEmployee = useCallback(async (id: string, employee: Partial<Employee>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.employees = next.employees.map(item => item.id === id ? { ...item, ...employee } : item)
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'UPDATE_EMPLOYEE', 'EMPLOYEES', `Updated employee ${id}`)
      return synchronized
    })
  }, [appendAudit, commit])

  const deleteEmployee = useCallback(async (id: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.employees = next.employees.filter(item => item.id !== id)
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'DELETE_EMPLOYEE', 'EMPLOYEES', `Removed employee ${id}`)
      return synchronized
    })
  }, [appendAudit, commit])

  const submitLeaveRequest = useCallback(async (request: Partial<LeaveRequest>) => {
    commit(previous => {
      const next = structuredClone(previous)
      const employee = next.employees.find(item => item.id === request.employeeId)
      const leave: LeaveRequest = {
        id: createId('leave'),
        employeeId: request.employeeId || employee?.id || 'unknown',
        employeeName: request.employeeName || employee?.name || 'Current User',
        startDate: request.startDate || new Date().toISOString().split('T')[0],
        endDate: request.endDate || new Date().toISOString().split('T')[0],
        type: request.type || 'annual',
        reason: request.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      next.leaveRequests = [leave, ...next.leaveRequests]
      next.notifications = [
        {
          id: createId('notif'),
          title: 'New leave request',
          message: `${leave.employeeName} submitted a ${leave.type} leave request awaiting review.`,
          type: 'info',
          createdAt: new Date().toISOString(),
          isRead: false,
          audienceRoles: ['hr', 'manager', 'admin'],
        },
        ...next.notifications,
      ]
      appendAudit(next, 'CREATE_LEAVE', 'LEAVES', `Created leave request ${leave.id}`)
      return next
    })
  }, [appendAudit, commit])

  const updateLeaveRequest = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    commit(previous => {
      const next = structuredClone(previous)
      const target = next.leaveRequests.find(item => item.id === id)
      next.leaveRequests = next.leaveRequests.map(item => item.id === id ? { ...item, status } : item)

      if (target) {
        next.notifications = [
          {
            id: createId('notif'),
            title: `Leave ${status}`,
            message: `Your ${target.type} leave request has been ${status}.`,
            type: status === 'approved' ? 'success' : 'warning',
            createdAt: new Date().toISOString(),
            isRead: false,
            targetEmployeeId: target.employeeId,
          },
          ...next.notifications,
        ]
      }

      appendAudit(next, 'UPDATE_LEAVE', 'LEAVES', `Marked leave ${id} as ${status}`)
      return next
    })
  }, [appendAudit, commit])

  const getEmployeeLeaves = useCallback((employeeId: string) => {
    return state.leaveRequests.filter(request => request.employeeId === employeeId)
  }, [state.leaveRequests])

  const createTicket = useCallback(async (ticket: Partial<Ticket>) => {
    commit(previous => {
      const next = structuredClone(previous)
      const employee = next.employees.find(item => item.id === ticket.employeeId) || getCurrentEmployeeSnapshot(next)
      const category = next.ticketCategories.find(item => item.id === ticket.categoryId)
      const createdAt = new Date().toISOString()
      const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const newTicket: Ticket = {
        id: createId('ticket'),
        title: ticket.title || 'Untitled request',
        description: ticket.description || '',
        priority: ticket.priority || 'medium',
        status: 'open',
        categoryId: ticket.categoryId,
        categoryName: category?.name || 'General',
        employeeId: ticket.employeeId || employee?.id || 'unknown',
        employeeName: ticket.employeeName || employee?.name || 'Current User',
        assignedToId: ticket.assignedToId,
        assignedToName: ticket.assignedToName,
        createdAt,
        slaDeadline,
        slaStatus: ticket.priority === 'urgent' ? 'NEAR_BREACH' : 'ON_TRACK',
        location: ticket.location,
        comments: [],
      }

      next.tickets = [newTicket, ...next.tickets]
      next.notifications = [
        {
          id: createId('notif'),
          title: 'New support request',
          message: `${newTicket.employeeName} opened "${newTicket.title}" in ${newTicket.categoryName}.`,
          type: 'info',
          createdAt,
          isRead: false,
          audienceRoles: ['hr', 'admin', 'manager'],
        },
        ...next.notifications,
      ]
      if (newTicket.assignedToId) {
        next.notifications = [
          {
            id: createId('notif'),
            title: 'Ticket assigned to you',
            message: `You have been assigned "${newTicket.title}" (priority: ${newTicket.priority}).`,
            type: 'info',
            createdAt,
            isRead: false,
            targetEmployeeId: newTicket.assignedToId,
          },
          ...next.notifications,
        ]
      }
      appendAudit(next, 'CREATE_TICKET', 'TICKETS', `Created ticket ${newTicket.id}`)
      return next
    })
  }, [appendAudit, commit])

  const updateTicket = useCallback(async (id: string, data: Partial<Ticket>) => {
    commit(previous => {
      const next = structuredClone(previous)
      const before = next.tickets.find(ticket => ticket.id === id)
      next.tickets = next.tickets.map(ticket => {
        if (ticket.id !== id) return ticket

        const nextStatus = data.status || ticket.status
        const nextSlaStatus =
          nextStatus === 'resolved' || nextStatus === 'closed'
            ? 'ON_TRACK'
            : data.slaStatus || ticket.slaStatus

        return {
          ...ticket,
          ...data,
          status: nextStatus,
          slaStatus: nextSlaStatus,
        }
      })

      // Notify the requester when their ticket is resolved/closed — unlocks the 5-star rating UI.
      if (
        before &&
        data.status &&
        data.status !== before.status &&
        (data.status === 'resolved' || data.status === 'closed')
      ) {
        next.notifications = [
          {
            id: createId('notif'),
            title: `Ticket ${data.status}`,
            message: `Your ticket "${before.title}" was marked ${data.status}. Please rate the resolution.`,
            type: 'success',
            createdAt: new Date().toISOString(),
            isRead: false,
            targetEmployeeId: before.employeeId,
          },
          ...next.notifications,
        ]
      }

      appendAudit(next, 'UPDATE_TICKET', 'TICKETS', `Updated ticket ${id}`)
      return next
    })
  }, [appendAudit, commit])

  const addTicketComment = useCallback(async (ticketId: string, content: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      const user = getAuthUser()
      next.tickets = next.tickets.map(ticket => ticket.id === ticketId
        ? {
            ...ticket,
            comments: [
              ...(ticket.comments || []),
              {
                id: createId('comment'),
                content,
                createdAt: new Date().toISOString(),
                authorId: user?.id || 'system',
                authorName: user?.name || 'System',
              },
            ],
          }
        : ticket)

      appendAudit(next, 'COMMENT_TICKET', 'TICKETS', `Added comment to ticket ${ticketId}`)
      return next
    })
  }, [appendAudit, commit])

  const assignTicket = useCallback(async (id: string, employeeId: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      const before = next.tickets.find(item => item.id === id)
      const assignee = next.employees.find(item => item.id === employeeId)
      next.tickets = next.tickets.map(ticket => ticket.id === id
        ? {
            ...ticket,
            assignedToId: employeeId || undefined,
            assignedToName: assignee?.name,
          }
        : ticket)

      if (employeeId && before && employeeId !== before.assignedToId) {
        next.notifications = [
          {
            id: createId('notif'),
            title: 'Ticket assigned to you',
            message: `You have been assigned "${before.title}" (priority: ${before.priority}).`,
            type: 'info',
            createdAt: new Date().toISOString(),
            isRead: false,
            targetEmployeeId: employeeId,
          },
          ...next.notifications,
        ]
      }

      appendAudit(next, 'ASSIGN_TICKET', 'TICKETS', `Assigned ticket ${id} to ${assignee?.name || 'nobody'}`)
      return next
    })
  }, [appendAudit, commit])

  const createTrainingPlan = useCallback(async (plan: Partial<TrainingPlan>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.trainingPlans = [
        {
          id: createId('training'),
          title: plan.title || 'New training plan',
          description: plan.description,
          startDate: plan.startDate || new Date().toISOString().split('T')[0],
          endDate: plan.endDate,
          status: plan.status || 'planned',
          employeeId: plan.employeeId || getCurrentEmployeeSnapshot(next)?.id || 'unknown',
          employeeName: plan.employeeName,
        },
        ...next.trainingPlans,
      ]
      appendAudit(next, 'CREATE_TRAINING', 'TRAINING', `Created training plan ${plan.title || 'untitled'}`)
      return next
    })
  }, [appendAudit, commit])

  const generatePayroll = useCallback(async (data: Partial<Payroll>) => {
    commit(previous => {
      const next = structuredClone(previous)
      const month = data.month || new Date().getMonth() + 1
      const year = data.year || new Date().getFullYear()
      const basicSalary = data.basicSalary || 3200
      const allowances = data.allowances || 300
      const deductions = data.deductions || 150
      const netSalary = data.netSalary || basicSalary + allowances - deductions

      next.payrolls = [
        {
          id: createId('pay'),
          employeeId: data.employeeId || getCurrentEmployeeSnapshot(next)?.id || 'unknown',
          employeeName: data.employeeName || getCurrentEmployeeSnapshot(next)?.name,
          status: data.status || 'paid',
          periodStart: data.periodStart || `${year}-${String(month).padStart(2, '0')}-01`,
          periodEnd: data.periodEnd || `${year}-${String(month).padStart(2, '0')}-28`,
          netAmount: netSalary,
          month,
          year,
          basicSalary,
          allowances,
          deductions,
          netSalary,
        },
        ...next.payrolls,
      ]
      appendAudit(next, 'CREATE_PAYROLL', 'PAYROLL', `Generated payroll for ${month}/${year}`)
      return next
    })
  }, [appendAudit, commit])

  const uploadDocument = useCallback(async (formData: FormData) => {
    commit(previous => {
      const next = structuredClone(previous)
      const file = formData.get('file') as File | null
      const user = getAuthUser()
      const newDocument: Document = {
        id: createId('doc'),
        title: (formData.get('title') as string) || file?.name || 'Untitled Document',
        fileName: file?.name || 'document.txt',
        fileType: file?.type || 'text/plain',
        fileSize: file?.size || 1024,
        filePath: '',
        version: 1,
        isLatest: true,
        description: (formData.get('description') as string) || '',
        category: (formData.get('category') as string) || 'General',
        isPublic: formData.get('isPublic') === 'true',
        uploadedById: user?.id || 'system',
        uploadedByName: user?.name || 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      next.documents = [newDocument, ...next.documents]
      next.documentLogs = [
        {
          id: createId('doclog'),
          documentId: newDocument.id,
          userId: user?.id || 'system',
          action: 'UPDATE',
          createdAt: new Date().toISOString(),
        },
        ...next.documentLogs,
      ]
      appendAudit(next, 'UPLOAD_DOCUMENT', 'DOCUMENTS', `Uploaded document ${newDocument.title}`)
      return next
    })
  }, [appendAudit, commit])

  const uploadNewVersion = useCallback(async (documentId: string, formData: FormData) => {
    commit(previous => {
      const next = structuredClone(previous)
      const file = formData.get('file') as File | null
      next.documents = next.documents.map(document => {
        if (document.id !== documentId) return document

        return {
          ...document,
          version: document.version + 1,
          fileName: file?.name || document.fileName,
          fileType: file?.type || document.fileType,
          fileSize: file?.size || document.fileSize,
          updatedAt: new Date().toISOString(),
        }
      })
      appendAudit(next, 'VERSION_DOCUMENT', 'DOCUMENTS', `Uploaded new version for ${documentId}`)
      return next
    })
  }, [appendAudit, commit])

  const downloadDocument = useCallback(async (id: string, fileName: string) => {
    const selectedDocument = state.documents.find(item => item.id === id)
    const user = getAuthUser()

    commit(previous => {
      const next = structuredClone(previous)
      next.documentLogs = [
        {
          id: createId('doclog'),
          documentId: id,
          userId: user?.id || 'system',
          action: 'DOWNLOAD',
          createdAt: new Date().toISOString(),
        },
        ...next.documentLogs,
      ]
      appendAudit(next, 'DOWNLOAD_DOCUMENT', 'DOCUMENTS', `Downloaded ${fileName}`)
      return next
    })

    if (typeof window !== 'undefined' && selectedDocument) {
      const blob = new Blob(
        [
          `Document: ${selectedDocument.title}\n`,
          `Category: ${selectedDocument.category}\n`,
          `Version: ${selectedDocument.version}\n`,
          `This is a demo download generated in the frontend-only environment.\n`,
        ],
        { type: 'text/plain' },
      )
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = fileName.replace(/\.[^.]+$/, '') + '.txt'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }
  }, [appendAudit, commit, state.documents])

  const deleteDocument = useCallback(async (id: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.documents = next.documents.filter(document => document.id !== id)
      appendAudit(next, 'DELETE_DOCUMENT', 'DOCUMENTS', `Deleted document ${id}`)
      return next
    })
  }, [appendAudit, commit])

  const submitSurveyResponse = useCallback(async (surveyId: string, answers: any) => {
    commit(previous => {
      const next = structuredClone(previous)
      appendAudit(next, 'SUBMIT_SURVEY', 'FEEDBACK', `Submitted survey ${surveyId} with ${Object.keys(answers || {}).length} answers`)
      return next
    })
  }, [appendAudit, commit])

  const createPerformanceFeedback = useCallback(async (data: Partial<PerformanceFeedback>) => {
    commit(previous => {
      const next = structuredClone(previous)
      const author = getCurrentEmployeeSnapshot(next)
      const recipient = next.employees.find(employee => employee.id === data.employeeId)
      next.performanceFeedback = [
        {
          id: createId('feedback'),
          content: data.content || '',
          rating: data.rating,
          employeeId: data.employeeId || 'unknown',
          employeeName: recipient?.name,
          authorId: author?.id || 'unknown',
          authorName: author?.name || 'Current User',
          createdAt: new Date().toISOString(),
        },
        ...next.performanceFeedback,
      ]
      appendAudit(next, 'CREATE_FEEDBACK', 'FEEDBACK', `Created feedback for ${recipient?.name || data.employeeId}`)
      return next
    })
  }, [appendAudit, commit])

  const fetchAuditLogs = useCallback(async () => {
    setState(previous => ({ ...previous }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.notifications = next.notifications.map(notification => notification.id === id ? { ...notification, isRead: true } : notification)
      return next
    })
  }, [commit])

  const markAllNotificationsRead = useCallback(() => {
    commit(previous => {
      const next = structuredClone(previous)
      next.notifications = next.notifications.map(notification => ({ ...notification, isRead: true }))
      return next
    })
  }, [commit])

  const addTool = useCallback((tool: Partial<ToolRecord>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.tools = [
        {
          id: createId('tool'),
          name: tool.name || 'New Tool',
          description: tool.description || 'Internal application',
          category: tool.category || 'General',
          url: tool.url || 'https://example.com',
          visibility: tool.visibility || ['employee', 'manager', 'admin'],
          active: tool.active ?? true,
        },
        ...next.tools,
      ]
      appendAudit(next, 'CREATE_TOOL', 'TOOLS', `Created tool ${tool.name || 'New Tool'}`)
      return next
    })
  }, [appendAudit, commit])

  const updateTool = useCallback((id: string, tool: Partial<ToolRecord>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.tools = next.tools.map(item => item.id === id ? { ...item, ...tool } : item)
      appendAudit(next, 'UPDATE_TOOL', 'TOOLS', `Updated tool ${id}`)
      return next
    })
  }, [appendAudit, commit])

  const addRole = useCallback((role: Partial<RoleRecord>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.roles = [
        {
          id: createId('role'),
          name: role.name || 'Custom Role',
          code: role.code || `role_${createId('code')}`,
          description: role.description || 'User-defined permission set',
          permissions: role.permissions || [],
          memberCount: role.memberCount || 0,
          system: false,
        },
        ...next.roles,
      ]
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'CREATE_ROLE', 'RBAC', `Created role ${role.name || 'Custom Role'}`)
      return synchronized
    })
  }, [appendAudit, commit])

  const updateRole = useCallback((id: string, role: Partial<RoleRecord>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.roles = next.roles.map(item => item.id === id ? { ...item, ...role } : item)
      const synchronized = synchronizeRoles(next)
      appendAudit(next, 'UPDATE_ROLE', 'RBAC', `Updated role ${id}`)
      return synchronized
    })
  }, [appendAudit, commit])

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.settings = { ...next.settings, ...settings }
      appendAudit(next, 'UPDATE_SETTINGS', 'SYSTEM', 'Updated general settings')
      return next
    })
  }, [appendAudit, commit])

  const toggleOnboardingTask = useCallback((planId: string, taskId: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.onboardingPlans = next.onboardingPlans.map(plan => {
        if (plan.id !== planId) return plan

        const tasks = plan.tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task)
        const progress = Math.round((tasks.filter(task => task.done).length / tasks.length) * 100)
        return { ...plan, tasks, progress }
      })
      appendAudit(next, 'UPDATE_ONBOARDING', 'ONBOARDING', `Updated onboarding plan ${planId}`)
      return next
    })
  }, [appendAudit, commit])

  // -------- F3 Bulk employee + CSV export --------
  const bulkActivateEmployees = useCallback(async (ids: string[], active: boolean) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.employees = next.employees.map(e =>
        ids.includes(e.id) ? { ...e, status: active ? 'active' : 'inactive' } : e,
      )
      appendAudit(next, active ? 'BULK_ACTIVATE' : 'BULK_DEACTIVATE', 'EMPLOYEES', `${ids.length} employees`)
      return next
    })
  }, [appendAudit, commit])

  const exportEmployeesCsv = useCallback(() => {
    if (typeof window === 'undefined') return
    const header = ['id','name','email','phone','department','position','status','contractType','joinDate','dateOfBirth','workLocation']
    const escape = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = state.employees.map(e => [
      e.id, e.name, e.email, e.phone, e.department, e.position, e.status,
      e.contractType ?? '', e.joinDate, e.dateOfBirth ?? '', e.workLocation ?? '',
    ].map(escape).join(','))
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = 'employees.csv'
    window.document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }, [state.employees])

  // -------- F5 Leave config + cancel + balance --------
  const upsertLeaveType = useCallback((lt: Partial<LeaveType>) => {
    commit(previous => {
      const next = structuredClone(previous)
      if (lt.id) {
        next.leaveTypes = next.leaveTypes.map(x => x.id === lt.id ? { ...x, ...lt } as LeaveType : x)
      } else {
        next.leaveTypes = [...next.leaveTypes, {
          id: createId('lt'), code: (lt.code || 'CUSTOM').toUpperCase(), name: lt.name || 'Custom',
          annualEntitlementDays: lt.annualEntitlementDays ?? 0, isActive: lt.isActive ?? true,
        }]
      }
      appendAudit(next, 'UPSERT_LEAVE_TYPE', 'LEAVE', `${lt.name || lt.code}`)
      return next
    })
  }, [appendAudit, commit])

  const upsertHoliday = useCallback((h: Partial<Holiday>) => {
    commit(previous => {
      const next = structuredClone(previous)
      if (h.id) {
        next.holidays = next.holidays.map(x => x.id === h.id ? { ...x, ...h } as Holiday : x)
      } else {
        next.holidays = [...next.holidays, {
          id: createId('h'), date: h.date || new Date().toISOString().slice(0,10),
          name: h.name || 'Holiday', recurring: h.recurring ?? false,
        }]
      }
      appendAudit(next, 'UPSERT_HOLIDAY', 'LEAVE', `${h.name || h.date}`)
      return next
    })
  }, [appendAudit, commit])

  const cancelLeaveRequest = useCallback((id: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.leaveRequests = next.leaveRequests.map(l =>
        l.id === id ? { ...l, status: 'rejected' as const } : l,
      )
      appendAudit(next, 'CANCEL_LEAVE', 'LEAVE', id)
      return next
    })
  }, [appendAudit, commit])

  const getLeaveBalance = useCallback((employeeId: string) => {
    return state.leaveTypes.filter(t => t.isActive).map(leaveType => {
      const requests = state.leaveRequests.filter(l => l.employeeId === employeeId && l.type === leaveType.code.toLowerCase() as any)
      const used = requests.filter(r => r.status === 'approved').length
      const pending = requests.filter(r => r.status === 'pending').length
      return {
        leaveType,
        entitlement: leaveType.annualEntitlementDays,
        used,
        pending,
        available: Math.max(0, leaveType.annualEntitlementDays - used - pending),
      }
    })
  }, [state.leaveRequests, state.leaveTypes])

  // -------- F4 Attendance --------
  const todayKey = () => new Date().toISOString().slice(0, 10)

  const getMyAttendanceState = useCallback((): { state: AttendanceState; record?: AttendanceRecord } => {
    const user = getAuthUser()
    if (!user) return { state: 'idle' as AttendanceState }
    const record = state.attendance.find(r => r.employeeId === user.employeeId && r.date === todayKey())
    if (!record) return { state: 'idle' as AttendanceState }
    let s: AttendanceState = 'idle'
    for (const e of record.events) {
      if (e.type === 'clock_in') s = 'working'
      else if (e.type === 'break_start' && s === 'working') s = 'on_break'
      else if (e.type === 'break_end' && s === 'on_break') s = 'working'
      else if (e.type === 'clock_out' && s === 'working') s = 'ended'
    }
    return { state: s, record }
  }, [state.attendance])

  const submitAttendanceAction = useCallback(async (action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => {
    const user = getAuthUser()
    if (!user) return
    const { state: currentState } = getMyAttendanceState()
    const transitions: Record<AttendanceState, Partial<Record<typeof action, AttendanceState>>> = {
      idle: { clock_in: 'working' },
      working: { break_start: 'on_break', clock_out: 'ended' },
      on_break: { break_end: 'working' },
      ended: {},
    }
    if (!transitions[currentState][action]) {
      throw new Error(`Cannot ${action} from ${currentState}`)
    }
    commit(previous => {
      const next = structuredClone(previous)
      const day = todayKey()
      let record = next.attendance.find(r => r.employeeId === user.employeeId && r.date === day)
      if (!record) {
        record = { id: createId('rec'), employeeId: user.employeeId, date: day, workedMinutes: 0, breakMinutes: 0, status: 'open', events: [] }
        next.attendance = [...next.attendance, record]
      }
      record.events = [...record.events, { id: createId('ev'), type: action, occurredAt: new Date().toISOString(), source: 'user' }]
      // recompute
      let workedMs = 0, breakMs = 0
      let pairStart: number | null = null, breakStart: number | null = null
      for (const e of record.events) {
        const t = new Date(e.occurredAt).getTime()
        if (e.type === 'clock_in') pairStart = t
        else if (e.type === 'break_start' && pairStart !== null) { workedMs += t - pairStart; pairStart = null; breakStart = t }
        else if (e.type === 'break_end' && breakStart !== null) { breakMs += t - breakStart; breakStart = null; pairStart = t }
        else if (e.type === 'clock_out' && pairStart !== null) { workedMs += t - pairStart; pairStart = null }
      }
      record.workedMinutes = Math.floor(workedMs / 60000)
      record.breakMinutes = Math.floor(breakMs / 60000)
      record.status = record.events.some(e => e.type === 'clock_out') ? 'closed' : 'open'
      next.attendance = next.attendance.map(r => r.id === record!.id ? record! : r)
      appendAudit(next, 'ATTENDANCE_ACTION', 'ATTENDANCE', action)
      return next
    })
  }, [appendAudit, commit, getMyAttendanceState])

  const getTeamAttendance = useCallback(() => {
    const user = getAuthUser()
    if (!user) return []
    const today = todayKey()
    return state.employees
      .filter(e => e.managerId === user.employeeId)
      .map(e => {
        const rec = state.attendance.find(r => r.employeeId === e.id && r.date === today)
        let s: AttendanceState = 'idle'
        if (rec) {
          for (const ev of rec.events) {
            if (ev.type === 'clock_in') s = 'working'
            else if (ev.type === 'break_start') s = 'on_break'
            else if (ev.type === 'break_end') s = 'working'
            else if (ev.type === 'clock_out') s = 'ended'
          }
        }
        return { employeeId: e.id, fullName: e.name, state: s, workedMinutes: rec?.workedMinutes ?? 0, breakMinutes: rec?.breakMinutes ?? 0 }
      })
  }, [state.attendance, state.employees])

  // -------- F7 Ticket extras --------
  const rateTicket = useCallback(async (id: string, rating: number, feedback?: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.tickets = next.tickets.map(t =>
        t.id === id ? { ...t, resolutionRating: rating, resolutionFeedback: feedback } : t,
      )
      appendAudit(next, 'RATE_TICKET', 'TICKETS', `${id}:${rating}`)
      return next
    })
  }, [appendAudit, commit])

  const mergeTicket = useCallback(async (sourceId: string, targetId: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.tickets = next.tickets.map(t =>
        t.id === sourceId ? { ...t, mergedIntoId: targetId, status: 'closed' as const, closedAt: new Date().toISOString() } : t,
      )
      appendAudit(next, 'MERGE_TICKET', 'TICKETS', `${sourceId} → ${targetId}`)
      return next
    })
  }, [appendAudit, commit])

  const setCommentInternal = useCallback((commentId: string, isInternal: boolean) => {
    commit(previous => {
      const next = structuredClone(previous)
      next.tickets = next.tickets.map(t => ({
        ...t,
        comments: t.comments?.map(c => c.id === commentId ? { ...c, isInternal } : c),
      }))
      return next
    })
  }, [commit])

  // -------- F8 Facility --------
  const upsertFacilityLocation = useCallback((loc: Partial<FacilityLocation>) => {
    commit(previous => {
      const next = structuredClone(previous)
      if (loc.id) {
        next.facilityLocations = next.facilityLocations.map(x => x.id === loc.id ? { ...x, ...loc } as FacilityLocation : x)
      } else {
        next.facilityLocations = [...next.facilityLocations, {
          id: createId('loc'), name: loc.name || 'New location', type: loc.type || 'office_area',
          building: loc.building, floor: loc.floor, isActive: loc.isActive ?? true,
        }]
      }
      return next
    })
  }, [commit])

  const upsertFacilityAsset = useCallback((asset: Partial<FacilityAsset>) => {
    commit(previous => {
      const next = structuredClone(previous)
      if (asset.id) {
        next.facilityAssets = next.facilityAssets.map(x => x.id === asset.id ? { ...x, ...asset } as FacilityAsset : x)
      } else {
        next.facilityAssets = [...next.facilityAssets, {
          id: createId('asset'), name: asset.name || 'Asset', type: asset.type, serialNumber: asset.serialNumber,
          status: asset.status ?? 'active', locationId: asset.locationId || next.facilityLocations[0]?.id || '',
        }]
      }
      return next
    })
  }, [commit])

  const createFacilityRequest = useCallback(async (req: Partial<FacilityRequest>) => {
    const user = getAuthUser()
    commit(previous => {
      const next = structuredClone(previous)
      const created: FacilityRequest = {
        id: createId('freq'),
        title: req.title || 'Facility request',
        description: req.description || '',
        issueType: req.issueType || 'other',
        urgency: req.urgency ?? 'normal',
        status: 'open',
        reporterEmployeeId: user?.employeeId || '',
        locationId: req.locationId || next.facilityLocations[0]?.id || '',
        assetId: req.assetId,
        photos: req.photos ?? [],
        createdAt: new Date().toISOString(),
      }
      next.facilityRequests = [created, ...next.facilityRequests]
      appendAudit(next, 'CREATE_FACILITY_REQUEST', 'FACILITY', created.id)
      return next
    })
  }, [appendAudit, commit])

  const escalateFacilityToTicket = useCallback(async (id: string) => {
    commit(previous => {
      const next = structuredClone(previous)
      const req = next.facilityRequests.find(r => r.id === id)
      if (!req || req.ticketId) return previous
      const ticket: Ticket = {
        id: createId('tic'),
        title: `[Facility] ${req.title}`,
        description: req.description,
        priority: req.urgency === 'critical' ? 'urgent' : req.urgency === 'high' ? 'high' : 'medium',
        status: 'new',
        employeeId: req.reporterEmployeeId,
        createdAt: new Date().toISOString(),
        location: next.facilityLocations.find(l => l.id === req.locationId)?.name,
      }
      next.tickets = [ticket, ...next.tickets]
      next.facilityRequests = next.facilityRequests.map(r => r.id === id ? { ...r, ticketId: ticket.id } : r)
      appendAudit(next, 'ESCALATE_FACILITY', 'FACILITY', id)
      return next
    })
  }, [appendAudit, commit])

  useEffect(() => {
    setEmployeeDirectory(state.employees)
  }, [state.employees])

  const value = useMemo(() => ({
    ...state,
    employees: employeeDirectory,
    isLoading,
    error,
    addEmployee,
    addBulkEmployees,
    updateEmployee,
    deleteEmployee,
    submitLeaveRequest,
    updateLeaveRequest,
    getEmployeeLeaves,
    createTicket,
    updateTicket,
    addTicketComment,
    assignTicket,
    createTrainingPlan,
    generatePayroll,
    uploadDocument,
    uploadNewVersion,
    downloadDocument,
    deleteDocument,
    submitSurveyResponse,
    createPerformanceFeedback,
    fetchAuditLogs,
    refreshData,
    advancedSearch,
    markNotificationRead,
    markAllNotificationsRead,
    addTool,
    updateTool,
    addRole,
    updateRole,
    updateSettings,
    toggleOnboardingTask,
    bulkActivateEmployees,
    exportEmployeesCsv,
    upsertLeaveType,
    upsertHoliday,
    cancelLeaveRequest,
    getLeaveBalance,
    getMyAttendanceState,
    submitAttendanceAction,
    getTeamAttendance,
    rateTicket,
    mergeTicket,
    setCommentInternal,
    upsertFacilityLocation,
    upsertFacilityAsset,
    createFacilityRequest,
    escalateFacilityToTicket,
    isDemoMode: true,
  }), [
    state,
    employeeDirectory,
    isLoading,
    error,
    addEmployee,
    addBulkEmployees,
    updateEmployee,
    deleteEmployee,
    submitLeaveRequest,
    updateLeaveRequest,
    getEmployeeLeaves,
    createTicket,
    updateTicket,
    addTicketComment,
    assignTicket,
    createTrainingPlan,
    generatePayroll,
    uploadDocument,
    uploadNewVersion,
    downloadDocument,
    deleteDocument,
    submitSurveyResponse,
    createPerformanceFeedback,
    fetchAuditLogs,
    refreshData,
    advancedSearch,
    markNotificationRead,
    markAllNotificationsRead,
    addTool,
    updateTool,
    addRole,
    updateRole,
    updateSettings,
    toggleOnboardingTask,
    bulkActivateEmployees,
    exportEmployeesCsv,
    upsertLeaveType,
    upsertHoliday,
    cancelLeaveRequest,
    getLeaveBalance,
    getMyAttendanceState,
    submitAttendanceAction,
    getTeamAttendance,
    rateTicket,
    mergeTicket,
    setCommentInternal,
    upsertFacilityLocation,
    upsertFacilityAsset,
    createFacilityRequest,
    escalateFacilityToTicket,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
