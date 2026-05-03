"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  PlusCircle, 
  Users, 
  LogOut, 
  LayoutDashboard, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  ArrowUpRight,
  Activity,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  BarChart3,
  PieChart as PieIcon,
  Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrgChoiceCard } from "@/components/org-choice-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import socket from "@/lib/socket"
import { Activity as ActivityType } from "@/types/incident"

interface DashboardStats {
  memberCount?: number;
  activeIncidents?: number;
  totalIncidents?: number;
  resolvedIncidents?: number;
  myAssignments?: number;
}

interface ActivityItemData {
  _id: string;
  user?: { username: string };
  action: string;
  createdAt: string;
}

type StatColor = "blue" | "red" | "green" | "orange";

export default function DashboardPage() {
  const { user, organization, userRole, logout, loading: authLoading } = useAuth()
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<ActivityItemData[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (organization) {
      const fetchData = async () => {
        try {
          setIsLoadingStats(true)
          const res = await apiClient.get("/organization/stats")
          setStats(res.data.stats)
          setRecentActivities(res.data.recentActivities)
        } catch (err) {
          console.error("Failed to load dashboard data")
        } finally {
          setIsLoadingStats(false)
        }
      }
      fetchData()
    }
  }, [organization])

  useEffect(() => {
    if (!user) return
    socket.connect()
    socket.emit("register-user", { userId: user.id })

    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users)
    socket.on("online-users", handleOnlineUsers)

    return () => {
      socket.off("online-users", handleOnlineUsers)
    }
  }, [user])

  if (authLoading) return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
    </div>
  )

  if (!user) return null

  const hasOrg = !!organization
  const orgData = organization

  const handleLogout = async () => {
    await logout()
  }

  const handleCopyCode = () => {
    if (!organization?.organizationJoinCode) return
    navigator.clipboard.writeText(organization.organizationJoinCode)
    setCopied(true)
    toast.success("Join code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate real-time presence counts
  const totalCount = stats?.memberCount || 1
  const onlineCount = onlineUsers.length
  const offlineCount = Math.max(0, totalCount - onlineCount)

  const presenceData = [
    { name: "Online", value: onlineCount, color: "#10B981" },
    { name: "Offline", value: offlineCount, color: "#9CA3AF" },
  ]

  const incidentData = [
    { name: "Active", value: stats?.activeIncidents || 0, color: "#EF4444" },
    { name: "Resolved", value: stats?.resolvedIncidents || 0, color: "#3B82F6" },
  ]

  if (!hasOrg) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-[calc(50%-530px)] top-0 bg-[rgba(55,50,47,0.12)]"></div>
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-[calc(50%-530px)] top-0 bg-[rgba(55,50,47,0.12)]"></div>
        </div>

        <div className="max-w-[800px] w-full space-y-12 z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif text-[#37322F] tracking-tight">
              Welcome, {user.username}
            </h1>
            <p className="text-lg text-[#605A57] max-w-[500px] mx-auto">
              To get started with InstaAlert, you can either create a new organization or join an existing one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <OrgChoiceCard 
              title="Create Your Own Organization"
              description="Start fresh. You'll be the Admin and have full control over settings, members, and billing."
              icon={PlusCircle}
              onClick={() => router.push("/dashboard/create-org")}
              delay="100ms"
            />
            <OrgChoiceCard 
              title="Join an Organization"
              description="Connect with your team. You'll need an invite link, code, or to request approval from an owner."
              icon={Users}
              onClick={() => router.push("/dashboard/join-org")}
              delay="200ms"
            />
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              variant="ghost" 
              className="text-[#605A57] hover:text-[#37322F]"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If has organization, show the Overview
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#37322F] tracking-tight">{orgData?.organizationName}</h2>
          <p className="text-[#605A57] text-sm mt-1">Organization overview and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "owner" && (
            <div className="hidden md:flex items-center gap-2 bg-[#F7F5F3] px-4 py-1.5 rounded-full border border-[rgba(55,50,47,0.1)]">
              <span className="text-[10px] font-bold text-[#605A57] uppercase tracking-widest">Join Code:</span>
              <span className="text-sm font-mono font-bold text-[#37322F]">{orgData?.organizationJoinCode}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={handleCopyCode}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          )}
          <Badge variant="outline" className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F] px-4 py-1 rounded-full font-medium text-xs">
            {user.role === "owner" ? "Owner Plan" : "Member Access"}
          </Badge>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Members" 
          value={isLoadingStats ? "..." : stats?.memberCount || 1} 
          icon={Users} 
          trend="Live team size"
          color="blue"
        />
        <StatsCard 
          title="Incidents" 
          value={isLoadingStats ? "..." : stats?.activeIncidents || 0} 
          icon={AlertCircle} 
          trend={`${stats?.totalIncidents || 0} total reported`}
          color="red"
        />
        <StatsCard 
          title="Resolved" 
          value={isLoadingStats ? "..." : stats?.resolvedIncidents || 0} 
          icon={CheckCircle2} 
          trend="Closed cases"
          color="green"
        />
        <StatsCard 
          title="Assignments" 
          value={isLoadingStats ? "..." : stats?.myAssignments || 0} 
          icon={Clock} 
          trend="Assigned to you"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Activity Hub */}
        <Card className="lg:col-span-2 border-[rgba(55,50,47,0.08)] shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[rgba(55,50,47,0.05)] bg-[#F7F5F3]/30 px-6 py-5">
            <div className="flex items-center gap-2">
               <div className="p-2 rounded-lg bg-[#37322F] text-white">
                  <PieIcon className="w-4 h-4" />
               </div>
               <CardTitle className="text-lg font-serif text-[#37322F]">Organization Pulse</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-[#605A57] text-xs hover:text-[#37322F]" onClick={() => router.push("/dashboard/activity")}>
              Activity Feed <ChevronRight className="ml-1 w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Presence Donut */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-xs font-bold text-[#605A57] uppercase tracking-widest">Real-time Presence</h4>
                   <span className="text-[10px] text-[#10B981] font-bold animate-pulse flex items-center">
                     <Circle className="w-2 h-2 fill-current mr-1" /> LIVE
                   </span>
                </div>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={presenceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {presenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-serif text-[#37322F]">{onlineCount}</span>
                    <span className="text-[10px] font-bold text-[#605A57] uppercase">Online</span>
                  </div>
                </div>
                <div className="text-center">
                   <p className="text-[11px] text-[#605A57] font-medium italic">
                     "Includes Owner + {totalCount - 1} Employees"
                   </p>
                </div>
              </div>

              {/* Incident Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#605A57] uppercase tracking-widest">Incident Health</h4>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incidentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-serif text-[#37322F]">{stats?.activeIncidents || 0}</span>
                    <span className="text-[10px] font-bold text-[#605A57] uppercase">Active</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                   {incidentData.map((item) => (
                     <div key={item.name} className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[10px] font-bold text-[#37322F] uppercase">{item.name}: {item.value}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Sidebar */}
        <Card className="border-[rgba(55,50,47,0.08)] shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-[rgba(55,50,47,0.05)]">
            <CardTitle className="text-lg font-serif text-[#37322F]">Live Stream</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[rgba(55,50,47,0.08)]">
              {isLoadingStats ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#37322F]/20" />
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <ActivityItem 
                    key={act._id}
                    user={act.user?.username || "System"} 
                    action={act.action} 
                    time={new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                  />
                ))
              ) : (
                <p className="text-xs text-[#605A57] text-center py-10 italic">No recent activity</p>
              )}
            </div>

            <Button 
              variant="link" 
              className="w-full mt-8 text-[#37322F] hover:text-[#37322F]/80 text-xs font-bold uppercase tracking-widest group"
              onClick={() => router.push("/dashboard/activity")}
            >
              Audit Log <ChevronRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, trend, color }: { title: string; value: number | string; icon: React.ElementType; trend: string; color: StatColor }) {
  const colors: Record<StatColor, string> = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  }

  return (
    <Card className="border-[rgba(55,50,47,0.08)] shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className={cn("p-2.5 rounded-xl transition-colors duration-300", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-[#605A57] uppercase tracking-widest">{title}</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-serif text-[#37322F]">{value}</div>
          <p className="text-[10px] font-bold text-[#605A57] uppercase tracking-tight opacity-70">
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ user, action, time }: { user: string; action: string; time: string }) {
  return (
    <div className="flex items-start gap-4 relative z-10">
      <div className="w-[30px] h-[30px] rounded-full bg-white border border-[rgba(55,50,47,0.12)] flex items-center justify-center text-[#37322F] text-[10px] font-bold shrink-0 shadow-sm">
        {user.charAt(0)}
      </div>
      <div className="space-y-0.5 pt-1">
        <p className="text-xs text-[#37322F] leading-tight">
          <span className="font-bold">{user}</span> {action}
        </p>
        <p className="text-[10px] text-[#605A57] opacity-60 font-medium">{time}</p>
      </div>
    </div>
  )
}
