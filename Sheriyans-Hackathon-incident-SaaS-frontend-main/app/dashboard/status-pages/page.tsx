"use client"

import { useState, useEffect } from "react"
import {
  Globe,
  Plus,
  Loader2,
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MinusCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

const COMPONENT_STATUS = ["operational", "degraded", "partial_outage", "major_outage"] as const

export default function StatusPagesPage() {
  const { organization, userRole } = useAuth()
  const router = useRouter()
  const [statusPages, setStatusPages] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    components: [{ name: "API", status: "operational", description: "REST API endpoints" }],
  })

  useEffect(() => {
    fetchStatusPages()
    fetchIncidents()
  }, [])

  const fetchStatusPages = async () => {
    try {
      const res = await apiClient.get("/status-page")
      const pages = Array.isArray(res.data.pages) ? res.data.pages : res.data.page ? [res.data.page] : []
      setStatusPages(pages)
    } catch {
      // No status pages
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIncidents = async () => {
    try {
      const res = await apiClient.get("/incidents")
      setIncidents(res.data.incidents || [])
    } catch {
      // No incidents
    }
  }

  const resetForm = () => {
    setForm({ title: "", slug: "", description: "", components: [{ name: "API", status: "operational", description: "REST API endpoints" }] })
  }

  const handleCreate = async () => {
    if (!form.title || !form.slug) return toast.error("Title and slug are required")
    try {
      setIsSubmitting(true)
      await apiClient.post("/status-page", { ...form })
      toast.success("Status page created")
      resetForm()
      setCreateDialogOpen(false)
      fetchStatusPages()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create status page")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (pageId: string) => {
    try {
      await apiClient.delete(`/status-page/${pageId}`)
      toast.success("Status page deleted")
      fetchStatusPages()
    } catch {
      toast.error("Failed to delete status page")
    }
  }

  const addIncidentToStatusPage = async (pageId: string, incidentId: string) => {
    try {
      await apiClient.post("/status-page/incident", { pageId, incidentId, status: "investigating" })
      toast.success("Incident added to status page")
      fetchStatusPages()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add incident")
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "degraded": return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "partial_outage": return <MinusCircle className="w-4 h-4 text-orange-500" />
      case "major_outage": return <XCircle className="w-4 h-4 text-red-500" />
      default: return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-4">
        <Button variant="ghost" size="sm" className="text-[#605A57] hover:text-[#37322F] -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">Status Pages</h1>
            <p className="text-[#605A57] mt-1">Public-facing system status dashboards.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }} className="bg-[#37322F] text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> New Page
            </Button>
          </div>
        </div>
      </header>

      {statusPages.length === 0 ? (
        <Card className="border-dashed border-[rgba(55,50,47,0.15)] bg-[#F7F5F3]/30">
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 text-[#605A57]/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#37322F]">No status pages</h3>
            <p className="text-sm text-[#605A57] mt-1">Create a public status page to show system health to your users.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {statusPages.map((page) => (
            <Card key={page._id} className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-[#37322F]">{page.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">/{page.slug}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => window.open(`/status-page/public/${page.slug}`, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(page._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.description && <p className="text-sm text-[#605A57]">{page.description}</p>}
                {page.components && page.components.length > 0 && (
                  <div className="space-y-2">
                    {page.components.map((comp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-[rgba(55,50,47,0.05)] last:border-0">
                        <div className="flex items-center gap-2">
                          {statusIcon(comp.status)}
                          <span className="text-sm text-[#37322F]">{comp.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">{comp.status.replace("_", " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {page.incidents && page.incidents.length > 0 && (
                  <div className="text-xs text-[#605A57] mt-2">
                    {page.incidents.length} incident{page.incidents.length !== 1 && "s"} linked
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setCreateDialogOpen(open) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Status Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="e.g., System Status" />
            </div>
            <div>
              <Label>Slug (URL path)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="system-status" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this status page" className="min-h-[60px]" />
            </div>
            <div>
              <Label>Components</Label>
              <div className="space-y-2">
                {form.components.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={comp.name} onChange={(e) => {
                      const comps = [...form.components]
                      comps[idx] = { ...comp, name: e.target.value }
                      setForm({ ...form, components: comps })
                    }} placeholder="Component name" className="h-8" />
                    <select
                      value={comp.status}
                      onChange={(e) => {
                        const comps = [...form.components]
                        comps[idx] = { ...comp, status: e.target.value }
                        setForm({ ...form, components: comps })
                      }}
                      className="h-8 rounded border text-xs px-2 bg-white"
                    >
                      {COMPONENT_STATUS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    {form.components.length > 1 && (
                      <button onClick={() => setForm({ ...form, components: form.components.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setForm({ ...form, components: [...form.components, { name: "", status: "operational", description: "" }] })}>
                  <Plus className="w-3 h-3 mr-1" /> Add Component
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setCreateDialogOpen(false) }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-[#37322F] text-white">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
