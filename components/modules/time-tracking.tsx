'use client'

import { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Coffee, LogIn, LogOut, Users } from 'lucide-react'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function formatLiveTimer(record: ReturnType<typeof useTimer>['record']) {
  return record ? formatDuration(record.workedMinutes) : '0h 00m'
}

function useTimer() {
  const { getMyAttendanceState } = useContext(AppContext)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const result = getMyAttendanceState()
  // Re-read on every tick so the timer updates against state.
  void tick
  return result
}

export default function TimeTracking() {
  const { user } = useContext(AuthContext)
  const { submitAttendanceAction, getTeamAttendance } = useContext(AppContext)
  const { state, record } = useTimer()
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const liveSeconds = useMemo(() => {
    if (!record || state !== 'working') return null
    const lastEvent = record.events[record.events.length - 1]
    if (!lastEvent || lastEvent.type !== 'clock_in' && lastEvent.type !== 'break_end') return null
    const since = new Date(lastEvent.occurredAt).getTime()
    return Math.floor((now - since) / 1000) + record.workedMinutes * 60
  }, [now, record, state])

  const team = user?.role === 'manager' ? getTeamAttendance() : []

  const submit = async (action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => {
    setError(null)
    try { await submitAttendanceAction(action) }
    catch (e: any) { setError(e.message || 'Failed') }
  }

  const primary = (() => {
    switch (state) {
      case 'idle':
        return { label: 'Start Work', icon: LogIn, action: 'clock_in' as const, classes: 'bg-emerald-600 hover:bg-emerald-700' }
      case 'working':
        return { label: 'Start Break', icon: Coffee, action: 'break_start' as const, classes: 'bg-amber-600 hover:bg-amber-700' }
      case 'on_break':
        return { label: 'End Break', icon: Clock, action: 'break_end' as const, classes: 'bg-blue-600 hover:bg-blue-700' }
      case 'ended':
        return null
    }
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Time Tracking</h1>
        <p className="text-slate-600 mt-1">Clock in, take breaks, clock out — charge.docx §4.12.</p>
      </div>

      {error && <Card className="p-3 bg-rose-50 text-rose-700">{error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-2xl font-bold text-slate-900 capitalize">
                {state.replace('_', ' ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Live timer</p>
              <p className="text-3xl font-mono font-bold text-blue-700">
                {liveSeconds != null
                  ? `${Math.floor(liveSeconds / 3600)}h ${Math.floor((liveSeconds % 3600) / 60).toString().padStart(2,'0')}m`
                  : formatLiveTimer({ record } as any)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {primary && (
              <Button onClick={() => submit(primary.action)} className={`gap-2 ${primary.classes}`}>
                <primary.icon size={18} />
                {primary.label}
              </Button>
            )}
            {state === 'working' && (
              <Button onClick={() => submit('clock_out')} variant="outline" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                <LogOut size={18} />
                End Work
              </Button>
            )}
            {state === 'ended' && (
              <p className="text-sm text-slate-500">You've ended your work day. See you tomorrow.</p>
            )}
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-700 mb-3">Today's timeline</p>
            <ul className="space-y-2">
              {(record?.events || []).map(ev => (
                <li key={ev.id} className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {new Date(ev.occurredAt).toLocaleTimeString()}
                  </span>
                  <span className="capitalize">{ev.type.replace('_', ' ')}</span>
                  {ev.source !== 'user' && (
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                      {ev.source}
                    </span>
                  )}
                </li>
              ))}
              {(record?.events || []).length === 0 && (
                <li className="text-sm text-slate-500">No events yet today.</li>
              )}
            </ul>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Daily summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Worked</span>
              <span className="font-semibold">{formatDuration(record?.workedMinutes ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Break</span>
              <span className="font-semibold">{formatDuration(record?.breakMinutes ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold capitalize">{record?.status ?? 'open'}</span>
            </div>
          </div>
        </Card>
      </div>

      {user?.role === 'manager' && (
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={20} /> Team — live attendance
          </h2>
          {team.length === 0 ? (
            <p className="text-sm text-slate-500">No direct reports.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.map(t => (
                <div key={t.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{t.fullName}</p>
                    <p className="text-xs text-slate-500 capitalize">{t.state.replace('_', ' ')}</p>
                  </div>
                  <p className="text-sm font-mono text-slate-700">{formatDuration(t.workedMinutes)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
