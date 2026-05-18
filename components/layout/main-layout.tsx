'use client'

import { Suspense, lazy, useContext, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import Header from './header'
import Sidebar from './sidebar'
import { Menu, X } from 'lucide-react'

// Landing page is eager (charge.docx NFR — dashboard < 2 s).
import Dashboard from '@/components/modules/dashboard'

// Heavy modules — lazy-loaded so they don't block first paint.
const EmployeeList = lazy(() => import('@/components/modules/employee-list'))
const EmployeeForm = lazy(() => import('@/components/modules/employee-form'))
const LeaveRequests = lazy(() => import('@/components/modules/leave-requests'))
const MyLeaves = lazy(() => import('@/components/modules/my-leaves'))
const ProfilePage = lazy(() => import('@/components/modules/profile-page'))
const Tickets = lazy(() => import('@/components/modules/tickets'))
const PayrollList = lazy(() => import('@/components/modules/payroll-list'))
const DocumentList = lazy(() => import('@/components/modules/document-list'))
const FacilityManagement = lazy(() => import('@/components/modules/facility-management'))
const JobTitles = lazy(() => import('@/components/modules/job-titles'))
const FeedbackModule = lazy(() => import('@/components/modules/feedback'))
const TrainingList = lazy(() => import('@/components/modules/training-list'))
const OnboardingList = lazy(() => import('@/components/modules/onboarding-list'))
const StaffDirectory = lazy(() => import('@/components/modules/staff-directory'))
const Tools = lazy(() => import('@/components/modules/tools'))
const AdminSettings = lazy(() => import('@/components/modules/admin-settings'))
const RoleManagement = lazy(() => import('@/components/modules/role-management'))
const TimeTracking = lazy(() => import('@/components/modules/time-tracking'))
const LeaveConfig = lazy(() => import('@/components/modules/leave-config'))
const AdminLeaves = lazy(() => import('@/components/modules/admin-leaves'))
const AuditLogs = lazy(() => import('@/components/modules/audit-logs'))

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { isDemoMode } = useContext(AppContext)

  if (!user) return null

  const handleModuleChange = (m: string) => {
    setActiveModule(m)
    setMobileSidebarOpen(false)
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={handleModuleChange} />
      case 'employees':
        return editingEmployeeId || creatingEmployee ? (
          <EmployeeForm
            employeeId={editingEmployeeId ?? undefined}
            onClose={() => { setEditingEmployeeId(null); setCreatingEmployee(false) }}
          />
        ) : (
          <EmployeeList
            onEditEmployee={setEditingEmployeeId}
            onAddEmployee={() => setCreatingEmployee(true)}
          />
        )
      case 'directory':
        return <StaffDirectory />
      case 'leaves':
        if (user.role === 'admin' || user.role === 'hr') return <AdminLeaves />
        return user.role === 'manager' ? (
          <AdminLeaves />
        ) : (
          <MyLeaves onSwitchToRequest={() => handleModuleChange('leave-request')} />
        )
      case 'leave-request':
        return <LeaveRequests isRequestForm={true} />
      case 'team-leaves':
        return <LeaveRequests />
      case 'tickets':
        return <Tickets />
      case 'documents':
        return <DocumentList />
      case 'facility':
        return <FacilityManagement />
      case 'job-titles':
        return <JobTitles />
      case 'payroll':
        return <PayrollList />
      case 'tools':
        return <Tools />
      case 'onboarding':
        return <OnboardingList />
      case 'training':
        return <TrainingList />
      case 'feedback':
        return <FeedbackModule />
      case 'admin-settings':
        return <AdminSettings />
      case 'role-management':
        return <RoleManagement />
      case 'time-tracking':
        return <TimeTracking />
      case 'leave-config':
        return <LeaveConfig />
      case 'profile':
        return <ProfilePage />
      case 'audit-logs':
        return <AuditLogs />
      case 'attendance-policy':
        return <AdminSettings />
      default:
        return <Dashboard onNavigate={handleModuleChange} />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 relative">
      {isDemoMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold shadow-sm border border-amber-200 flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          Demo Mode (Backend Offline)
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar activeModule={activeModule} setActiveModule={handleModuleChange} userRole={user.role} />
      </div>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar activeModule={activeModule} setActiveModule={handleModuleChange} userRole={user.role} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Open menu"
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="font-bold text-slate-900">IntraConnect</h2>
          <div className="w-9" />
        </div>

        <Header user={user} onLogout={logout} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Suspense fallback={<ModuleFallback />}>
            {renderModule()}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
