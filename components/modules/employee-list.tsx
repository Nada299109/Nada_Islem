'use client'

import { ChangeEvent, useContext, useMemo, useRef, useState } from 'react'
import { AppContext, Employee } from '@/context/app-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Search, FileUp, Users, History, Download, CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthContext } from '@/context/auth-context'
import AuditLogList from './audit-log-list'

interface EmployeeListProps {
  onEditEmployee: (id: string) => void
  onAddEmployee: () => void
}

interface ImportError {
  row: number
  error: string
}

function parseCsv(text: string): { rows: Record<string, string>[]; headers: string[] } {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { rows: [], headers: [] }
  const split = (s: string) => {
    const out: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; continue }
      if (c === '"') { inQ = !inQ; continue }
      if (c === ',' && !inQ) { out.push(cur); cur = ''; continue }
      cur += c
    }
    out.push(cur)
    return out
  }
  const headers = split(lines[0]).map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const cells = split(line)
    const o: Record<string, string> = {}
    headers.forEach((h, i) => { o[h] = (cells[i] ?? '').trim() })
    return o
  })
  return { rows, headers }
}

export default function EmployeeList({ onEditEmployee, onAddEmployee }: EmployeeListProps) {
  const {
    employees, deleteEmployee, advancedSearch, addBulkEmployees, isLoading,
    bulkActivateEmployees, exportEmployeesCsv,
  } = useContext(AppContext)
  const { user } = useContext(AuthContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [contractFilter, setContractFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importErrors, setImportErrors] = useState<ImportError[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    advancedSearch(
      searchTerm,
      deptFilter === 'all' ? undefined : deptFilter,
      statusFilter === 'all' ? undefined : statusFilter,
    )
  }

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (contractFilter !== 'all' && (e.contractType || '') !== contractFilter) return false
      if (deptFilter !== 'all' && e.department !== deptFilter) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.phone || '').toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [employees, searchTerm, deptFilter, statusFilter, contractFilter])

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const start = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filtered.slice(start, start + itemsPerPage)

  const allOnPageSelected = paginatedEmployees.length > 0 && paginatedEmployees.every(e => selected.has(e.id))

  const togglePageSelection = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        paginatedEmployees.forEach(e => next.delete(e.id))
      } else {
        paginatedEmployees.forEach(e => next.add(e.id))
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    setImportErrors(null)
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const { rows } = parseCsv(text)
    const required = ['name', 'email', 'department']
    const errors: ImportError[] = []
    const valid: Partial<Employee>[] = []

    rows.forEach((row, idx) => {
      const missing = required.filter(k => !row[k])
      if (missing.length) {
        errors.push({ row: idx + 2, error: `Missing required: ${missing.join(', ')}` })
        return
      }
      valid.push({
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        department: row.department,
        position: row.position || '',
        joinDate: row.joinDate || new Date().toISOString().slice(0, 10),
        status: (row.status as 'active' | 'inactive') || 'active',
        contractType: (row.contractType as Employee['contractType']) || '',
        workLocation: row.workLocation,
        dateOfBirth: row.dateOfBirth,
      })
    })

    if (valid.length > 0) await addBulkEmployees(valid)
    setImportErrors(errors)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleBulkActivate = async (active: boolean) => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    await bulkActivateEmployees(ids, active)
    setSelected(new Set())
  }

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).filter(Boolean)
  }, [employees])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
          <p className="text-slate-600 mt-1">Manage all employees and perform bulk operations</p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Button onClick={onAddEmployee} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <UserPlus size={18} />
              Add Employee
            </Button>
          )}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              variant="outline"
              className={`gap-2 ${showAuditTrail ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
            >
              <History size={18} />
              {showAuditTrail ? 'Hide Logs' : 'Audit Trail'}
            </Button>
          )}
          <Button onClick={exportEmployeesCsv} variant="outline" className="gap-2">
            <Download size={18} />
            Export CSV
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
            <FileUp size={18} />
            Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {importErrors && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-amber-900">
          <p className="text-sm font-semibold">
            Import finished. {importErrors.length === 0 ? 'All rows imported.' : `${importErrors.length} row(s) failed:`}
          </p>
          {importErrors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {importErrors.slice(0, 20).map((e, i) => (
                <li key={i}>Row {e.row}: {e.error}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card className="p-6 bg-white shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <Input
              placeholder="Search by name, email, ID, phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentOptions.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Contract" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Contractor">Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-900">{selected.size} selected</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleBulkActivate(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 size={16} /> Activate
              </Button>
              <Button size="sm" onClick={() => handleBulkActivate(false)} variant="outline" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                <XCircle size={16} /> Deactivate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox checked={allOnPageSelected} onCheckedChange={togglePageSelection} aria-label="Select page" />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map(emp => (
                <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selected.has(emp.id)}
                      onCheckedChange={() => toggleOne(emp.id)}
                      aria-label={`Select ${emp.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{emp.name}</TableCell>
                  <TableCell className="text-slate-600">{emp.email}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="text-slate-600">{emp.contractType || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{emp.roleName || 'Unassigned'}</span>
                      <span className="text-xs text-slate-500">{emp.roleCode || 'no-role'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {emp.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => onEditEmployee(emp.id)}>
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        onClick={async () => {
                          if (confirm('Soft-delete this employee (sets status=inactive)?')) {
                            try { await deleteEmployee(emp.id) }
                            catch (err: any) { alert(err.message || 'Failed') }
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg mt-4 border border-dashed">
            <Users className="mx-auto mb-3 text-slate-300" size={48} />
            <p className="text-lg font-medium">No employees found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
            <div className="text-sm font-medium text-slate-600">
              Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
            </div>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        )}
        {showAuditTrail && user?.role === 'admin' && (
          <div className="animate-in slide-in-from-bottom duration-300">
            <AuditLogList />
          </div>
        )}
      </Card>
    </div>
  )
}
