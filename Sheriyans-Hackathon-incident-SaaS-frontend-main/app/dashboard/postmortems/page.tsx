"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, Loader2, Eye, Edit, Sparkles, Clock, AlertCircle, Download, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function PostmortemsPage() {
  const [postmortems, setPostmortems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPostmortem, setSelectedPostmortem] = useState<any>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [filter, setFilter] = useState("")

  // Manual creation state
  const [manualCode, setManualCode] = useState("")
  const [manualWhat, setManualWhat] = useState("")
  const [manualWhy, setManualWhy] = useState("")
  const [manualFix, setManualFix] = useState("")
  const [isCreatingManual, setIsCreatingManual] = useState(false)

  // AI generation state
  const [aiCode, setAiCode] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  useEffect(() => {
    fetchPostmortems()
  }, [filter])

  const fetchPostmortems = async () => {
    try {
      setIsLoading(true)
      const params: Record<string, string> = {}
      if (filter) params.status = filter
      const res = await apiClient.get("/postmortems", { params })
      setPostmortems(res.data.postmortems || [])
    } catch {
      toast.error("Failed to load postmortems")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateManual = async () => {
    if (!manualCode.trim()) return toast.error("Incident code is required")
    if (!manualWhat.trim()) return toast.error("Description is required")
    try {
      setIsCreatingManual(true)
      await apiClient.post("/postmortems", {
        incidentCode: manualCode.toUpperCase(),
        what_happened: manualWhat,
        why_it_happened: manualWhy,
        fix_applied: manualFix,
      })
      toast.success("Postmortem created")
      setManualCode("")
      setManualWhat("")
      setManualWhy("")
      setManualFix("")
      fetchPostmortems()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create postmortem")
    } finally {
      setIsCreatingManual(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiCode.trim()) return toast.error("Incident code is required")
    try {
      setIsGeneratingAI(true)
      await apiClient.post(`/postmortems/generate/code/${aiCode.toUpperCase()}`)
      toast.success("AI postmortem generated")
      setAiCode("")
      fetchPostmortems()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to generate postmortem")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleDownload = async (id: string) => {
    try {
      const res = await apiClient.get(`/postmortems/download/${id}`, { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `postmortem-${id}.txt`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Postmortem downloaded")
    } catch {
      toast.error("Failed to download postmortem")
    }
  }

  const viewPostmortem = async (id: string) => {
    try {
      const res = await apiClient.get(`/postmortems/${id}`)
      setSelectedPostmortem(res.data.postmortem)
      setIsViewing(true)
    } catch {
      toast.error("Failed to load postmortem")
    }
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    review: "bg-amber-100 text-amber-700",
    published: "bg-green-100 text-green-700",
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-[#37322F]">Postmortems</h1>
          <p className="text-xs text-[#605A57]">Blameless incident reports and lessons learned</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#37322F] text-white hover:bg-[#37322F]/90 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> New Postmortem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Postmortem</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-xl", "bg-[#37322F] text-white")}
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> Manual
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Generate
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Incident Code</Label>
                <Input
                  placeholder="e.g., INC-ABC123"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              <div>
                <Label>What Happened</Label>
                <Textarea
                  placeholder="Describe what happened..."
                  className="min-h-[100px]"
                  value={manualWhat}
                  onChange={(e) => setManualWhat(e.target.value)}
                />
              </div>
              <div>
                <Label>Why It Happened</Label>
                <Textarea
                  placeholder="Root cause analysis..."
                  className="min-h-[100px]"
                  value={manualWhy}
                  onChange={(e) => setManualWhy(e.target.value)}
                />
              </div>
              <div>
                <Label>Fix Applied</Label>
                <Textarea
                  placeholder="What was done to resolve the issue..."
                  className="min-h-[60px]"
                  value={manualFix}
                  onChange={(e) => setManualFix(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setManualCode(""); setManualWhat(""); setManualWhy(""); setManualFix("") }}>Cancel</Button>
                <Button className="bg-[#37322F] text-white" onClick={handleCreateManual} disabled={isCreatingManual}>
                  {isCreatingManual && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Draft
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Sparkles className="w-4 h-4 mr-2" /> AI Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Postmortem
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-[#605A57]">Enter an incident code and AI will analyze all messages and activity to generate a postmortem.</p>
              <div>
                <Label>Incident Code</Label>
                <Input
                  placeholder="e.g., INC-ABC123"
                  value={aiCode}
                  onChange={(e) => setAiCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleGenerateAI} disabled={isGeneratingAI}>
                  {isGeneratingAI && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex gap-2">
        {["", "draft", "review", "published"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl capitalize",
              filter === f && "bg-[#37322F] text-white",
            )}
          >
            {f || "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#37322F]/20" />
          <p className="text-[#605A57] text-sm">Loading postmortems...</p>
        </div>
      ) : postmortems.length === 0 ? (
        <Card className="border-[rgba(55,50,47,0.08)] rounded-3xl">
          <CardContent className="p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-[#605A57]/20 mx-auto" />
            <h3 className="text-lg font-serif text-[#37322F]">No postmortems yet</h3>
            <p className="text-sm text-[#605A57]">Create one manually or generate with AI from an incident.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postmortems.map((pm) => (
            <Card
              key={pm._id}
              className="border-[rgba(55,50,47,0.08)] rounded-2xl hover:border-indigo-200 transition-colors cursor-pointer"
              onClick={() => viewPostmortem(pm._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={cn("rounded-full text-[10px]", statusColors[pm.status] || "bg-gray-100 text-gray-700")}>
                    {pm.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {pm.generated_by}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium text-[#37322F] line-clamp-2 mt-2">
                  {pm.incident?.title || "Untitled Postmortem"}
                </CardTitle>
                {pm.incident?.incident_code && (
                  <span className="text-[10px] font-mono text-[#605A57] bg-[#F7F5F3] px-2 py-0.5 rounded-full inline-block mt-1">
                    {pm.incident.incident_code}
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-[#605A57]">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {pm.incident?.priority || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(pm.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#605A57] line-clamp-3">
                  {pm.what_happened?.substring(0, 150)}...
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-[10px] h-7 flex-1"
                    onClick={(e) => { e.stopPropagation(); handleDownload(pm._id) }}
                  >
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Postmortem Report
            </DialogTitle>
          </DialogHeader>
          {selectedPostmortem && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={cn("rounded-full", statusColors[selectedPostmortem.status])}>
                    {selectedPostmortem.status}
                  </Badge>
                  {selectedPostmortem.generated_by === "ai" && (
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                      <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleDownload(selectedPostmortem._id)}
                >
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>

              {selectedPostmortem.incident?.incident_code && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#605A57]">Incident Code:</span>
                  <code className="text-sm font-mono bg-[#F7F5F3] px-2 py-0.5 rounded">{selectedPostmortem.incident.incident_code}</code>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#605A57] mb-2">What Happened</h3>
                <p className="text-sm text-[#37322F] whitespace-pre-wrap leading-relaxed">
                  {selectedPostmortem.what_happened}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#605A57] mb-2">Root Cause</h3>
                <p className="text-sm text-[#37322F] whitespace-pre-wrap leading-relaxed">
                  {selectedPostmortem.why_it_happened}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#605A57] mb-2">Fix Applied</h3>
                <p className="text-sm text-[#37322F] whitespace-pre-wrap leading-relaxed">
                  {selectedPostmortem.fix_applied}
                </p>
              </div>

              {selectedPostmortem.prevention_steps?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#605A57] mb-2">Prevention Steps</h3>
                  <ul className="space-y-1">
                    {selectedPostmortem.prevention_steps.map((step: string, i: number) => (
                      <li key={i} className="text-sm text-[#37322F] flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPostmortem.action_items?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#605A57] mb-2">Action Items</h3>
                  <div className="space-y-2">
                    {selectedPostmortem.action_items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-[#37322F]">{item.action}</p>
                          <p className="text-xs text-[#605A57]">Owner: {item.owner} | Priority: {item.priority}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
