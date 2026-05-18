'use client'

import { useContext, useState, useMemo } from 'react'
import { Plus, Search, Filter, MessageSquare, AlertCircle, Clock, CheckCircle2, LayoutDashboard, ListFilter, X, Timer, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { AppContext, Ticket } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import TicketDetail from './ticket-detail'
import AgentDashboard from './agent-dashboard'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formatSla = (deadline: string) => {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  if (diff < 0) return 'OVERDUE'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) return `${Math.floor(hours / 24)}d left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

export default function Tickets() {
  const { user } = useContext(AuthContext)
  const { tickets, createTicket, ticketCategories } = useContext(AppContext)
  const [view, setView] = useState<'list' | 'dashboard'>('list')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    priority: 'medium',
    location: ''
  })

  // roles.docx §4.4 — Manage/assign tickets = HR + Admin; team performance view = Manager + HR + Admin.
  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager'

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [tickets, searchQuery, filterCategory, filterStatus])

  const selectedTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId), 
  [tickets, selectedTicketId])

  const handleCreateTicket = async () => {
    try {
      if (!ticketForm.categoryId) {
        alert('Please select a category')
        return
      }
      await createTicket({
        ...ticketForm,
        employeeId: user?.employeeId || user?.id,
        employeeName: user?.name,
      })
      setIsModalOpen(false)
      setTicketForm({ title: '', description: '', categoryId: '', priority: 'medium', location: '' })
    } catch (err: any) {
      alert('Failed to submit ticket: ' + err.message)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getSLAIndicator = (ticket: Ticket) => {
    if (!ticket.slaDeadline) return null
    if (ticket.status === 'resolved' || ticket.status === 'closed') return null

    switch (ticket.slaStatus) {
      case 'BREACHED':
        return <Badge variant="destructive" className="animate-pulse">BREACHED</Badge>
      case 'NEAR_BREACH':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">NEAR BREACH</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex h-full bg-slate-50/50 rounded-xl overflow-hidden border border-slate-200 relative">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedTicketId ? 'mr-[450px]' : ''}`}>
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Support Center</h2>
            <p className="text-slate-500 text-sm">Track and manage service requests and IT support.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdminOrAgent && (
              <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                <Button 
                  variant={view === 'list' ? 'white' : 'ghost'} 
                  size="sm" 
                  className={`px-3 ${view === 'list' ? 'shadow-sm' : ''}`}
                  onClick={() => setView('list')}
                >
                  <ListFilter size={16} className="mr-2" />
                  Tickets
                </Button>
                <Button 
                  variant={view === 'dashboard' ? 'white' : 'ghost'} 
                  size="sm" 
                  className={`px-3 ${view === 'dashboard' ? 'shadow-sm' : ''}`}
                  onClick={() => setView('dashboard')}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Dashboard
                </Button>
              </div>
            )}
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 gap-2">
                  <Plus size={18} />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New Support Request</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">What do you need help with?</label>
                    <Input 
                      placeholder="Summary of the issue" 
                      value={ticketForm.title}
                      onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                      className="h-11 border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Category</label>
                      <Select 
                        value={ticketForm.categoryId}
                        onValueChange={(val) => setTicketForm({ ...ticketForm, categoryId: val })}
                      >
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Urgency</label>
                      <Select 
                        value={ticketForm.priority}
                        onValueChange={(val) => setTicketForm({ ...ticketForm, priority: val })}
                      >
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor issue</SelectItem>
                          <SelectItem value="medium">Medium - Standard</SelectItem>
                          <SelectItem value="high">High - Urgent</SelectItem>
                          <SelectItem value="urgent">Critical - Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Location (Optional)</label>
                    <Input 
                      placeholder="e.g. Building A, Floor 2, Room 204"
                      value={ticketForm.location}
                      onChange={(e) => setTicketForm({ ...ticketForm, location: e.target.value })}
                      className="h-11 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] text-sm" 
                      placeholder="Please provide specifics to help us resolve this faster..." 
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={handleCreateTicket}>Submit Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {view === 'dashboard' ? (
          <div className="p-8 overflow-auto flex-1">
            <AgentDashboard />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by ID or title..." 
                  className="pl-10 border-slate-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[160px] h-9 text-xs border-slate-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {ticketCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-3">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`group p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 ${selectedTicketId === ticket.id ? 'bg-blue-50/50 border-blue-400 border-2' : 'bg-white'}`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            #{ticket.id.substring(0, 8)}
                          </span>
                          <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700">{ticket.title}</h3>
                          {getSLAIndicator(ticket)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Inbox size={12}/> {ticket.categoryName}</span>
                          <span>•</span>
                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          {ticket.slaDeadline && (
                            <span className={`flex items-center gap-1 font-bold ${
                              ticket.slaStatus === 'BREACHED' ? 'text-red-600' : 
                              ticket.slaStatus === 'NEAR_BREACH' ? 'text-orange-600' : 
                              'text-emerald-600'
                            }`}>
                              <Timer size={12} /> {formatSla(ticket.slaDeadline)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <Badge className={`${getPriorityColor(ticket.priority)} uppercase text-[10px] px-2 py-0.5`}>
                          {ticket.priority}
                        </Badge>
                        <div className="w-24 text-right">
                          <span className={`text-xs font-bold capitalize ${ticket.status === 'open' ? 'text-blue-600' : ticket.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300 group-hover:text-blue-400 transition-colors">
                          <MessageSquare size={16} />
                          <span className="text-xs font-bold">{ticket.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No tickets found matching your criteria</p>
                    <Button variant="link" className="text-blue-600 mt-2" onClick={() => {
                      setSearchQuery('')
                      setFilterCategory('all')
                      setFilterStatus('all')
                    }}>Clear all filters</Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail View Overlay/Panel */}
      {selectedTicket && (
        <div className="absolute inset-y-0 right-0 w-[450px] shadow-2xl z-20 animate-in slide-in-from-right duration-300 ease-out border-l border-slate-200 flex flex-col bg-white">
          <TicketDetail 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicketId(null)} 
          />
        </div>
      )}
    </div>
  )
}
