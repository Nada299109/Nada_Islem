'use client'

import { useContext, useMemo, useState } from 'react'
import { AppContext } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FileDown, DollarSign, Wallet, TrendingUp, Lock, Plus } from 'lucide-react'

export default function PayrollList() {
  const { payrolls, employees, generatePayroll, isLoading } = useContext(AppContext)
  const { user } = useContext(AuthContext)
  const canCreate = user?.role === 'admin' || user?.role === 'hr'

  const [reauthOpen, setReauthOpen] = useState(false)
  const [reauthPwd, setReauthPwd] = useState('')
  const [pendingPayrollId, setPendingPayrollId] = useState<string | null>(null)
  const [reauthError, setReauthError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 3200,
    allowances: 300,
    deductions: 150,
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const netPreview = useMemo(
    () => createForm.basicSalary + createForm.allowances - createForm.deductions,
    [createForm.basicSalary, createForm.allowances, createForm.deductions],
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const requestDownload = (id: string) => {
    setPendingPayrollId(id)
    setReauthPwd('')
    setReauthError(null)
    setReauthOpen(true)
  }

  const confirmReauthAndDownload = () => {
    if (!reauthPwd) {
      setReauthError('Password required.')
      return
    }
    setReauthOpen(false)
    alert(`Demo: payslip ${pendingPayrollId} download authorized. (Backend will return a signed URL.)`)
    setPendingPayrollId(null)
    setReauthPwd('')
  }

  const submitCreate = async () => {
    setCreateError(null)
    if (!createForm.employeeId) {
      setCreateError('Pick an employee.')
      return
    }
    const employee = employees.find(e => e.id === createForm.employeeId)
    await generatePayroll({
      employeeId: createForm.employeeId,
      employeeName: employee?.name,
      month: createForm.month,
      year: createForm.year,
      basicSalary: createForm.basicSalary,
      allowances: createForm.allowances,
      deductions: createForm.deductions,
      netSalary: netPreview,
      status: 'paid',
    })
    setCreateOpen(false)
    setCreateForm({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 3200,
      allowances: 300,
      deductions: 150,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payroll & Payslips</h1>
          <p className="text-slate-600 mt-1">charge.docx §4.8 — re-auth required, signed URL only, no email attachments.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={16} /> Add Payslip
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/30 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-xs font-medium bg-blue-500/50 px-2 py-1 rounded">Net Salary</span>
          </div>
          <p className="text-3xl font-bold">
            {payrolls.length > 0 ? formatCurrency(payrolls[0].netSalary) : formatCurrency(0)}
          </p>
          <p className="text-blue-100 text-sm mt-1">
            Last payment: {payrolls.length > 0 ? `${payrolls[0].month}/${payrolls[0].year}` : 'N/A'}
          </p>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {payrolls[0] ? formatCurrency(payrolls[0].allowances) : formatCurrency(0)}
          </p>
          <p className="text-slate-500 text-sm mt-1">Allowances</p>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <TrendingUp size={24} className="rotate-180" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {payrolls[0] ? formatCurrency(payrolls[0].deductions) : formatCurrency(0)}
          </p>
          <p className="text-slate-500 text-sm mt-1">Deductions</p>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileDown size={18} className="text-blue-600" />
            Recent Payslips
          </h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {canCreate && <TableHead>Employee</TableHead>}
              <TableHead>Period</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Allowance</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 8 : 7} className="text-center py-8">Loading payroll data...</TableCell>
              </TableRow>
            ) : payrolls.length > 0 ? (
              payrolls.map(payroll => (
                <TableRow key={payroll.id} className="hover:bg-slate-50 transition-colors">
                  {canCreate && <TableCell className="font-medium text-slate-700">{payroll.employeeName ?? '—'}</TableCell>}
                  <TableCell className="font-medium text-slate-900">
                    {payroll.month}/{payroll.year}
                  </TableCell>
                  <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                  <TableCell className="text-emerald-600">+{formatCurrency(payroll.allowances)}</TableCell>
                  <TableCell className="text-rose-600">-{formatCurrency(payroll.deductions)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(payroll.netSalary)}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Paid
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => requestDownload(payroll.id)}
                    >
                      <Lock size={14} />
                      <FileDown size={16} />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canCreate ? 8 : 7} className="text-center py-12 text-slate-500">
                  <DollarSign className="mx-auto mb-2 opacity-20" size={48} />
                  <p>No payroll records found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Re-auth dialog */}
      <Dialog open={reauthOpen} onOpenChange={setReauthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-authentication required</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              charge.docx §4.8 requires re-entering your password before accessing payslips.
            </p>
            <Input
              type="password"
              placeholder="Your account password"
              value={reauthPwd}
              onChange={(e) => setReauthPwd(e.target.value)}
              autoFocus
            />
            {reauthError && <p className="text-sm text-rose-600">{reauthError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReauthOpen(false)}>Cancel</Button>
            <Button onClick={confirmReauthAndDownload} className="bg-blue-600 hover:bg-blue-700">
              Confirm & download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create payslip dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add payslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
              <Select
                value={createForm.employeeId}
                onValueChange={v => setCreateForm({ ...createForm, employeeId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Pick an employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} — {e.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <Input
                  type="number" min={1} max={12}
                  value={createForm.month}
                  onChange={e => setCreateForm({ ...createForm, month: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <Input
                  type="number"
                  value={createForm.year}
                  onChange={e => setCreateForm({ ...createForm, year: Number(e.target.value) || new Date().getFullYear() })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Basic</label>
                <Input
                  type="number"
                  value={createForm.basicSalary}
                  onChange={e => setCreateForm({ ...createForm, basicSalary: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allowances</label>
                <Input
                  type="number"
                  value={createForm.allowances}
                  onChange={e => setCreateForm({ ...createForm, allowances: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deductions</label>
                <Input
                  type="number"
                  value={createForm.deductions}
                  onChange={e => setCreateForm({ ...createForm, deductions: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-600">Net salary</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(netPreview)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payslip PDF (optional, demo)</label>
              <input type="file" accept="application/pdf" className="text-sm" />
              <p className="text-xs text-slate-500 mt-1">
                Production: uploaded to MinIO; signed URL emailed to employee — no attachment.
              </p>
            </div>

            {createError && <p className="text-sm text-rose-600">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={submitCreate} className="bg-blue-600 hover:bg-blue-700">
              Save payslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
