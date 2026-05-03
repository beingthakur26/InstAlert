"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Incident, Member, Assignee } from "@/types"
import { IncidentCard } from "@/components/incidents/incident-card"
import { CreateIncidentDialog } from "@/components/incidents/create-dialog"
import { EditIncidentDialog } from "@/components/incidents/edit-dialog"
import { ResolveDialog } from "@/components/incidents/resolve-dialog"

export default function IncidentsPage() {
  const { organization, user, userRole } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [askingId, setAskingId] = useState<string | null>(null)
  const [aiQuestions, setAiQuestions] = useState<Record<string, string>>({})
  const [aiHistory, setAiHistory] = useState<Record<string, {q: string, a: string}[]>>({})

  const isOrgOwner = userRole === "owner"

  const fetchIncidents = async () => {
    try {
      setIsLoading(true)
      const res = await apiClient.get("/incidents")
      setIncidents(res.data.incidents || [])
    } catch (err) {
      toast.error("Failed to load incidents")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get("/organization/get-employees")
      let allMembers: Member[] = res.data.members || []
      if (organization?.owner) {
        if (!allMembers.find((m) => m._id === organization.owner._id)) {
          allMembers.unshift({
            _id: organization.owner._id,
            username: organization.owner.username,
            email: organization.owner.email,
            role: "organization"
          })
        }
      }
      setMembers(allMembers)
    } catch (err) {
      console.error("Failed to load members for assignment")
    }
  }

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener("click", closeMenu)
      return () => document.removeEventListener("click", closeMenu)
    }
  }, [openMenuId])

  useEffect(() => {
    fetchIncidents()
    fetchMembers()
  }, [organization])

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this incident?")) return
    try {
      await apiClient.delete(`/incidents/${id}`)
      toast.success("Incident deleted")
      fetchIncidents()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Only the organization owner can delete incidents")
    }
  }

  const handleResolve = (id: string) => {
    setResolvingId(id)
    setIsResolveModalOpen(true)
  }

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get("/incidents/export/csv", { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `incidents_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("CSV exported successfully")
    } catch (err) {
      toast.error("Failed to export CSV")
    }
  }

  const handleSummarize = async (id: string) => {
    try {
      setSummarizingId(id)
      const res = await apiClient.post(`/incidents/${id}/summarize`)
      setSummaries(prev => ({ ...prev, [id]: res.data.summary }))
      toast.success("AI Analysis complete")
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "AI Analysis failed")
    } finally {
      setSummarizingId(null)
    }
  }

  const handleAskAI = async (id: string) => {
    const question = aiQuestions[id]
    if (!question?.trim()) return
    try {
      setAskingId(id)
      const res = await apiClient.post(`/incidents/${id}/ai-ask`, { question })
      setAiHistory(prev => {
        const history = prev[id] || []
        return { ...prev, [id]: [...history, { q: question, a: res.data.answer }] }
      })
      setAiQuestions(prev => ({ ...prev, [id]: "" }))
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "AI Q&A failed")
    } finally {
      setAskingId(null)
    }
  }

  const filteredIncidents = incidents.filter(inc => {
    const assigneeNames = (inc.assignees || []).map((a: Assignee) => a.user?.username || "").filter(Boolean).join(" ").toLowerCase()
    const matchesSearch = inc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inc._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inc.incident_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assigneeNames.includes(searchTerm.toLowerCase())
    let matchesTab = false
    if (activeTab === "all") matchesTab = true
    else if (activeTab === "active") matchesTab = inc.status === "open" || inc.status === "in_progress"
    else if (activeTab === "resolved") matchesTab = inc.status === "closed"
    return matchesSearch && matchesTab
  })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#37322F]">Incidents Hub</h1>
          <p className="text-[#605A57] text-sm mt-1">Detailed tracking and resolution management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="rounded-full px-4 h-10 text-[#37322F] border-[rgba(55,50,47,0.12)]">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {organization && (
            <CreateIncidentDialog
              members={members}
              organization={organization}
              onCreated={fetchIncidents}
            />
          )}
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#F7F5F3]/50 p-2 rounded-2xl border border-[rgba(55,50,47,0.08)]">
          <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-9 gap-1">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#37322F] data-[state=active]:text-white text-xs px-6">All</TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-[#37322F] data-[state=active]:text-white text-xs px-6">Active</TabsTrigger>
              <TabsTrigger value="resolved" className="rounded-lg data-[state=active]:bg-[#37322F] data-[state=active]:text-white text-xs px-6">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-72 mr-2">
            <Input
              placeholder="Search by ID, title, or assignee..."
              className="pl-9 h-9 text-xs bg-white border-[rgba(55,50,47,0.12)] rounded-full focus:ring-[#37322F]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-[#605A57] text-sm animate-pulse">Syncing with command center...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident._id}
                incident={incident}
                isOrgOwner={isOrgOwner}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
                summarizingId={summarizingId}
                summaries={summaries}
                onSummarize={handleSummarize}
                aiQuestions={aiQuestions}
                aiHistory={aiHistory}
                onAskAI={handleAskAI}
                setAiQuestions={setAiQuestions}
              />
            ))}

            {filteredIncidents.length === 0 && (
              <div className="p-20 text-center bg-[#F7F5F3]/30 border border-dashed border-[rgba(55,50,47,0.12)] rounded-3xl">
                <h3 className="text-[#37322F] font-serif text-xl italic">Silence is golden</h3>
                <p className="text-[#605A57] text-sm mt-1 max-w-xs mx-auto">No incidents match your current filters. Take a breather!</p>
              </div>
            )}
          </div>
        )}

        <EditIncidentDialog
          incident={editingIncident}
          members={members}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onUpdate={fetchIncidents}
        />

        <ResolveDialog
          open={isResolveModalOpen}
          onOpenChange={setIsResolveModalOpen}
          incidentId={resolvingId}
          onResolved={fetchIncidents}
        />
      </div>
    </div>
  )
}
