'use client'

import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail, Phone, Briefcase, Calendar, Building2, User, Shield,
  Folder, History, KeyRound, MapPin, Save, Lock,
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useContext(AuthContext)
  const { employees, updateEmployee, documents, auditLogs } = useContext(AppContext)

  const employee = useMemo(
    () => employees.find(e => e.id === user?.employeeId),
    [employees, user?.employeeId],
  )

  const [form, setForm] = useState({
    name: employee?.name ?? user?.name ?? '',
    phone: employee?.phone ?? '',
    address: employee?.address ?? '',
    dateOfBirth: employee?.dateOfBirth ?? '',
    emergencyName: employee?.emergencyName ?? '',
    emergencyPhone: employee?.emergencyPhone ?? '',
    emergencyRelation: employee?.emergencyRelation ?? '',
  })

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [savedFlash, setSavedFlash] = useState<string | null>(null)

  const personalDocs = useMemo(
    () => documents.filter(d => d.uploadedById === user?.employeeId || d.type === 'personal'),
    [documents, user?.employeeId],
  )

  const myActivity = useMemo(
    () =>
      auditLogs
        .filter(l => l.userId === user?.id || l.userId === user?.employeeId)
        .slice(0, 15),
    [auditLogs, user],
  )

  if (!user) return null

  const handleSavePersonal = async () => {
    if (!user.employeeId) return
    await updateEmployee(user.employeeId, form)
    setSavedFlash('Personal info saved.')
    setTimeout(() => setSavedFlash(null), 2500)
  }

  const handleChangePassword = () => {
    if (!pwdForm.current || !pwdForm.next || pwdForm.next !== pwdForm.confirm) {
      setSavedFlash('Check your password fields.')
      setTimeout(() => setSavedFlash(null), 2500)
      return
    }
    // Demo-only — wire to backend POST /auth/change-password when available.
    setSavedFlash('Password change submitted (demo).')
    setPwdForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setSavedFlash(null), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-500">{user.position ?? '—'} · {user.department ?? '—'}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge>{user.role.toUpperCase()}</Badge>
            {employee?.status && <Badge variant="outline">{employee.status}</Badge>}
            {employee?.contractType && <Badge variant="outline">{employee.contractType}</Badge>}
          </div>
        </div>
      </div>

      {savedFlash && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          {savedFlash}
        </div>
      )}

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-slate-100 h-10 p-1">
          <TabsTrigger value="personal" className="gap-2"><User size={14} /> Personal</TabsTrigger>
          <TabsTrigger value="employment" className="gap-2"><Briefcase size={14} /> Employment</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield size={14} /> Security</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><Folder size={14} /> Documents</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><History size={14} /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-6 bg-white max-w-3xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
                <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <Textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Emergency contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Name" value={form.emergencyName} onChange={e => setForm({ ...form, emergencyName: e.target.value })} />
                <Input placeholder="Phone" value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} />
                <Input placeholder="Relation" value={form.emergencyRelation} onChange={e => setForm({ ...form, emergencyRelation: e.target.value })} />
              </div>
            </div>

            <Button onClick={handleSavePersonal} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Save size={16} /> Save changes
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card className="p-6 bg-white max-w-3xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Employment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-3"><Mail className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Email</p><p className="text-slate-900 font-medium">{user.email}</p></div></div>
              <div className="flex gap-3"><Building2 className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Department</p><p className="text-slate-900 font-medium">{user.department || 'N/A'}</p></div></div>
              <div className="flex gap-3"><Briefcase className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Position</p><p className="text-slate-900 font-medium">{user.position || 'N/A'}</p></div></div>
              <div className="flex gap-3"><Calendar className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Hire date</p><p className="text-slate-900 font-medium">{employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString() : 'N/A'}</p></div></div>
              <div className="flex gap-3"><Shield className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Role</p><p className="text-slate-900 font-medium capitalize">{user.role}</p></div></div>
              <div className="flex gap-3"><MapPin className="text-blue-600 flex-shrink-0" size={20} /><div><p className="text-slate-600">Work location</p><p className="text-slate-900 font-medium">{employee?.workLocation || 'N/A'}</p></div></div>
            </div>
            <p className="text-xs text-slate-500 pt-2">
              Employment fields are read-only — contact HR to request changes.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 bg-white max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound size={18} /> Change password
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Minimum 8 characters. Required after first login (charge.docx §4.1).
              </p>
              <div className="grid grid-cols-1 gap-3 mt-4">
                <Input type="password" placeholder="Current password" value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} />
                <Input type="password" placeholder="New password" value={pwdForm.next} onChange={e => setPwdForm({ ...pwdForm, next: e.target.value })} />
                <Input type="password" placeholder="Confirm new password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
              </div>
              <Button onClick={handleChangePassword} className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700">
                <Lock size={16} /> Update password
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Two-factor</h3>
              <p className="text-xs text-slate-500">
                OTP is enforced on every sign-in. Codes expire after 10 minutes.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My documents</h2>
            {personalDocs.length === 0 ? (
              <p className="text-sm text-slate-500">No personal documents yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {personalDocs.map(d => (
                  <li key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.fileName} · v{d.version} · {(d.fileSize / 1024).toFixed(0)} KB</p>
                    </div>
                    <Badge variant="outline">{d.category ?? 'personal'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent activity</h2>
            {myActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myActivity.map(a => (
                  <li key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.action}</p>
                      <p className="text-xs text-slate-500">{a.details ?? a.module ?? '—'}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
