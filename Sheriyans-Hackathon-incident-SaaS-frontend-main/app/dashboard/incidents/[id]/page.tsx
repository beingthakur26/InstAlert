"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  AlertCircle, 
  Clock, 
  User, 
  MapPin, 
  Zap, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  MessageCircle,
  History,
  ShieldCheck,
  Send,
  Search,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Incident, Activity, Message, SeverityPrediction, SimilarIncident, Assignee } from "@/types"

export default function IncidentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { organization, user } = useAuth()
  
  const [incident, setIncident] = useState<Incident | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [aiSummary, setAiSummary] = useState<string>("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [aiHistory, setAiHistory] = useState<{q: string, a: string}[]>([])
  const [rootCause, setRootCause] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [severityPrediction, setSeverityPrediction] = useState<SeverityPrediction | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>([])
  const [isFindingSimilar, setIsFindingSimilar] = useState(false)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        const [incRes, actRes, msgRes] = await Promise.all([
          apiClient.get(`/incidents/${id}`),
          apiClient.get(`/incidents/${id}/activities`),
          apiClient.get(`/incidents/${id}/messages`)
        ])
        
        setIncident(incRes.data.incident)
        setActivities(actRes.data.activities || [])
        setMessages(msgRes.data.messages || [])
      } catch (err) {
        toast.error("Failed to load incident details")
        router.push("/dashboard/incidents")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchDetails()
  }, [id, router])

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true)
      const res = await apiClient.post(`/incidents/${id}/summarize`)
      setAiSummary(res.data.summary)
      toast.success("AI Analysis complete")
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "AI Analysis failed")
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return
    try {
      setIsAsking(true)
      const res = await apiClient.post(`/incidents/${id}/ai-ask`, { question: aiQuestion })
      setAiHistory(prev => [...prev, { q: aiQuestion, a: res.data.answer }])
      setAiQuestion("")
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "AI Q&A failed")
    } finally {
      setIsAsking(false)
    }
  }

  const handleRootCause = async () => {
    try {
      setIsAnalyzing(true)
      const res = await apiClient.post(`/ai/${id}/root-cause`)
      setRootCause(res.data.analysis)
      toast.success("Root cause analysis complete")
    } catch {
      toast.error("Root cause analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSeverityPrediction = async () => {
    try {
      setIsPredicting(true)
      const res = await apiClient.post(`/ai/${id}/predict-severity`)
      setSeverityPrediction(res.data.prediction)
      toast.success("Severity prediction complete")
    } catch {
      toast.error("Severity prediction failed")
    } finally {
      setIsPredicting(false)
    }
  }

  const handleFindSimilar = async () => {
    try {
      setIsFindingSimilar(true)
      const res = await apiClient.post(`/ai/${id}/find-similar`)
      setSimilarIncidents(res.data.similar.similar_incidents || [])
      toast.success(`Found ${res.data.similar.similar_incidents?.length || 0} similar incidents`)
    } catch {
      toast.error("Similar incident search failed")
    } finally {
      setIsFindingSimilar(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#37322F]/20" />
        <p className="text-[#605A57] text-sm animate-pulse">Retreiving incident file...</p>
      </div>
    )
  }

  if (!incident) return null

  const resolvedActivity = activities.find(a => a.action.includes("resolved"))

  const unifiedTimeline = [
    ...activities.map((a) => ({
      type: "activity" as const,
      timestamp: new Date(a.createdAt),
      actor: a.user?.username || "System",
      detail: a.action,
      subdetail: a.detail || "",
    })),
    ...messages.map((m) => ({
      type: "message" as const,
      timestamp: new Date(m.createdAt),
      actor: m.sender,
      detail: m.content,
      subdetail: "",
    })),
    ...(incident.timeline_events || []).map((e: { event: string; timestamp: string }) => ({
      type: "event" as const,
      timestamp: new Date(e.timestamp),
      actor: "System",
      detail: e.event,
      subdetail: "",
    })),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const getEventIcon = (type: string, detail: string) => {
    if (detail.includes("report") || detail.includes("create")) return { icon: AlertTriangle, color: "bg-blue-500" }
    if (detail.includes("resolv") || detail.includes("close")) return { icon: CheckCircle, color: "bg-green-500" }
    if (detail.includes("edit") || detail.includes("update")) return { icon: Edit, color: "bg-amber-500" }
    if (detail.includes("assign")) return { icon: User, color: "bg-purple-500" }
    if (type === "message") return { icon: MessageSquare, color: "bg-[#605A57]" }
    return { icon: Eye, color: "bg-[#37322F]" }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-[#605A57] hover:text-[#37322F] -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
        <Badge className={cn(
          "px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]",
          incident.status === "closed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        )}>
          {incident.status === "closed" ? "Resolved" : "In Progress"}
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              {incident.incident_code ? (
                <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-bold">{incident.incident_code}</span>
              ) : (
                <span className="text-xs font-mono text-[#605A57] bg-[#F7F5F3] px-2 py-1 rounded">#{incident._id.slice(-8)}</span>
              )}
              <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">{incident.title}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#605A57] font-medium">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {incident.location || "N/A"}</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> {incident.priority} Priority</span>
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {incident.type}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="border-[rgba(55,50,47,0.08)] bg-[#F7F5F3]/30 shadow-none rounded-3xl overflow-hidden h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#605A57]">Initial Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#37322F] leading-relaxed whitespace-pre-wrap">
                      {incident.description}
                    </p>
                  </CardContent>
               </Card>

               <Card className="border-indigo-100 bg-indigo-50/20 shadow-none rounded-3xl overflow-hidden h-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> AI Summary
                    </CardTitle>
                    {!aiSummary && (
                       <Button variant="ghost" size="sm" onClick={handleSummarize} disabled={isSummarizing} className="h-6 text-[9px] uppercase font-bold text-indigo-700 bg-white">
                         {isSummarizing ? "Analyzing..." : "Generate"}
                       </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {aiSummary ? (
                      <p className="text-sm text-indigo-950 leading-relaxed italic">
                        "{aiSummary}"
                      </p>
                    ) : (
                      <p className="text-sm text-indigo-300 italic">No summary generated yet.</p>
                    )}
                  </CardContent>
               </Card>
            </div>
          </section>

          {/* AI Q&A Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#37322F]" />
                <h2 className="text-xl font-serif text-[#37322F]">AI Consult</h2>
             </div>
             
             <Card className="border-[rgba(55,50,47,0.08)] rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                   <ScrollArea className={cn("px-6 pt-6", aiHistory.length > 0 ? "h-60" : "h-auto")}>
                      {aiHistory.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                           <Sparkles className="w-8 h-8 text-indigo-200 mx-auto" />
                           <p className="text-xs text-[#605A57]">Ask AI for technical advice or root cause analysis.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 mb-6">
                           {aiHistory.map((qa, i) => (
                             <div key={i} className="space-y-3">
                                <div className="flex items-start gap-2 justify-end">
                                   <div className="bg-[#F7F5F3] p-3 rounded-2xl rounded-tr-none text-xs text-[#37322F] max-w-[80%]">
                                      {qa.q}
                                   </div>
                                   <User className="w-4 h-4 text-[#605A57] mt-2" />
                                </div>
                                <div className="flex items-start gap-2">
                                   <Sparkles className="w-4 h-4 text-indigo-600 mt-2" />
                                   <div className="bg-indigo-50 p-3 rounded-2xl rounded-tl-none text-xs text-indigo-950 max-w-[80%] border border-indigo-100">
                                      {qa.a}
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </ScrollArea>
                   <div className="p-4 bg-[#F7F5F3]/50 border-t border-[rgba(55,50,47,0.05)]">
                      <div className="relative">
                        <Input 
                          placeholder="Type your question..." 
                          className="bg-white border-[rgba(55,50,47,0.1)] pr-10 rounded-xl"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') handleAskAI()
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute right-1 top-1 h-8 w-8 text-indigo-600"
                          onClick={handleAskAI}
                          disabled={isAsking || !aiQuestion.trim()}
                        >
                          {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </section>

          {/* Timeline */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#37322F]" />
              <h2 className="text-xl font-serif text-[#37322F]">Event Timeline</h2>
              <Badge variant="secondary" className="ml-auto text-[10px] bg-[#F7F5F3] text-[#605A57]">
                {unifiedTimeline.length} events
              </Badge>
            </div>
            
            <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[rgba(55,50,47,0.08)]">
              {unifiedTimeline.map((evt, i) => {
                const { icon: Icon, color } = getEventIcon(evt.type, evt.detail)
                return (
                  <div key={i} className="relative group">
                    <div className={cn("absolute -left-[25px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125", color)} />
                    <div className="bg-[#F7F5F3]/40 rounded-xl p-4 border border-[rgba(55,50,47,0.05)] hover:border-[rgba(55,50,47,0.12)] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color.replace("bg-", "bg-").replace("500", "100"))}>
                          <Icon className={cn("w-4 h-4",
                            color.includes("blue") ? "text-blue-600" :
                            color.includes("green") ? "text-green-600" :
                            color.includes("amber") ? "text-amber-600" :
                            color.includes("purple") ? "text-purple-600" :
                            color.includes("[#605A57]") ? "text-[#605A57]" : "text-[#37322F]"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-[#37322F]">{evt.actor}</span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-white capitalize">
                              {evt.type}
                            </Badge>
                          </div>
                          {evt.type === "message" ? (
                            <p className="text-xs text-[#605A57] bg-white rounded-lg p-2 mt-1 border border-[rgba(55,50,47,0.05)]">{evt.detail}</p>
                          ) : (
                            <p className="text-sm text-[#605A57] capitalize">{evt.detail}</p>
                          )}
                          <p className="text-[10px] text-[#605A57]/60 mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {evt.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {unifiedTimeline.length === 0 && (
                <div className="p-8 text-center bg-[#F7F5F3]/30 rounded-xl border border-dashed border-[rgba(55,50,47,0.1)]">
                  <FileText className="w-8 h-8 text-[#605A57]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#605A57]">No events recorded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {/* Resolution Card */}
          {incident.status === "closed" && (
            <Card className="border-green-100 bg-green-50/30 rounded-3xl overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-green-700">
                  <ShieldCheck className="w-4 h-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">Resolution Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-green-700/60 font-bold uppercase">Resolved By</p>
                  <p className="text-sm font-bold text-[#37322F]">{resolvedActivity?.user?.username || "Authorized Staff"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-green-700/60 font-bold uppercase">Date & Time</p>
                  <p className="text-sm text-[#37322F]">{resolvedActivity ? new Date(resolvedActivity.createdAt).toLocaleString() : "N/A"}</p>
                </div>
                {incident.resolution && (
                  <div className="space-y-1 pt-2">
                    <p className="text-xs text-green-700/60 font-bold uppercase">Resolution Notes</p>
                    <p className="text-sm text-[#37322F] italic">"{incident.resolution}"</p>
                  </div>
                )}
                <div className="pt-2">
                  <Badge variant="outline" className="border-green-200 text-green-700 bg-white">Closed Successfully</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* People Involved */}
          <Card className="border-[rgba(55,50,47,0.08)] rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-[#F7F5F3]/30 border-b border-[rgba(55,50,47,0.05)]">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#605A57]">Stakeholders</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                  {incident.reporter?.username?.charAt(0) || "R"}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#605A57] uppercase">Reporter</p>
                  <p className="text-sm font-bold text-[#37322F]">{incident.reporter?.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                  {incident.assignees && incident.assignees.length > 0
                    ? incident.assignees[0].user?.username?.charAt(0) || "A"
                    : "A"}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#605A57] uppercase">Assignees</p>
                  <p className="text-sm font-bold text-[#37322F]">
                    {incident.assignees && incident.assignees.length > 0
                      ? incident.assignees.map((a: Assignee) => a.user?.username).filter(Boolean).join(", ")
                      : "Unassigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-[rgba(55,50,47,0.08)] rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-xs text-[#605A57]">Report Messages</span>
                 <Badge variant="secondary" className="bg-[#F7F5F3] text-[#37322F]">{messages.length}</Badge>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-[#605A57]">Timeline Events</span>
                 <Badge variant="secondary" className="bg-[#F7F5F3] text-[#37322F]">{activities.length}</Badge>
               </div>
            </CardContent>
          </Card>

          {/* AI Tools */}
          <Card className="border-indigo-100 bg-indigo-50/20 rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRootCause}
                disabled={isAnalyzing}
                className="w-full justify-start h-9 rounded-xl border-indigo-200 hover:bg-indigo-100 text-indigo-800"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                Root Cause Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeverityPrediction}
                disabled={isPredicting}
                className="w-full justify-start h-9 rounded-xl border-indigo-200 hover:bg-indigo-100 text-indigo-800"
              >
                {isPredicting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                Predict Severity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFindSimilar}
                disabled={isFindingSimilar}
                className="w-full justify-start h-9 rounded-xl border-indigo-200 hover:bg-indigo-100 text-indigo-800"
              >
                {isFindingSimilar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Find Similar Incidents
              </Button>

              {severityPrediction && (
                <div className="p-3 bg-white rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#605A57]">Severity Score</span>
                    <Badge className={cn(
                      "rounded-full text-[10px]",
                      severityPrediction.severity_score >= 7 ? "bg-red-100 text-red-700" :
                      severityPrediction.severity_score >= 4 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700",
                    )}>
                      {severityPrediction.severity_score}/10
                    </Badge>
                  </div>
                  <p className="text-xs text-[#605A57]">{severityPrediction.reasoning}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#605A57]">Confidence:</span>
                    <span className="text-[10px] font-bold text-indigo-700">{severityPrediction.confidence}%</span>
                  </div>
                </div>
              )}

              {similarIncidents.length > 0 && (
                <div className="space-y-2 mt-2">
                  <span className="text-[10px] font-bold uppercase text-[#605A57]">Similar Incidents</span>
                  {similarIncidents.map((si, i: number) => (
                    <div key={i} className="p-2 bg-white rounded-xl">
                      <p className="text-xs text-[#37322F] font-medium">{si.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#605A57]">{si.similarity_score}% match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rootCause && (
                <div className="p-3 bg-white rounded-xl mt-2">
                  <span className="text-[10px] font-bold uppercase text-[#605A57]">Root Cause</span>
                  <p className="text-xs text-[#37322F] mt-1 whitespace-pre-wrap line-clamp-6">{rootCause}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
