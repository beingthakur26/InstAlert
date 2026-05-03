"use client"

import Link from "next/link"
import { 
  AlertCircle, 
  MoreVertical,
  Loader2,
  Sparkles,
  Activity,
  MapPin,
  Zap,
  Clock,
  User,
  MessageCircle,
  Send,
  X,
  Edit,
  Trash2,
  Copy,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Incident, Assignee } from "@/types"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface IncidentCardProps {
  incident: Incident
  isOrgOwner: boolean
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  onEdit: (incident: Incident) => void
  onDelete: (id: string) => void
  onResolve: (id: string) => void
  summarizingId: string | null
  summaries: Record<string, string>
  onSummarize: (id: string) => void
  aiQuestions: Record<string, string>
  aiHistory: Record<string, { q: string; a: string }[]>
  onAskAI: (id: string) => void
  setAiQuestions: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function IncidentCard({
  incident,
  isOrgOwner,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
  onResolve,
  summarizingId,
  summaries,
  onSummarize,
  aiQuestions,
  aiHistory,
  onAskAI,
  setAiQuestions,
}: IncidentCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyIncidentCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(code)
    toast.success(`Copied ${code}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div key={incident._id} className="bg-white border border-[rgba(55,50,47,0.08)] rounded-3xl overflow-hidden hover:border-[rgba(55,50,47,0.2)] transition-all group shadow-sm shadow-[rgba(55,50,47,0.02)]">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F5F3] flex items-center justify-center text-[#37322F]/30 border border-[rgba(55,50,47,0.05)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {incident.incident_code ? (
                  <button
                    onClick={() => incident.incident_code && copyIncidentCode(incident.incident_code)}
                    className="flex items-center gap-1 text-[10px] font-mono text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full uppercase tracking-tighter hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Copy incident code"
                  >
                    {incident.incident_code}
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-[#605A57] px-2 py-0.5 bg-[#F7F5F3] rounded-full uppercase tracking-tighter">{incident._id.slice(-6)}</span>
                )}
                <Link href={`/dashboard/incidents/${incident._id}`} className="hover:underline">
                  <h3 className="text-lg font-bold text-[#37322F] tracking-tight">{incident.title}</h3>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#605A57] font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {incident.location || "N/A"}</span>
                <span className="text-[#37322F]/10">•</span>
                <span className="flex items-center gap-1 capitalize"><Zap className="w-3 h-3" /> {incident.priority}</span>
                <span className="text-[#37322F]/10">•</span>
                <span className="flex items-center gap-1 uppercase tracking-widest">{incident.type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-[#605A57] uppercase tracking-widest">Assignees</span>
              <div className="flex items-center gap-2 mt-0.5">
                {incident.assignees && incident.assignees.length > 0 ? (
                  <>
                    <div className="flex -space-x-2">
                      {incident.assignees.slice(0, 3).map((a: Assignee, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-[#37322F]/5 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#37322F]">
                          {a.user?.username?.charAt(0) || "?"}
                        </div>
                      ))}
                      {incident.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-[#37322F]/10 border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#605A57]">
                          +{incident.assignees.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#37322F]">
                      {incident.assignees.map((a: Assignee) => a.user?.username).filter(Boolean).join(", ")}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-[#37322F]/5 border border-[rgba(55,50,47,0.1)] flex items-center justify-center text-[10px] font-bold text-[#37322F]">?</div>
                    <span className="text-xs font-semibold text-[#37322F]">Unassigned</span>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuId(openMenuId === incident._id ? null : incident._id)
                }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl hover:bg-[#F7F5F3] ml-2 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-[#605A57]" />
              </button>
              {openMenuId === incident._id && (
                <div className="absolute right-0 top-10 z-50 bg-white border border-[rgba(55,50,47,0.12)] rounded-lg shadow-lg w-44 p-1" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#605A57] px-3 py-1.5">Actions</div>
                  <div className="border-t border-[rgba(55,50,47,0.05)] my-1" />
                  <Link href={`/dashboard/incidents/${incident._id}`} className="flex items-center px-3 py-2 text-xs text-[#37322F] hover:bg-[#F7F5F3] rounded-md">
                    <Activity className="w-3.5 h-3.5 mr-2" />
                    View Details
                  </Link>
                  {isOrgOwner && (
                    <>
                      <button
                        onClick={() => { onEdit(incident); setOpenMenuId(null) }}
                        className="w-full flex items-center px-3 py-2 text-xs text-[#37322F] hover:bg-[#F7F5F3] rounded-md cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Edit Incident
                      </button>
                      <button
                        onClick={() => { onDelete(incident._id); setOpenMenuId(null) }}
                        className="w-full flex items-center px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete Incident
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F7F5F3]/50 rounded-2xl border border-[rgba(55,50,47,0.03)] mb-6">
          <p className="text-sm text-[#37322F] leading-relaxed whitespace-pre-wrap">
            {incident.description || "No detailed description provided."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[rgba(55,50,47,0.05)]">
          <div className="flex items-center gap-6 text-[10px] text-[#605A57] font-medium uppercase tracking-widest">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(incident.createdAt).toLocaleDateString()} at {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Reported by {incident.reporter?.username || "System"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSummarize(incident._id)}
              disabled={summarizingId === incident._id}
              className="h-8 text-[10px] font-bold uppercase tracking-widest text-[#37322F] bg-[#F7F5F3] hover:bg-[#37322F] hover:text-white rounded-full transition-all"
            >
              {summarizingId === incident._id ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              AI Analysis
            </Button>
            <Button
              size="sm"
              onClick={() => onResolve(incident._id)}
              disabled={incident.status === "closed"}
              className="h-8 bg-[#37322F] text-white text-[10px] font-bold uppercase tracking-widest px-4 rounded-full disabled:opacity-50"
            >
              {incident.status === "closed" ? "Resolved" : "Resolve"}
            </Button>
          </div>
        </div>

        {(summaries[incident._id] || aiHistory[incident._id]?.length > 0) && (
          <div className="mt-4 p-4 bg-[#F7F5F3] rounded-2xl border border-[rgba(55,50,47,0.1)] animate-in slide-in-from-top-2 duration-300">
            {summaries[incident._id] && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#37322F]" />
                  <span className="text-[10px] font-bold text-[#37322F] uppercase tracking-widest">AI Intelligence Report</span>
                </div>
                <p className="text-xs text-[#605A57] leading-relaxed italic">
                  "{summaries[incident._id]}"
                </p>
              </div>
            )}
            {aiHistory[incident._id]?.map((qa, i) => (
              <div key={i} className="mt-3 pt-3 border-t border-[rgba(55,50,47,0.05)]">
                <div className="flex items-start gap-2 mb-1.5">
                  <User className="w-3.5 h-3.5 text-[#37322F] mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-[#37322F]">{qa.q}</p>
                </div>
                <div className="flex items-start gap-2 pl-5">
                  <Sparkles className="w-3.5 h-3.5 text-[#605A57] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#605A57] leading-relaxed">{qa.a}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 flex gap-2 relative">
              <Input
                placeholder="Ask AI anything about this incident..."
                className="text-xs bg-white border-[rgba(55,50,47,0.12)] pr-10"
                value={aiQuestions[incident._id] || ""}
                onChange={(e) => setAiQuestions(prev => ({...prev, [incident._id]: e.target.value}))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAskAI(incident._id)
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-7 w-7 text-[#37322F] hover:bg-[#F7F5F3]"
                onClick={() => onAskAI(incident._id)}
                disabled={summarizingId === incident._id || !aiQuestions[incident._id]?.trim()}
              >
                {summarizingId === incident._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
