"use client"

import { useState, useEffect } from "react"
import { Plus, X, Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Incident, Member, Assignee } from "@/types"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface EditIncidentDialogProps {
  incident: Incident | null
  members: Member[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function EditIncidentDialog({ incident, members, open, onOpenChange, onUpdate }: EditIncidentDialogProps) {
  const [selectedAssignees, setSelectedAssignees] = useState<{userId: string, username: string, role: string}[]>([])
  const [currentAssigneeId, setCurrentAssigneeId] = useState("")
  const [incidentType, setIncidentType] = useState("Alert")
  const [priority, setPriority] = useState("Medium")
  const [status, setStatus] = useState("open")
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (incident && open) {
      setIncidentType(incident.type)
      setPriority(incident.priority)
      setStatus(incident.status)
      setTags(incident.tags || [])
      setSelectedAssignees((incident.assignees || []).map((a: Assignee) => ({
        userId: a.user?._id || "",
        username: a.user?.username || "Unknown",
        role: a.role,
      })).filter(a => a.userId))
    }
  }, [incident, open])

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim().toLowerCase())) {
      setNewTag("")
      return
    }
    setTags(prev => [...prev, newTag.trim().toLowerCase()])
    setNewTag("")
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const addAssignee = () => {
    if (!currentAssigneeId) return
    const member = members.find(m => m._id === currentAssigneeId)
    if (!member) return
    if (selectedAssignees.find(a => a.userId === currentAssigneeId)) return toast.error("User already assigned")
    setSelectedAssignees([...selectedAssignees, { userId: member._id, username: member.username, role: "Lead" }])
    setCurrentAssigneeId("")
  }

  const removeAssignee = (userId: string) => {
    setSelectedAssignees(selectedAssignees.filter(a => a.userId !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incident) return
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      location: formData.get("location"),
      priority,
      type: incidentType,
      status,
      assignees: selectedAssignees.map(a => ({ userId: a.userId, role: a.role })),
      tags,
    }
    try {
      await apiClient.put(`/incidents/${incident._id}`, payload)
      toast.success("Incident updated successfully")
      onOpenChange(false)
      onUpdate()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update incident")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedAssignees([])
    setTags([])
    setNewTag("")
  }

  if (!incident) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="bg-white border-[rgba(55,50,47,0.12)] sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-[#37322F]">Edit Incident</DialogTitle>
            <DialogDescription>Modify the details of the incident below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-title" className="text-xs font-bold text-[#37322F]">Title</Label>
                <Input id="edit-title" name="title" defaultValue={incident.title} required className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-xs font-bold text-[#37322F]">Type</Label>
                <Select onValueChange={setIncidentType} value={incidentType}>
                  <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <SelectItem value="Alert">Alert</SelectItem><SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Downtime">Downtime</SelectItem><SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-xs font-bold text-[#37322F]">Priority</Label>
                <Select onValueChange={setPriority} value={priority}>
                  <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-xs font-bold text-[#37322F]">Status</Label>
                <Select onValueChange={setStatus} value={status}>
                  <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem><SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-xs font-bold text-[#37322F]">Location / Component</Label>
                <Input id="edit-location" name="location" defaultValue={incident.location} className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#37322F]">Team Members</Label>
                <div className="flex gap-2">
                  <Select onValueChange={setCurrentAssigneeId} value={currentAssigneeId}>
                    <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10 flex-1">
                      <SelectValue placeholder="Add member..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                      {members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>{m.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addAssignee} variant="outline" size="icon" className="h-10 w-10 border-[rgba(55,50,47,0.1)]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAssignees.map((assignee) => (
                  <div key={assignee.userId} className="flex items-center gap-1.5 bg-[#F7F5F3] px-3 py-1.5 rounded-full border border-[rgba(55,50,47,0.05)]">
                    <span className="text-xs font-medium text-[#37322F]">{assignee.username}</span>
                    <span className="text-[10px] text-[#605A57] bg-white px-1.5 rounded-md border border-[rgba(55,50,47,0.05)]">{assignee.role}</span>
                    <button type="button" onClick={() => removeAssignee(assignee.userId)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-xs font-bold text-[#37322F]">Description</Label>
              <Textarea id="edit-description" name="description" defaultValue={incident.description} required className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F] min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#37322F]">Tags</Label>
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value.toLowerCase())} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Add a tag..." className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-9" />
                <Button type="button" onClick={addTag} variant="outline" size="sm" className="h-9"><Plus className="w-3 h-3" /></Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-indigo-50 text-indigo-700 rounded-full pr-1 text-xs">
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="bg-[#37322F] text-white rounded-full px-8 shadow-md hover:shadow-lg transition-all">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
