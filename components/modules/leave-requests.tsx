'use client'

import { useContext, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface LeaveRequestsProps {
  isRequestForm?: boolean
}

export default function LeaveRequests({ isRequestForm = false }: LeaveRequestsProps) {
  const { user } = useContext(AuthContext)
  const { leaveRequests, submitLeaveRequest, updateLeaveRequest } = useContext(AppContext)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'annual' as const,
    reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.employeeId) {
      alert("Error: You don't have an associated employee record. Please contact your administrator.")
      return
    }

    try {
      await submitLeaveRequest({
        employeeId: user.employeeId,
        employeeName: user.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        reason: formData.reason,
        status: 'pending'
      })
      setFormData({ startDate: '', endDate: '', type: 'annual', reason: '' })
      alert("Leave request submitted successfully!")
    } catch (err: any) {
      alert("Failed to submit leave request: " + (err.message || "Unknown error"))
    }
  }

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending')

  if (isRequestForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Submit Leave Request</h1>
        </div>

        <Card className="p-6 bg-white max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type *</label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Optional reason for leave"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Submit Request
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {['manager', 'admin', 'hr'].includes(user?.role || '') ? 'Team Leave Requests' : 'My Leave Requests'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <p className="text-sm text-slate-600">Total Requests</p>
          <p className="text-2xl font-bold text-slate-900">{leaveRequests.length}</p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-sm text-slate-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{leaveRequests.filter(r => r.status === 'approved').length}</p>
        </Card>
        <Card className="p-4 bg-white">
          <p className="text-sm text-slate-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{leaveRequests.filter(r => r.status === 'rejected').length}</p>
        </Card>
      </div>

      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Leave Requests</h2>
        <div className="space-y-4">
          {leaveRequests.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No leave requests</p>
          ) : (
            leaveRequests.map(req => (
              <div key={req.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{req.employeeName}</p>
                    <p className="text-sm text-slate-600">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600">Type: <span className="font-medium">{req.type}</span></p>
                  {req.reason && <p className="text-sm text-slate-600 mt-1">Reason: {req.reason}</p>}
                </div>
                {['manager', 'admin', 'hr'].includes(user?.role || '') && req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateLeaveRequest(req.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLeaveRequest(req.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
