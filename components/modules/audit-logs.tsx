'use client'

import { useState, useContext, useMemo } from 'react'
import { AppContext, AuditLog } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Filter, History, User,
  Archive, Shield, Clock, Download,
  ExternalLink, Eye, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AuditLogsModule() {
  const { auditLogs, fetchAuditLogs, isLoading } = useContext(AppContext)
  const { user } = useContext(AuthContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const isAdmin = user?.role === 'admin'
  const [scope, setScope] = useState<'mine' | 'all'>(isAdmin ? 'all' : 'mine')

  const todayIso = new Date().toISOString().slice(0, 10)

  const scopedLogs = useMemo(() => {
    if (scope === 'mine') {
      return auditLogs.filter(log => log.userId === user?.id || log.userId === user?.employeeId)
    }
    return auditLogs
  }, [auditLogs, scope, user])

  const filteredLogs = useMemo(() => {
    return scopedLogs.filter(log => {
      const matchesSearch =
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
      const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter)

      return matchesSearch && matchesModule && matchesAction
    })
  }, [scopedLogs, searchTerm, moduleFilter, actionFilter])

  const actionsToday = useMemo(
    () => scopedLogs.filter(l => l.createdAt?.startsWith(todayIso)).length,
    [scopedLogs, todayIso],
  )

  const modules = Array.from(new Set(scopedLogs.map(l => l.module).filter(Boolean)))
  const actions = Array.from(new Set(scopedLogs.map(l => l.action.split('_')[0])))

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700'
    if (action.includes('DELETE')) return 'bg-rose-100 text-rose-700'
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700'
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {scope === 'mine' ? 'My Activity' : 'System Audit Logs'}
          </h2>
          <p className="text-slate-500">
            {scope === 'mine'
              ? 'Every action you have performed — immutable record.'
              : 'Track all system activities across users.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Tabs value={scope} onValueChange={(v) => setScope(v as 'mine' | 'all')}>
              <TabsList>
                <TabsTrigger value="mine">My Activity</TabsTrigger>
                <TabsTrigger value="all">All Activity</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()} disabled={isLoading}>
            <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-100 shadow-sm bg-indigo-50/30">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <History size={20} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Total Logs</p>
                      <p className="text-xl font-bold text-slate-900">{scopedLogs.length}</p>
                  </div>
              </div>
          </Card>
          <Card className="p-4 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Archive size={20} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Recent Creations</p>
                      <p className="text-xl font-bold text-slate-900">
                          {scopedLogs.filter(l => l.action.includes('CREATE')).length}
                      </p>
                  </div>
              </div>
          </Card>
          <Card className="p-4 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                      <Shield size={20} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Security Events</p>
                      <p className="text-xl font-bold text-slate-900">
                          {scopedLogs.filter(l => l.module?.toUpperCase() === 'AUTH').length}
                      </p>
                  </div>
              </div>
          </Card>
          <Card className="p-4 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Clock size={20} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Actions Today</p>
                      <p className="text-xl font-bold text-slate-900">{actionsToday}</p>
                  </div>
              </div>
          </Card>
      </div>

      <Card className="overflow-hidden border-slate-100">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search actions, users or details..." 
              className="pl-10 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px] bg-white">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map(mod => (
                  <SelectItem key={mod} value={mod || ''}>{mod}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(act => (
                  <SelectItem key={act} value={act}>{act}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border-t border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
                <TableHead className="font-bold text-slate-700">User</TableHead>
                <TableHead className="font-bold text-slate-700">Action</TableHead>
                <TableHead className="font-bold text-slate-700">Module</TableHead>
                <TableHead className="font-bold text-slate-700">Details</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="font-medium text-slate-700">{log.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getActionColor(log.action)} border-none font-medium`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-400 uppercase tracking-tighter">{log.module || 'System'}</span>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-slate-600 truncate">{log.details}</p>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedLog(log)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Eye size={16} className="text-slate-400 hover:text-indigo-600" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500 py-20">
                    <History size={48} className="mx-auto mb-4 opacity-10" />
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="text-indigo-600" />
              Log Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Module</p>
                  <p className="font-medium text-slate-800">{selectedLog.module || 'CORE-SYSTEM'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Timestamp</p>
                  <p className="font-medium text-slate-800">{format(new Date(selectedLog.createdAt), 'PPP p')}</p>
                </div>
              </div>

              <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Action</p>
                  <Badge className={`${getActionColor(selectedLog.action)} border-none text-base px-3 py-1`}>
                    {selectedLog.action}
                  </Badge>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Technical Summary</p>
                  <p className="text-slate-700 leading-relaxed font-mono text-sm">{selectedLog.details}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800">{selectedLog.userName}</p>
                      <p className="text-xs text-slate-400">User ID: {selectedLog.userId.split('-')[0]}...</p>
                   </div>
                </div>
                <Button variant="outline" size="sm">
                    <ExternalLink size={14} className="mr-2" />
                    View User Trace
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
