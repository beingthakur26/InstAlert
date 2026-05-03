"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  Send,
  Slack,
  Globe,
  Mail,
  CheckCircle,
  XCircle,
  Check,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

const CHANNEL_TYPES = ["slack", "webhook", "email"] as const

export default function NotificationsPage() {
  const { organization, userRole } = useAuth()
  const router = useRouter()
  const [channels, setChannels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: "slack" as string,
    config: { url: "", email: "", channel: "" },
    events: ["incident.created", "incident.updated", "incident.resolved", "sla.breach"],
    active: true,
  })

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await apiClient.get("/notifications/channels")
      setChannels(res.data.channels || [])
    } catch {
      toast.error("Failed to load notification channels")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ type: "slack", config: { url: "", email: "", channel: "" }, events: ["incident.created", "incident.updated", "incident.resolved", "sla.breach"], active: true })
  }

  const handleCreate = async () => {
    if (form.type === "slack" && !form.config.url) return toast.error("Webhook URL is required")
    if (form.type === "email" && !form.config.email) return toast.error("Email address is required")
    if (form.type === "webhook" && !form.config.url) return toast.error("Webhook URL is required")
    try {
      setIsSubmitting(true)
      await apiClient.post("/notifications/channels", {
        ...form,
        organizationId: organization?._id,
      })
      toast.success("Channel created")
      resetForm()
      setCreateDialogOpen(false)
      fetchChannels()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create channel")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/channels/${id}`)
      toast.success("Channel deleted")
      fetchChannels()
    } catch {
      toast.error("Failed to delete channel")
    }
  }

  const handleTest = async (id: string) => {
    try {
      setTestingId(id)
      await apiClient.post(`/notifications/channels/${id}/test`)
      toast.success("Test notification sent")
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Test failed")
    } finally {
      setTestingId(null)
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "slack": return <Slack className="w-5 h-5" />
      case "webhook": return <Globe className="w-5 h-5" />
      case "email": return <Mail className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
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
            <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">Notification Channels</h1>
            <p className="text-[#605A57] mt-1">Configure where incident alerts are sent.</p>
          </div>
          <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }} className="bg-[#37322F] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Channel
          </Button>
        </div>
      </header>

      {channels.length === 0 ? (
        <Card className="border-dashed border-[rgba(55,50,47,0.15)] bg-[#F7F5F3]/30">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-[#605A57]/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#37322F]">No channels configured</h3>
            <p className="text-sm text-[#605A57] mt-1">Add a Slack, webhook, or email channel to receive alerts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((ch) => (
            <Card key={ch._id} className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      ch.type === "slack" && "bg-purple-100 text-purple-600",
                      ch.type === "webhook" && "bg-blue-100 text-blue-600",
                      ch.type === "email" && "bg-green-100 text-green-600",
                    )}>
                      {typeIcon(ch.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#37322F] capitalize">{ch.type}</CardTitle>
                      <CardDescription className="text-xs truncate max-w-[200px]">
                        {ch.type === "email" ? ch.config?.email : ch.config?.channel || ch.config?.url}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn("rounded-full", ch.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                    {ch.active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {ch.active ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                <Button size="sm" variant="outline" className="rounded-lg text-xs flex-1" onClick={() => handleTest(ch._id)} disabled={testingId === ch._id}>
                  {testingId === ch._id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                  Test
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(ch._id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setCreateDialogOpen(open) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Notification Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.type === "slack" && (
              <div>
                <Label>Slack Webhook URL</Label>
                <Input value={form.config.url} onChange={(e) => setForm({ ...form, config: { ...form.config, url: e.target.value } })} placeholder="https://hooks.slack.com/services/..." />
              </div>
            )}
            {form.type === "webhook" && (
              <div>
                <Label>Webhook URL</Label>
                <Input value={form.config.url} onChange={(e) => setForm({ ...form, config: { ...form.config, url: e.target.value } })} placeholder="https://your-api.com/webhook" />
              </div>
            )}
            {form.type === "email" && (
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={form.config.email} onChange={(e) => setForm({ ...form, config: { ...form.config, email: e.target.value } })} placeholder="alerts@company.com" />
              </div>
            )}
            <div>
              <Label>Slack Channel (optional)</Label>
              <Input value={form.config.channel} onChange={(e) => setForm({ ...form, config: { ...form.config, channel: e.target.value } })} placeholder="#incidents" />
            </div>
            <div>
              <Label className="mb-2 block">Alert Triggers</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "incident.created", label: "Incident Created" },
                  { key: "incident.updated", label: "Incident Updated" },
                  { key: "incident.resolved", label: "Incident Resolved" },
                  { key: "sla.breach", label: "SLA Breach" },
                ].map(evt => (
                  <button
                    key={evt.key}
                    type="button"
                    onClick={() => {
                      const selected = form.events.includes(evt.key)
                        ? form.events.filter(e => e !== evt.key)
                        : [...form.events, evt.key]
                      setForm({ ...form, events: selected })
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                      form.events.includes(evt.key)
                        ? "bg-[#37322F]/5 border-[#37322F]/20 text-[#37322F] font-medium"
                        : "bg-[#F7F5F3] border-[rgba(55,50,47,0.08)] text-[#605A57]"
                    )}
                  >
                    <Check className={cn("w-3 h-3", form.events.includes(evt.key) ? "opacity-100" : "opacity-0")} />
                    {evt.label}
                  </button>
                ))}
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

      <Card className="border-[rgba(55,50,47,0.12)] bg-[#F7F5F3]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[#37322F]">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Slack className="w-4 h-4 text-purple-600" /></div>
              <h4 className="text-sm font-bold text-[#37322F]">Slack</h4>
            </div>
            <ol className="text-xs text-[#605A57] space-y-1 list-decimal list-inside">
              <li>Go to Slack App Directory</li>
              <li>Search "Incoming Webhooks"</li>
              <li>Add to your workspace</li>
              <li>Copy the Webhook URL</li>
              <li>Paste it here as the URL</li>
            </ol>
          </div>
          <div className="space-y-2 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
              <h4 className="text-sm font-bold text-[#37322F]">Webhook</h4>
            </div>
            <ol className="text-xs text-[#605A57] space-y-1 list-decimal list-inside">
              <li>Create an endpoint that accepts POST</li>
              <li>Parse JSON body with <code className="bg-[#F7F5F3] px-1 rounded">event</code>, <code className="bg-[#F7F5F3] px-1 rounded">data</code></li>
              <li>Copy your endpoint URL</li>
              <li>Paste it here as the URL</li>
            </ol>
          </div>
          <div className="space-y-2 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><Mail className="w-4 h-4 text-green-600" /></div>
              <h4 className="text-sm font-bold text-[#37322F]">Email</h4>
            </div>
            <ol className="text-xs text-[#605A57] space-y-1 list-decimal list-inside">
              <li>Set SMTP credentials in <code className="bg-[#F7F5F3] px-1 rounded">.env</code></li>
              <li>Use Gmail, SendGrid, or any SMTP</li>
              <li>Enter recipient email address</li>
              <li>Click Test to verify delivery</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
