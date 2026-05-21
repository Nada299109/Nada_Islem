'use client'

import { useContext, useState } from 'react'
import { format } from 'date-fns'
import { AlertCircle, Calendar, Plus, Star, TrendingUp, User } from 'lucide-react'

import { AppContext } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function FeedbackModule() {
  const { user } = useContext(AuthContext)
  const { performanceFeedback, createPerformanceFeedback, employees } = useContext(AppContext)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    employeeId: '',
    content: '',
    rating: 5,
  })

  const isHR = user?.role === 'admin' || user?.role === 'hr'
  const myFeedback = performanceFeedback.filter(feedback => feedback.employeeId === user?.employeeId)

  const handleFeedbackSubmit = async () => {
    try {
      await createPerformanceFeedback(feedbackForm)
      setIsFeedbackModalOpen(false)
      setFeedbackForm({ employeeId: '', content: '', rating: 5 })
    } catch (err) {
      console.error('Failed to create feedback', err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Reviews</h2>
          <p className="text-slate-500">View performance reviews submitted by HR or managers.</p>
        </div>
        {isHR && (
          <Button onClick={() => setIsFeedbackModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} className="mr-2" />
            New Performance Review
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {myFeedback.length > 0 ? (
          myFeedback.map(feedback => (
            <Card key={feedback.id} className="p-6 border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-800">Review from {feedback.authorName}</h4>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < (feedback.rating || 0) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 flex items-center mb-4">
                      <Calendar size={12} className="mr-1" />
                      {format(new Date(feedback.createdAt), 'MMMM dd, yyyy')}
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700">
                      "{feedback.content}"
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                  Official Record
                </Badge>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">No performance reviews yet</h3>
            <p className="text-slate-500">Performance reviews will appear here once submitted by HR or managers.</p>
          </div>
        )}

        {isHR && (
          <Card className="p-6 bg-indigo-50 border-indigo-100 mt-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg">
                <TrendingUp size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-indigo-900 mb-1">Manager Overview</h4>
                <p className="text-indigo-700 text-sm">As an HR member, you can see performance trends and manage review cycles.</p>
              </div>
              <Button className="ml-auto bg-indigo-600 hover:bg-indigo-700">Access Analytics</Button>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Performance Review</DialogTitle>
            <DialogDescription>Submit a performance review for an employee.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select onValueChange={val => setFeedbackForm(prev => ({ ...prev, employeeId: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Search employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Performance Rating (1-5)</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setFeedbackForm(prev => ({ ...prev, rating: val }))}
                    className={`p-2 rounded-lg transition-all ${feedbackForm.rating >= val ? 'text-amber-500' : 'text-slate-200'}`}
                  >
                    <Star fill={feedbackForm.rating >= val ? 'currentColor' : 'none'} size={28} />
                  </button>
                ))}
                <span className="ml-2 font-bold text-slate-600">{feedbackForm.rating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review Content</Label>
              <Textarea
                placeholder="Provide detailed feedback on performance, achievements, and goals..."
                className="min-h-[150px]"
                value={feedbackForm.content}
                onChange={e => setFeedbackForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
            <Button onClick={handleFeedbackSubmit} className="bg-indigo-600 hover:bg-indigo-700">Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
