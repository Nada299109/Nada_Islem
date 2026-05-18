'use client'

import { useContext, useMemo } from 'react'
import { AuthContext } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Users, FileText, CheckCircle, Clock, Building2, ShieldAlert, Network, UserPlus, Ticket as TicketIcon, Folder, Wallet, Wrench, Timer, ClipboardList, ChevronRight } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardProps {
  onNavigate?: (module: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { user } = useContext(AuthContext)
  const { employees, leaveRequests, tickets, documents, payrolls, tools, attendance, facilityRequests, surveys } = useContext(AppContext)
  const go = (m: string) => onNavigate?.(m)
  const activeSurveys = surveys.filter((s: any) => s.isActive).slice(0, 3)

  const { activeCount, inactiveCount } = useMemo(() => ({
    activeCount: employees.filter(e => e.status === 'active').length,
    inactiveCount: employees.filter(e => e.status === 'inactive').length,
  }), [employees])

  const deptData = useMemo(() => {
    const raw = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(raw).map(([name, value]) => ({ name, value }))
  }, [employees])

  const { pendingLeaves, approvedLeaves, rejectedLeaves, leaveData } = useMemo(() => {
    const pending = leaveRequests.filter(l => l.status === 'pending').length
    const approved = leaveRequests.filter(l => l.status === 'approved').length
    const rejected = leaveRequests.filter(l => l.status === 'rejected').length
    return {
      pendingLeaves: pending,
      approvedLeaves: approved,
      rejectedLeaves: rejected,
      leaveData: [
        { name: 'Approved', value: approved },
        { name: 'Pending', value: pending },
        { name: 'Rejected', value: rejected },
      ],
    }
  }, [leaveRequests])

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Employees</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{employees.length}</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Employees</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {activeCount}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Leaves</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{pendingLeaves}</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Approved Leaves</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{approvedLeaves}</p>
          </div>
        </Card>
      </div>

      {activeSurveys.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg"><ClipboardList size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Active Surveys</h2>
                <p className="text-xs text-slate-500">Share your feedback — your responses stay anonymous.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-700" onClick={() => go('feedback')}>
              See all <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeSurveys.map((s: any) => (
              <button
                key={s.id}
                onClick={() => go('feedback')}
                className="text-left p-4 bg-white border border-indigo-100 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-slate-900 line-clamp-1">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                <p className="text-xs text-indigo-600 mt-3 font-medium">Participate →</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Employees by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Leave Request Distribution</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Approved' ? '#10b981' : entry.name === 'Pending' ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {/* Tickets — charge.docx §4.4 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('tickets')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('tickets')}
          className="p-5 border-l-4 border-l-rose-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <TicketIcon className="text-rose-500" size={20} />
            <h3 className="font-bold">Help Desk</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Open</span><span className="font-semibold">{tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">SLA breached</span><span className="font-semibold text-rose-600">{tickets.filter(t => t.slaStatus === 'BREACHED').length}</span></div>
          </div>
        </Card>

        {/* Facility — charge.docx §4.5 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('facility')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('facility')}
          className="p-5 border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-amber-500" size={20} />
            <h3 className="font-bold">Facility</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Open requests</span><span className="font-semibold">{facilityRequests.filter(r => r.status !== 'closed' && r.status !== 'resolved').length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Critical</span><span className="font-semibold text-rose-600">{facilityRequests.filter(r => r.urgency === 'critical').length}</span></div>
          </div>
        </Card>

        {/* Documents — charge.docx §4.7 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('documents')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('documents')}
          className="p-5 border-l-4 border-l-violet-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Folder className="text-violet-500" size={20} />
            <h3 className="font-bold">Documents</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-semibold">{documents.filter(d => d.isLatest && !d.isDeleted).length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Expiring soon</span><span className="font-semibold text-amber-600">{documents.filter(d => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() < 30 * 24 * 3600 * 1000 && new Date(d.expiresAt).getTime() > Date.now()).length}</span></div>
          </div>
        </Card>

        {/* Payroll — charge.docx §4.8 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('payroll')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('payroll')}
          className="p-5 border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-emerald-500" size={20} />
            <h3 className="font-bold">Payroll</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Payslips</span><span className="font-semibold">{payrolls.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Latest period</span><span className="font-semibold">{payrolls[0] ? `${payrolls[0].month}/${payrolls[0].year}` : '—'}</span></div>
          </div>
        </Card>

        {/* Time Tracking — charge.docx §4.12 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('time-tracking')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('time-tracking')}
          className="p-5 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Timer className="text-blue-500" size={20} />
            <h3 className="font-bold">Attendance</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Records today</span><span className="font-semibold">{attendance.filter(r => r.date === new Date().toISOString().slice(0,10)).length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total worked</span><span className="font-semibold">{(() => { const m = attendance.reduce((s, r) => s + r.workedMinutes, 0); return `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, '0')}m` })()}</span></div>
          </div>
        </Card>

        {/* Tools — charge.docx §4.11 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('tools')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('tools')}
          className="p-5 border-l-4 border-l-cyan-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="text-cyan-500" size={20} />
            <h3 className="font-bold">Tools</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-semibold">{tools.filter(t => t.active).length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{tools.length}</span></div>
          </div>
        </Card>

        {/* Audit (Admin) */}
        {user?.role === 'admin' && (
          <Card
            role="button"
            tabIndex={0}
            onClick={() => go('audit-logs')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('audit-logs')}
            className="p-5 border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-indigo-500" size={20} />
              <h3 className="font-bold">Security & Audit</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Mapped Roles</span><span className="font-semibold">{employees.length > 0 ? new Set(employees.map(e => e.roleId)).size : 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Critical Alerts</span><span className="font-semibold text-emerald-600">0</span></div>
            </div>
          </Card>
        )}

        {/* Org structure */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => go('directory')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go('directory')}
          className="p-5 border-l-4 border-l-slate-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Network className="text-slate-500" size={20} />
            <h3 className="font-bold">Org Structure</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Departments</span><span className="font-semibold">{new Set(employees.map(e => e.department)).size}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-semibold">{activeCount}</span></div>
          </div>
        </Card>
      </div>
    </div>
  )
}
