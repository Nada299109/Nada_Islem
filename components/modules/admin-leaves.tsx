'use client'

import { useState } from 'react'
import { CalendarDays, ListChecks, User as UserIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TeamCalendar from './team-calendar'
import LeaveRequests from './leave-requests'
import MyLeaves from './my-leaves'

export default function AdminLeaves() {
  const [tab, setTab] = useState('calendar')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
        <p className="text-slate-600 mt-1">Team calendar, request inbox, and your own leaves.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-slate-100 h-10 p-1">
          <TabsTrigger value="calendar" className="gap-2 px-4">
            <CalendarDays size={16} />
            Team Calendar
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2 px-4">
            <ListChecks size={16} />
            All Requests
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-2 px-4">
            <UserIcon size={16} />
            My Leaves
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <TeamCalendar />
        </TabsContent>

        <TabsContent value="requests">
          <LeaveRequests />
        </TabsContent>

        <TabsContent value="mine">
          <MyLeaves onSwitchToRequest={() => setTab('request')} />
        </TabsContent>

        <TabsContent value="request">
          <LeaveRequests isRequestForm={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
