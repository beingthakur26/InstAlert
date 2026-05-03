"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  ArrowRight,
  Filter,
  Search,
  Loader2,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Incident, Member, Assignee, WorkloadEntry } from "@/types"

export default function AssignmentsPage() {
  const { user, organization, userRole } = useAuth()
  const [assignments, setAssignments] = useState<Incident[]>([])
  const [allOrgAssignments, setAllOrgAssignments] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const isOwner = userRole === "owner"
  
  // Submission modal state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Incident | null>(null)
  const [submissionNote, setSubmissionNote] = useState("")

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const res = await apiClient.get("/incidents")
      const incidents = res.data.incidents || []
      
      setAllOrgAssignments(incidents.filter((inc: Incident) => inc.assignees && inc.assignees.length > 0))
      
      if (isOwner) {
        setAssignments(incidents.filter((inc: Incident) => inc.assignees && inc.assignees.length > 0))
      } else {
        setAssignments(incidents.filter((inc: Incident) => inc.assignees?.some((a: Assignee) => a.user?._id === user?.id)))
      }
    } catch (err) {
      toast.error("Failed to load assignments")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAssignments()
    }
  }, [user])

  const handleCompleteAssignment = async () => {
    if (!selectedAssignment) return
    try {
      await apiClient.put(`/incidents/${selectedAssignment._id}`, { 
        status: "closed",
        description: selectedAssignment.description + "\n\n[Submission Note]: " + submissionNote
      })
      toast.success("Assignment marked as completed!")
      setIsSubmitOpen(false)
      setSubmissionNote("")
      fetchAssignments()
    } catch (err) {
      toast.error("Failed to complete assignment")
    }
  }

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.assignees?.some((asg: Assignee) => asg.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && a.status !== "closed"
    if (activeTab === "completed") return matchesSearch && a.status === "closed"
    return matchesSearch
  })

  const completedCount = assignments.filter((a) => a.status === "closed").length
  const progressPercentage = assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0

  
  // Calculate workloads for all members based on active tasks
  const workloads: WorkloadEntry[] = organization?.members?.map((member: Member) => {
    return {
      name: member.username,
      count: allOrgAssignments.filter(a => a.assignees?.some((asg: Assignee) => asg.user?._id === member._id) && a.status !== "closed").length,
    }
  }).sort((a, b) => b.count - a.count) || []

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#37322F] tracking-tight">{isOwner ? "Team Assignments" : "My Assignments"}</h1>
          <p className="text-[#605A57] text-sm mt-1">{isOwner ? "Track task distribution across the team." : "Tasks, incidents, and roles assigned to you."}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full px-6 h-11" onClick={() => router.push("/dashboard/incidents")}>
              Assign New Task
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="col-span-1 md:col-span-2 border-[rgba(55,50,47,0.12)] shadow-sm bg-white overflow-hidden relative">
           <div className="absolute right-0 top-0 w-64 h-64 bg-[#37322F]/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
          <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full relative z-10">
            <h3 className="text-sm font-bold text-[#605A57] uppercase tracking-widest mb-4">Overall Progress</h3>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-serif text-[#37322F] leading-none">{completedCount}</span>
              <span className="text-[#605A57] mb-1 font-medium">/ {assignments.length} tasks completed</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-[#F7F5F3] [&>[data-slot=progress-indicator]]:bg-[#37322F]" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-rows-2 gap-6">
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#605A57] uppercase tracking-widest mb-1">High Priority</h3>
                <span className="text-2xl font-serif text-[#37322F]">{assignments.filter(a => a.priority === "High" || a.priority === "Critical").length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#605A57] uppercase tracking-widest mb-1">Active</h3>
                <span className="text-2xl font-serif text-[#37322F]">{assignments.filter(a => a.status !== "closed").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex bg-[#F7F5F3] p-1 rounded-xl border border-[rgba(55,50,47,0.1)] w-fit">
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                className={cn("rounded-lg h-8 px-4 text-xs", activeTab === "all" ? "bg-white text-[#37322F] shadow-sm hover:bg-white" : "text-[#605A57]")}
                onClick={() => setActiveTab("all")}
              >
                All Tasks
              </Button>
              <Button
                variant={activeTab === "active" ? "default" : "ghost"}
                className={cn("rounded-lg h-8 px-4 text-xs", activeTab === "active" ? "bg-white text-[#37322F] shadow-sm hover:bg-white" : "text-[#605A57]")}
                onClick={() => setActiveTab("active")}
              >
                Active
              </Button>
              <Button
                variant={activeTab === "completed" ? "default" : "ghost"}
                className={cn("rounded-lg h-8 px-4 text-xs", activeTab === "completed" ? "bg-white text-[#37322F] shadow-sm hover:bg-white" : "text-[#605A57]")}
                onClick={() => setActiveTab("completed")}
              >
                Completed
              </Button>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
              <Input
                placeholder="Search assignments..."
                className="pl-9 h-10 bg-white border-[rgba(55,50,47,0.12)] focus:ring-[#37322F]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#37322F]/20" />
              <p className="text-[#605A57] text-sm">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white border border-dashed border-[rgba(55,50,47,0.2)] rounded-3xl p-12 text-center">
              <ClipboardList className="w-12 h-12 text-[#37322F]/10 mx-auto mb-4" />
              <h3 className="text-lg font-serif text-[#37322F]">No assignments found</h3>
              <p className="text-[#605A57] text-sm">You're all caught up! Enjoy your free time.</p>
            </div>
          ) : filteredAssignments.map((asg) => (
            <Card key={asg._id} className="border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] h-5 rounded-full px-2 font-bold bg-[#F7F5F3] text-[#605A57] border-[rgba(55,50,47,0.1)]">
                          {asg._id.slice(-6).toUpperCase()}
                        </Badge>
                        <Badge className={cn("text-[10px] h-5 rounded-full px-2 font-bold border-none",
                          asg.priority === "High" || asg.priority === "Critical" ? "bg-red-100 text-red-700" :
                            asg.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {asg.priority}
                        </Badge>
                        {asg.status === "closed" && (
                          <Badge className="text-[10px] h-5 rounded-full px-2 font-bold border-none bg-green-100 text-green-700">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-serif text-[#37322F]">{asg.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-[#605A57] mb-6 line-clamp-2">
                    {asg.description || "No description provided."}
                  </p>

                  <div className="flex flex-col md:flex-row md:items-center gap-8 mb-6">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Avatar className="h-10 w-10 border border-[rgba(55,50,47,0.1)]">
                        <AvatarFallback className="bg-[#F7F5F3] text-[#37322F] font-bold">
                          {asg.assignees && asg.assignees.length > 0
                            ? asg.assignees[0].user?.username?.charAt(0) || "?"
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[10px] font-bold text-[#605A57] uppercase tracking-wider">Assignees</p>
                        <p className="text-sm font-medium text-[#37322F]">
                          {asg.assignees && asg.assignees.length > 0
                            ? asg.assignees.map((a: Assignee) => a.user?.username).filter(Boolean).join(", ")
                            : "Unassigned"}
                          {asg.assignees?.some((a: Assignee) => a.user?._id === user?.id) && " (You)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-[#605A57] uppercase tracking-wider">Created</p>
                        <div className="flex items-center gap-1.5 text-sm text-[#37322F]">
                          <Calendar className="w-3.5 h-3.5 text-[#605A57]" />
                          {new Date(asg.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#605A57]">Incident Type</span>
                      <span className="font-bold text-[#37322F] uppercase tracking-tighter">{asg.type}</span>
                    </div>
                    <Progress value={asg.status === 'closed' ? 100 : 50} className={cn("h-1.5 bg-[#F7F5F3]", asg.status === 'closed' ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500")} />
                  </div>
                </div>
                <div className="bg-[#F7F5F3]/30 px-6 py-3 border-t border-[rgba(55,50,47,0.05)] flex justify-between items-center">
                  <span className="text-[10px] text-[#605A57]">Location: {asg.location || "N/A"}</span>
                  
                  <div className="flex items-center gap-2">
                    {asg.status !== "closed" && (!isOwner || asg.assignees?.some((a: Assignee) => a.user?._id === user?.id)) && (
                      <Button 
                        className="bg-[#37322F] text-white rounded-full h-8 px-4 text-xs font-bold uppercase tracking-widest"
                        onClick={() => {
                          setSelectedAssignment(asg)
                          setIsSubmitOpen(true)
                        }}
                      >
                        Submit Work <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    {asg.status === "closed" && (
                      <span className="flex items-center text-xs font-bold text-green-600 uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
                      </span>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-[#37322F] text-xs font-bold hover:no-underline group"
                      onClick={() => router.push("/dashboard/incidents")}
                    >
                      View in Hub <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {isOwner && (
            <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-6 border-b border-[rgba(55,50,47,0.05)] bg-[#F7F5F3]/30">
                <CardTitle className="text-lg font-serif text-[#37322F]">Team Workload</CardTitle>
                <CardDescription>Active assignments per member</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {workloads.map((m) => (
                  <div key={m.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-[#37322F]">{m.name}</span>
                      <span className="text-[#605A57] font-bold">{m.count} tasks</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F7F5F3] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          m.count > 4 ? "bg-red-500" : m.count > 2 ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min((m.count / 6) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {workloads.length === 0 && (
                  <p className="text-xs text-[#605A57] italic">No active workload data available.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-[rgba(55,50,47,0.05)] bg-[#F7F5F3]/30">
              <CardTitle className="text-lg font-serif text-[#37322F]">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Resolved Total</span>
                </div>
                <span className="font-bold text-green-800">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Active</span>
                </div>
                <span className="font-bold text-blue-800">{assignments.length - completedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="bg-white border-[rgba(55,50,47,0.12)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-[#37322F]">Submit Assignment</DialogTitle>
            <DialogDescription>
              Mark "{selectedAssignment?.title}" as complete and notify the organization owner.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#37322F] uppercase tracking-widest">Completion Notes</Label>
              <Textarea 
                placeholder="Detail what was done, link to PRs, or leave a message for the owner..." 
                className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F] min-h-[120px]"
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteAssignment} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
              <Send className="w-4 h-4 mr-2" />
              Submit & Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

