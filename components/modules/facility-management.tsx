'use client'

import { useContext, useMemo, useState } from 'react'
import { AppContext, FacilityLocation } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Building2, Image as ImageIcon, MapPin, Package, Plus, Send } from 'lucide-react'

const ISSUE_TYPES = [
  { value: 'damage', label: 'Damage' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'safety', label: 'Safety' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
]

const LOCATION_TYPES = [
  'office_area', 'meeting_room', 'restroom', 'common_area',
  'parking', 'cafeteria', 'storage', 'equipment_room',
]

export default function FacilityManagement() {
  const { user } = useContext(AuthContext)
  const {
    facilityLocations, facilityAssets, facilityRequests,
    upsertFacilityLocation, upsertFacilityAsset,
    createFacilityRequest, escalateFacilityToTicket,
  } = useContext(AppContext)

  const [activeTab, setActiveTab] = useState('report')
  const [reqForm, setReqForm] = useState({
    title: '', description: '', issueType: 'other',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'critical',
    locationId: facilityLocations[0]?.id || '',
    assetId: '',
    photoFiles: [] as File[],
  })

  const [newLocation, setNewLocation] = useState<Partial<FacilityLocation>>({
    name: '', type: 'office_area', isActive: true,
  })
  const [newAsset, setNewAsset] = useState<{ name: string; type: string; serialNumber: string; locationId: string }>({
    name: '', type: '', serialNumber: '', locationId: facilityLocations[0]?.id || '',
  })

  // roles.docx §4.5 — Manage facility requests = HR + Admin.
  const canManageFacility = user?.role === 'admin' || user?.role === 'hr'
  const isAdmin = canManageFacility

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3)
    const tooBig = files.find(f => f.size > 5 * 1024 * 1024)
    if (tooBig) {
      alert('Each photo must be 5 MB or smaller (charge.docx §4.5).')
      return
    }
    setReqForm(prev => ({ ...prev, photoFiles: files }))
  }

  const submitRequest = async () => {
    if (!reqForm.title || !reqForm.description || !reqForm.locationId) {
      alert('Title, description and location are required.')
      return
    }
    await createFacilityRequest({
      title: reqForm.title,
      description: reqForm.description,
      issueType: reqForm.issueType,
      urgency: reqForm.urgency,
      locationId: reqForm.locationId,
      assetId: reqForm.assetId || undefined,
      photos: reqForm.photoFiles.map(f => ({ id: f.name, filename: f.name, size: f.size })),
    })
    setReqForm({
      title: '', description: '', issueType: 'other', urgency: 'normal',
      locationId: facilityLocations[0]?.id || '', assetId: '', photoFiles: [],
    })
  }

  const requestsByLocation = useMemo(() => {
    const map: Record<string, number> = {}
    facilityRequests.forEach(r => { map[r.locationId] = (map[r.locationId] ?? 0) + 1 })
    return map
  }, [facilityRequests])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 size={28} /> Facility Management
        </h1>
        <p className="text-slate-600 mt-1">charge.docx §4.5 — locations, assets, issue reporting.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="report">Report Issue</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="locations">Locations</TabsTrigger>}
          {isAdmin && <TabsTrigger value="assets">Assets</TabsTrigger>}
        </TabsList>

        <TabsContent value="report" className="mt-6">
          <Card className="p-6 bg-white space-y-4 max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <Input value={reqForm.title} onChange={e => setReqForm({ ...reqForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type *</label>
                <Select value={reqForm.issueType} onValueChange={(v) => setReqForm({ ...reqForm, issueType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                <Select value={reqForm.locationId} onValueChange={(v) => setReqForm({ ...reqForm, locationId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {facilityLocations.filter(l => l.isActive).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                <Select value={reqForm.urgency} onValueChange={(v: any) => setReqForm({ ...reqForm, urgency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <Textarea
                rows={4}
                value={reqForm.description}
                onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                placeholder="Describe the issue in detail."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <ImageIcon size={16} /> Photos (max 3, 5 MB each)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={handlePhotoChange}
                className="text-sm"
              />
              {reqForm.photoFiles.length > 0 && (
                <ul className="mt-2 text-xs text-slate-600 space-y-1">
                  {reqForm.photoFiles.map(f => (
                    <li key={f.name}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</li>
                  ))}
                </ul>
              )}
            </div>

            <Button onClick={submitRequest} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Send size={16} /> Submit Request
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => setActiveTab('report')}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} /> Report Issue
            </Button>
          </div>
          <Card className="p-0 bg-white overflow-hidden">
            {facilityRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No facility requests yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {facilityRequests.map(r => {
                  const location = facilityLocations.find(l => l.id === r.locationId)
                  return (
                    <li key={r.id} className="p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{r.title}</p>
                          <Badge variant="outline" className="text-xs">{r.issueType}</Badge>
                          <Badge className={`text-xs ${
                            r.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                            r.urgency === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>{r.urgency}</Badge>
                          {r.ticketId && <Badge className="text-xs bg-blue-100 text-blue-700">Linked → #{r.ticketId.slice(0, 6)}</Badge>}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{r.description}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin size={12} /> {location?.name ?? '—'}
                          {r.photos.length > 0 && <> · {r.photos.length} photo(s)</>}
                        </p>
                      </div>
                      {!r.ticketId && isAdmin && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => escalateFacilityToTicket(r.id)}>
                          <AlertTriangle size={14} /> Escalate
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="locations" className="mt-6 space-y-4">
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Locations</h2>
              <ul className="space-y-2">
                {facilityLocations.map(l => (
                  <li key={l.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.type} · {l.building ?? ''}{l.floor ? ` · floor ${l.floor}` : ''} · {(requestsByLocation[l.id] ?? 0)} request(s)</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => upsertFacilityLocation({ id: l.id, isActive: !l.isActive })}>
                      {l.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Name" value={newLocation.name || ''} onChange={e => setNewLocation({ ...newLocation, name: e.target.value })} />
                <Select value={newLocation.type as string} onValueChange={(v) => setNewLocation({ ...newLocation, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Building" value={newLocation.building || ''} onChange={e => setNewLocation({ ...newLocation, building: e.target.value })} />
                <Button onClick={() => { if (!newLocation.name) return; upsertFacilityLocation(newLocation); setNewLocation({ name: '', type: 'office_area', isActive: true }) }} className="gap-2">
                  <Plus size={16} /> Add Location
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="assets" className="mt-6 space-y-4">
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Package size={20} /> Asset Registry
              </h2>
              <ul className="space-y-2">
                {facilityAssets.map(a => {
                  const loc = facilityLocations.find(l => l.id === a.locationId)
                  return (
                    <li key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                      <div>
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.type ?? '—'} · {a.serialNumber ?? '—'} · {loc?.name}</p>
                      </div>
                      <Badge className={`text-xs ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : a.status === 'under_maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </li>
                  )
                })}
                {facilityAssets.length === 0 && <li className="text-sm text-slate-500">No assets registered.</li>}
              </ul>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input placeholder="Asset name" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} />
                <Input placeholder="Type" value={newAsset.type} onChange={e => setNewAsset({ ...newAsset, type: e.target.value })} />
                <Input placeholder="Serial number" value={newAsset.serialNumber} onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })} />
                <Select value={newAsset.locationId} onValueChange={(v) => setNewAsset({ ...newAsset, locationId: v })}>
                  <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    {facilityLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => { if (!newAsset.name || !newAsset.locationId) return; upsertFacilityAsset(newAsset); setNewAsset({ name: '', type: '', serialNumber: '', locationId: facilityLocations[0]?.id || '' }) }} className="gap-2">
                  <Plus size={16} /> Add
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
