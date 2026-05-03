"use client"

import { useState, useEffect } from "react"
import { 
  Settings, 
  CheckCircle2, 
  ClipboardList, 
  AlertCircle, 
  UserPlus, 
  Building,
  Filter,
  Download,
  Calendar,
  Search,
  Loader2,
  RefreshCcw,
  Zap,
  ArrowRight,
  Shield,
  MessageSquare,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

const ICON_MAP: Record<string, any> = {
  incident: AlertCircle,
  member: UserPlus,
  settings: Settings,
  chat: MessageSquare,
  default: Building
}

const COLOR_MAP: Record<string, string> = {
  incident: "bg-red-500",
  member: "bg-blue-500",
  settings: "bg-amber-500",
  chat: "bg-green-500",
  default: "bg-[#37322F]"
}

export default function ActivityTimelinePage() {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const res = await apiClient.get("/activities")
      setActivities(res.data.activities)
    } catch (err) {
      toast.error("Failed to load activities")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#37322F] tracking-tight">Activity Hub</h1>
          <p className="text-[#605A57] text-sm mt-1">Real-time chronicle of organization events.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-[rgba(55,50,47,0.12)] text-[#37322F] h-9"
            onClick={fetchActivities}
           >
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin")} />
              Refresh Feed
           </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#37322F]/20" />
          <p className="text-[#605A57] text-sm">Syncing with history...</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line with gradient effect */}
          <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#37322F]/20 via-[#37322F]/10 to-transparent" />

          <div className="space-y-1">
            {activities.map((activity, index) => {
              const Icon = ICON_MAP[activity.type] || ICON_MAP.default
              const dotColor = COLOR_MAP[activity.type] || COLOR_MAP.default
              
              return (
                <div key={activity._id} className="group relative flex gap-6 pb-12 last:pb-0">
                  {/* Timeline Dot & Icon */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12",
                      dotColor
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Visual Pulse for latest item */}
                    {index === 0 && (
                      <div className={cn("absolute -inset-1 rounded-2xl animate-pulse opacity-20 -z-10", dotColor)} />
                    )}
                  </div>
                  
                  {/* Content Card */}
                  <div className="flex-1 pt-1">
                    <Card className="border-[rgba(55,50,47,0.08)] shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm overflow-hidden group-hover:bg-white">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-[#37322F]/5 flex items-center justify-center text-[10px] font-bold text-[#37322F]">
                                {activity.user?.username?.charAt(0) || "S"}
                             </div>
                             <h3 className="text-sm font-bold text-[#37322F]">
                                {activity.user?.username || "System"} 
                                <span className="font-normal text-[#605A57] ml-1">{activity.action}</span>
                             </h3>
                          </div>
                          <time className="text-[9px] font-bold text-[#605A57] uppercase tracking-widest bg-[#F7F5F3] px-2.5 py-1 rounded-full border border-[rgba(55,50,47,0.05)]">
                            {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                        
                        <div className="flex items-start gap-3">
                           <div className="p-2 rounded-lg bg-[#F7F5F3] text-[#37322F]">
                              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                           </div>
                           <p className="text-sm text-[#37322F] font-medium leading-relaxed">
                              {activity.detail}
                           </p>
                        </div>

                        {activity.type === 'incident' && (
                           <div className="mt-4 pt-4 border-t border-[rgba(55,50,47,0.05)] flex items-center gap-4">
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[10px]">High Priority</Badge>
                              <span className="text-[10px] text-[#605A57] font-bold uppercase tracking-tighter">Command Center Sync OK</span>
                           </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>

          {activities.length === 0 && (
            <div className="p-20 text-center bg-[#F7F5F3]/30 border border-dashed border-[rgba(55,50,47,0.12)] rounded-[40px]">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[rgba(55,50,47,0.05)]">
                  <Shield className="w-10 h-10 text-[#37322F]/10" />
               </div>
               <h3 className="text-[#37322F] font-serif text-2xl italic">The silence of stability</h3>
               <p className="text-[#605A57] text-sm mt-2 max-w-xs mx-auto">No major events recorded. Everything is operating within normal parameters.</p>
            </div>
          )}
        </div>
      )}

      {activities.length > 0 && (
        <div className="pt-8 flex justify-center">
           <Button variant="ghost" className="text-[#605A57] hover:text-[#37322F] text-xs font-bold uppercase tracking-widest gap-2">
              <Plus className="w-3 h-3" /> Load Historical Logs
           </Button>
        </div>
      )}
    </div>
  )
}
