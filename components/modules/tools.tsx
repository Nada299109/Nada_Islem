'use client'

import { useContext, useMemo, useState } from 'react'
import { ExternalLink, Plus, ShieldCheck, Wrench } from 'lucide-react'

import { AuthContext } from '@/context/auth-context'
import { AppContext } from '@/context/app-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Tools() {
  const { user } = useContext(AuthContext)
  const { tools, addTool, updateTool } = useContext(AppContext)
  const [search, setSearch] = useState('')

  const visibleTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch =
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase()) ||
        tool.category.toLowerCase().includes(search.toLowerCase())

      const matchesRole = tool.visibility.includes(user?.role || 'employee')
      return tool.active && matchesSearch && matchesRole
    })
  }, [search, tools, user?.role])

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tools Directory</h2>
          <p className="text-slate-500 mt-1">Role-based access to internal applications and enterprise services.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100">
            <ShieldCheck size={20} />
            <span className="text-sm font-medium">Frontend Demo Mode</span>
          </div>
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => addTool({
                name: 'New Internal Tool',
                description: 'Editable demo tool entry',
                category: 'Operations',
                url: 'https://example.com',
                visibility: ['employee', 'manager', 'admin'],
                active: true,
              })}
            >
              <Plus size={16} />
              Add Tool
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search tools by name, description, or category"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTools.map(tool => (
          <Card key={tool.id} className="p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-slate-50 text-slate-700">
                  <Wrench size={24} />
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-400">{tool.category}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">{tool.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{tool.description}</p>
              </div>
              <div className="text-xs text-slate-500">
                Visible to: {tool.visibility.join(', ')}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
              >
                Launch
                <ExternalLink size={14} />
              </Button>
              {(user?.role === 'admin' || user?.role === 'hr') && (
                <Button
                  variant="ghost"
                  onClick={() => updateTool(tool.id, { active: !tool.active })}
                >
                  {tool.active ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
