"use client"

import { useState } from "react"
import { Plus, X, Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Member } from "@/types"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface CreateIncidentDialogProps {
  members: Member[]
  organization: { _id: string } | null
  onCreated: () => void
}

export function CreateIncidentDialog({ members, organization, onCreated }: CreateIncidentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAssignees, setSelectedAssignees] = useState<{userId: string, username: string, role: string}[]>([])
  const [currentAssigneeId, setCurrentAssigneeId] = useState("")
  const [currentAssigneeRole, setCurrentAssigneeRole] = useState("Lead")
  const [incidentType, setIncidentType] = useState("Alert")
  const [priority, setPriority] = useState("Medium")
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim().toLowerCase())) {
      setNewTag("")
      return
    }
    setTags(prev => [...prev, newTag.trim().toLowerCase()])
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const addAssignee = () => {
    if (!currentAssigneeId) return
    const member = members.find(m => m._id === currentAssigneeId)
    if (!member) return
    if (selectedAssignees.find(a => a.userId === currentAssigneeId)) {
      return toast.error("User already assigned")
    }
    setSelectedAssignees([...selectedAssignees, {
      userId: member._id,
      username: member.username,
      role: currentAssigneeRole,
    }])
    setCurrentAssigneeId("")
  }

  const removeAssignee = (userId: string) => {
    setSelectedAssignees(selectedAssignees.filter(a => a.userId !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return toast.error("Please join an organization first")
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const payload = {
      title: formData.get("title"),
      type: incidentType,
      priority,
      location: formData.get("location"),
      description: formData.get("description"),
      organizationId: organization._id,
      assignees: selectedAssignees.map(a => ({ userId: a.userId, role: a.role })),
      tags,
    }
    try {
      await apiClient.post("/incidents", payload)
      toast.success("Incident reported and team assigned")
      setIsOpen(false)
      setSelectedAssignees([])
      setCurrentAssigneeId("")
      setCurrentAssigneeRole("Lead")
      setTags([])
      setNewTag("")
      onCreated()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to report incident")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#37322F] text-white rounded-full px-6 h-10 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-[rgba(55,50,47,0.12)] sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-[#37322F]">Create New Incident</DialogTitle>
            <DialogDescription>Fill in the details to alert the responsible team members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title" className="text-xs font-bold text-[#37322F]">Title</Label>
                <Input id="title" name="title" placeholder="e.g., Database Connection Timeout" required className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold text-[#37322F]">Type</Label>
                <Select onValueChange={setIncidentType} defaultValue={incidentType}>
                  <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <SelectItem value="Alert">Alert</SelectItem>
                    <SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Downtime">Downtime</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs font-bold text-[#37322F]">Priority</Label>
                <Select onValueChange={setPriority} defaultValue={priority}>
                  <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-bold text-[#37322F]">Location / Component</Label>
                <Input id="location" name="location" placeholder="e.g., Auth Module, AWS Cluster" className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F]" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold text-[#37322F]">Assign To</Label>
                <div className="flex gap-2">
                  <Select onValueChange={setCurrentAssigneeId} value={currentAssigneeId}>
                    <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10 flex-1">
                      <SelectValue placeholder="Select member..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                      {members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>{m.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setCurrentAssigneeRole} value={currentAssigneeRole}>
                    <SelectTrigger className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] h-10 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Observer">Observer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addAssignee} variant="outline" size="icon" className="h-10 w-10 border-[rgba(55,50,47,0.1)]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {selectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 col-span-2">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-[#37322F]">Description</Label>
              <Textarea id="description" name="description" placeholder="Describe the problem and its impact..." required className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F] min-h-[100px]" />
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
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#37322F] text-white rounded-full px-8">Dispatch Incident</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
