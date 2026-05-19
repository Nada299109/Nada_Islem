'use client'

import { useContext, useMemo, useState } from 'react'
import { User } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon, Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface HeaderProps {
  user: User
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const { notifications, markAllNotificationsRead, markNotificationRead } = useContext(AppContext)

  const visibleNotifications = useMemo(() => {
    return notifications
      .filter(notification => {
        if (notification.userId && notification.userId === user.id) return true
        if (
          notification.targetEmployeeId &&
          user.employeeId &&
          notification.targetEmployeeId === user.employeeId
        ) return true
        if (
          notification.audienceRoles &&
          notification.audienceRoles.includes(user.role)
        ) return true
        return false
      })
      .slice(0, 6)
  }, [notifications, user.id, user.role, user.employeeId])

  const unreadCount = visibleNotifications.filter(notification => !notification.isRead).length

  const getIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 size={14} className="text-emerald-600" />
    if (type === 'warning') return <AlertTriangle size={14} className="text-amber-600" />
    return <Info size={14} className="text-blue-600" />
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">IntraConnect Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user.name}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-slate-500 hover:text-slate-800"
            onClick={() => {
              setShowNotifications(!showNotifications)
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 rounded-full border border-white text-[10px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-lg rounded-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                <button
                  className="text-xs text-blue-600 font-medium cursor-pointer"
                  onClick={() => markAllNotificationsRead()}
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {visibleNotifications.length > 0 ? visibleNotifications.map(notification => (
                  <button
                    key={notification.id}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${notification.isRead ? '' : 'bg-blue-50/40'}`}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <p className="text-sm text-slate-800 flex items-center gap-2">
                      {getIcon(notification.type)}
                      <span className="font-medium">{notification.title}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                    <span className="text-xs text-slate-400 mt-2 block">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </button>
                )) : (
                  <div className="p-6 text-center text-sm text-slate-500">No notifications yet.</div>
                )}
              </div>
              <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => markAllNotificationsRead()}>
                  Clear unread badge
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
          <UserIcon size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700 capitalize">{user.role}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  )
}
