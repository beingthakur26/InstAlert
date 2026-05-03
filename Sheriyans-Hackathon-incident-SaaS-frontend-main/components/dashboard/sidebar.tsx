"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  AlertCircle, 
  MessageSquare, 
  History,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Globe,
  ClipboardList,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth, AuthOrganization } from "@/context/AuthContext"

interface SidebarProps {
  orgData: AuthOrganization | null
}

export function Sidebar({ orgData }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userRole, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Team Members", href: "/dashboard/team", icon: Users },
    { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircle },
    { name: "Assignments", href: "/dashboard/assignments", icon: ClipboardList },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Activity Timeline", href: "/dashboard/activity", icon: History },
    { name: "Postmortems", href: "/dashboard/postmortems", icon: FileText },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Status Pages", href: "/dashboard/status-pages", icon: Globe },
    { 
      name: "Org Settings", 
      href: "/dashboard/settings", 
      icon: Settings,
      ownerOnly: true 
    },
  ]

  const filteredNavItems = navItems.filter(item => 
    !item.ownerOnly || userRole === "owner"
  )

  const handleLogout = async () => {
    await logout()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "border-r border-[rgba(55,50,47,0.12)] bg-white/70 backdrop-blur-xl flex flex-col h-screen sticky top-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-50",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="p-4 h-20 flex items-center border-b border-[rgba(55,50,47,0.08)]">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-[#37322F] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#37322F]/20 shrink-0">
                  {orgData?.organizationName?.charAt(0) || "O"}
                </div>
                <div className="font-serif text-lg text-[#37322F] truncate tracking-tight">{orgData?.organizationName || "InstaAlert"}</div>
              </div>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-lg hover:bg-[#37322F]/5 text-[#605A57] transition-colors ml-2"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button 
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-[#37322F] flex items-center justify-center text-white shadow-lg shadow-[#37322F]/20 transition-transform hover:scale-105 active:scale-95 animate-in zoom-in-75 duration-300"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none mt-4">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            const Content = (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-[#37322F] text-white shadow-lg shadow-[#37322F]/15" 
                    : "text-[#605A57] hover:bg-[#37322F]/5 hover:text-[#37322F]",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-transform duration-200",
                  isActive ? "text-white scale-110" : "text-[#605A57] group-hover:text-[#37322F] group-hover:scale-110",
                  !isCollapsed && "mr-3"
                )} />
                {!isCollapsed && (
                  <span className="truncate animate-in fade-in slide-in-from-left-3 duration-500">{item.name}</span>
                )}
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-1 h-4 rounded-full bg-white/40 animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {Content}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="bg-[#37322F] text-white border-none font-medium px-3 py-1.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-left-2">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return Content
          })}
        </nav>

        <div className="p-4 border-t border-[rgba(55,50,47,0.08)] space-y-2">
          {!isCollapsed && user && (
            <button 
              onClick={() => router.push("/dashboard/profile")}
              className="w-full flex items-center p-2 rounded-xl hover:bg-[#37322F]/5 transition-all text-left group mb-2"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold text-[#37322F] truncate">{user.username}</p>
                <p className="text-[10px] text-[#605A57] truncate capitalize">{user.role === 'owner' ? 'Owner' : 'Employee'}</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-[#605A57] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-[#605A57] hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl h-10",
              isCollapsed && "justify-center p-0"
            )} 
            onClick={handleLogout}
          >
            <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Log out</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
