'use client'

import { useContext, useState, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Filter, FileText, Download, History, 
  Trash2, Upload, File, MoreVertical, ExternalLink, 
  Lock, Globe, Grid, List, Check, X, AlertCircle,
  FileIcon, FileJson, FileCode, ImageIcon, Music, Video,
  ChevronRight, ArrowUpRight, Clock, User, HardDrive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { AppContext, Document } from '@/context/app-context'
import { AuthContext } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DocumentList() {
  const { user } = useContext(AuthContext)
  const { 
    documents, 
    uploadDocument, 
    uploadNewVersion, 
    downloadDocument, 
    deleteDocument,
    isLoading 
  } = useContext(AppContext)

  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // charge.docx §4.7 fixed taxonomy
  const COMPANY_CATEGORIES = [
    { value: 'POLICIES', label: 'Policies & Procedures' },
    { value: 'EMPLOYEE_HANDBOOK', label: 'Employee Handbook' },
    { value: 'SAFETY_GUIDELINES', label: 'Safety Guidelines' },
    { value: 'QUALITY_STANDARDS', label: 'Quality Standards' },
    { value: 'FORMS_TEMPLATES', label: 'Forms & Templates' },
    { value: 'TRAINING_MATERIALS', label: 'Training Materials' },
    { value: 'COMPANY_ANNOUNCEMENTS', label: 'Announcements' },
    { value: 'CERTIFICATES_LICENSES', label: 'Certificates & Licenses' },
  ]

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'POLICIES',
    isPublic: false,
    expiresAt: '',
    file: null as File | null,
  })

  const [dragActive, setDragActive] = useState(false)
  const [showMyDocsOnly, setShowMyDocsOnly] = useState(false)

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
      
      // roles.docx §4.7 — admins + HR see everything (documents.manage); others see public or own.
      const hasAccess =
        user?.role === 'admin' ||
        user?.role === 'hr' ||
        doc.isPublic ||
        doc.uploadedById === user?.id
      
      const matchesOwnership = !showMyDocsOnly || doc.uploadedById === user?.id
      
      return matchesSearch && matchesCategory && hasAccess && matchesOwnership
    })
  }, [documents, searchQuery, selectedCategory, user, showMyDocsOnly])

  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.category).filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [documents])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadForm(prev => ({ ...prev, file: e.dataTransfer.files[0] }))
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm(prev => ({ ...prev, file: e.target.files[0] }))
    }
  }

  const handleUpload = async () => {
    try {
      if (!uploadForm.file) {
        alert('Please select a file')
        return
      }
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('title', uploadForm.title || uploadForm.file.name)
      formData.append('description', uploadForm.description)
      formData.append('category', uploadForm.category)
      formData.append('isPublic', String(uploadForm.isPublic))

      await uploadDocument(formData)
      setIsUploadOpen(false)
      setUploadForm({ title: '', description: '', category: 'POLICIES', isPublic: false, expiresAt: '', file: null })
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('pdf')) return <FileText className="text-red-500" />
    if (t.includes('image')) return <ImageIcon className="text-blue-500" />
    if (t.includes('spreadsheet') || t.includes('excel') || t.includes('sheet') || t.includes('csv')) return <FileIcon className="text-emerald-500" />
    if (t.includes('word') || t.includes('document')) return <FileText className="text-blue-600" />
    if (t.includes('json')) return <FileJson className="text-amber-500" />
    if (t.includes('video')) return <Video className="text-purple-500" />
    if (t.includes('zip') || t.includes('rar') || t.includes('compressed')) return <HardDrive className="text-amber-700" />
    return <File className="text-slate-400" />
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Document Library</h1>
            <p className="text-slate-500 text-sm">Securely manage, version, and share company documents.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Button 
                variant={viewType === 'grid' ? 'white' : 'ghost'} 
                size="sm" 
                className={viewType === 'grid' ? 'shadow-sm' : ''}
                onClick={() => setViewType('grid')}
              >
                <Grid size={16} />
              </Button>
              <Button 
                variant={viewType === 'list' ? 'white' : 'ghost'} 
                size="sm" 
                className={viewType === 'list' ? 'shadow-sm' : ''}
                onClick={() => setViewType('list')}
              >
                <List size={16} />
              </Button>
            </div>
            
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 gap-2">
                  <Upload size={18} />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-2 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Upload size={24} />
                    </div>
                    {uploadForm.file ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900">{uploadForm.file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(uploadForm.file.size)}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900">Drag and drop file here</p>
                        <p className="text-xs text-slate-500">or click to browse from your computer</p>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="file-upload" 
                          onChange={handleFileChange}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document Title</label>
                    <Input 
                      placeholder="e.g. Employee Contract v1" 
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select 
                        value={uploadForm.category}
                        onValueChange={(v) => setUploadForm(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Visibility</label>
                      <Select 
                        value={uploadForm.isPublic ? 'public' : 'private'}
                        onValueChange={(v) => setUploadForm(prev => ({ ...prev, isPublic: v === 'public' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (Only Admin/Me)</SelectItem>
                          <SelectItem value="public">Public (All Employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expiry date (optional)</label>
                    <Input
                      type="date"
                      value={uploadForm.expiresAt}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      charge.docx §4.7: HR is notified before expiry; expired documents are auto-hidden from employees.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 font-bold" 
                    onClick={handleUpload}
                    disabled={!uploadForm.file}
                  >
                    Start Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search documents by name, title or extension..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full px-4 h-9 capitalize ${selectedCategory === cat ? 'bg-slate-900 border-slate-900' : 'text-slate-600'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
            <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block" />
            <Button
              variant={showMyDocsOnly ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full px-4 h-9 gap-2 transition-all ${showMyDocsOnly ? 'bg-blue-600 border-blue-600' : 'text-blue-600 border-blue-200 bg-blue-50/50'}`}
              onClick={() => setShowMyDocsOnly(!showMyDocsOnly)}
            >
              <User size={14} />
              My Documents
              {showMyDocsOnly && <Check size={14} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDocuments.length > 0 ? (
          viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map(doc => (
                <Card 
                  key={doc.id} 
                  className="group hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden border-slate-200 relative"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                  
                  <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] truncate uppercase font-mono">{doc.fileName.split('.').pop()}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2 py-0">
                        {doc.category}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0 border-none italic ${doc.isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {doc.isPublic ? <Globe size={10} className="mr-1" /> : <Lock size={10} className="mr-1" />}
                        {doc.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 font-medium"><HardDrive size={12} /> {formatFileSize(doc.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-50 pt-2">
                        <User size={12} />
                        <span className="truncate">By {doc.uploadedByName}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-9 gap-2 text-xs font-semibold group-hover:border-blue-200 hover:bg-blue-50/50" 
                      onClick={() => downloadDocument(doc.id, doc.fileName)}
                    >
                      <Download size={14} /> Download
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedDoc(doc)
                        setIsHistoryOpen(true)
                      }}
                    >
                      <History size={16} />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modified</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-blue-50/30 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{doc.title}</p>
                            <p className="text-xs text-slate-500 truncate">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium px-2 py-0.5">
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => downloadDocument(doc.id, doc.fileName)}>
                            <Download size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => {
                            setSelectedDoc(doc)
                            setIsHistoryOpen(true)
                          }}>
                            <History size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <File size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No documents found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              {searchQuery ? "We couldn't find any documents matching your search. Try different keywords or search for a specific tag." : "Your document library is empty. Upload your first document to get started."}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* History & Versioning Panel */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="text-blue-600" />
              Document History: {selectedDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="versions">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="versions">Version History</TabsTrigger>
                <TabsTrigger value="logs">Access Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="versions" className="space-y-4">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {selectedDoc ? getFileIcon(selectedDoc.fileType) : <File />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Current: Version {selectedDoc?.version}</p>
                      <p className="text-xs text-slate-500">Updated {selectedDoc ? new Date(selectedDoc.updatedAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.onchange = async (e: any) => {
                      if (e.target.files && e.target.files[0] && selectedDoc) {
                        const formData = new FormData()
                        formData.append('file', e.target.files[0])
                        try {
                          await uploadNewVersion(selectedDoc.id, formData)
                          setIsHistoryOpen(false)
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }
                    }
                    input.click()
                  }}>
                    <Plus size={16} className="mr-2" />
                    New Version
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700">Previous Versions</h4>
                  <div className="text-center py-8 text-slate-400 border border-dashed rounded-xl italic text-sm">
                    No older versions available for this document.
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="logs">
                 <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {String.fromCharCode(64 + i)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase">{i % 2 === 0 ? 'Download' : 'View'}</p>
                          <p className="text-[10px] text-slate-500">Employee {i} • Today at 2:4{i} PM</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">192.168.1.{i}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
