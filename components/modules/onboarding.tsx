'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ONBOARDING_TASKS = [
  { id: 1, title: 'Complete Your Profile', desc: 'Add your profile picture and contact details.', status: 'completed' },
  { id: 2, title: 'Sign HR Documents', desc: 'NDA, Employee Handbook, and Tax forms.', status: 'completed' },
  { id: 3, title: 'Setup IT Equipment', desc: 'Laptop configuration and security protocols.', status: 'in-progress' },
  { id: 4, title: 'Meet Your Team', desc: 'Schedule a 1:1 with your manager and team members.', status: 'pending' },
  { id: 5, title: 'Intranet Orientation', desc: 'Review policies and benefits on Intranet.', status: 'pending' },
]

export default function Onboarding() {
  const [tasks, setTasks] = useState(ONBOARDING_TASKS)

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const progressPercent = Math.round((completedCount / tasks.length) * 100)

  const toggleTaskStatus = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (t.status === 'completed') return { ...t, status: 'pending' }
        if (t.status === 'pending' || t.status === 'in-progress') return { ...t, status: 'completed' }
      }
      return t
    }))
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to the Team! 🎉</h2>
          <p className="text-blue-100 mt-2 max-w-xl text-lg">We are thrilled to have you here. Please complete the tasks below to get fully set up in your first week.</p>
          
          <div className="mt-8 bg-white/10 p-5 rounded-xl border border-white/20 backdrop-blur-sm max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-blue-100 mt-2">{completedCount} of {tasks.length} tasks completed</p>
          </div>
        </div>
        
        <svg className="absolute right-0 top-0 h-full text-white/5 opacity-50" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="40"/>
          <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="20"/>
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="10"/>
        </svg>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Your Action Items</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`p-6 flex items-start gap-4 transition-colors ${task.status === 'completed' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
              <button 
                onClick={() => toggleTaskStatus(task.id)}
                className={`mt-1 flex-shrink-0 transition-colors ${
                  task.status === 'completed' ? 'text-emerald-500' : 
                  task.status === 'in-progress' ? 'text-blue-500' : 'text-slate-300 hover:text-slate-400'
                }`}
              >
                {task.status === 'completed' ? <CheckCircle2 size={24} /> : 
                 task.status === 'in-progress' ? <Clock size={24} /> : <Circle size={24} />}
              </button>
              
              <div className="flex-1">
                <h4 className={`text-lg font-bold ${task.status === 'completed' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                  {task.title}
                </h4>
                <p className={`mt-1 text-sm ${task.status === 'completed' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {task.desc}
                </p>
              </div>
              
              <div className="hidden sm:block">
                {task.status !== 'completed' && (
                  <Button variant="outline" className="text-sm text-slate-600" onClick={() => toggleTaskStatus(task.id)}>
                    Mark Done <Check size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
