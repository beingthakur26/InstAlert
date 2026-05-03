"use client"

import { useState, useEffect } from "react"
import {
  Users,
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  UserCheck,
  Search,
  Loader2,
  Copy,
  Check,
  Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import apiClient from "@/lib/api-client"
import socket from "@/lib/socket"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export default function TeamPage() {
  const { organization, user, userRole } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [pendingRemoveName, setPendingRemoveName] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const isOwner = userRole === "owner" || organization?.owner?._id?.toString() === user?.id?.toString()

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener("click", closeMenu)
      return () => document.removeEventListener("click", closeMenu)
    }
  }, [openMenuId])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const res = await apiClient.get("/organization/get-employees")
      setMembers(res.data.members || [])
    } catch (err) {
      toast.error("Failed to load team members")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
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

  const handleRemoveMember = async (memberId: string) => {
    try {
      await apiClient.delete(`/organization/remove-employee/${memberId}`)
      toast.success("Member removed successfully")
      fetchMembers()
    } catch (err) {
      toast.error("Failed to remove member")
    } finally {
      setRemovingId(null)
    }
  }

  const confirmRemoveMember = (memberId: string, memberName: string) => {
    setRemovingId(memberId)
    setPendingRemoveName(memberName)
    setRemoveDialogOpen(true)
  }

  const handleCopyCode = () => {
    if (!organization?.organizationJoinCode) return
    navigator.clipboard.writeText(organization.organizationJoinCode)
    setCopied(true)
    toast.success("Join code copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || m.role === roleFilter
    
    const isOnline = onlineUsers.includes(m._id)
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "online" && isOnline) || 
                         (statusFilter === "offline" && !isOnline)

    return matchesSearch && matchesRole && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#37322F]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">Team Members</h1>
          <p className="text-[#605A57] mt-1">Manage your team, roles, and permissions.</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-3 bg-[#F7F5F3] p-1.5 pl-4 rounded-full border border-[rgba(55,50,47,0.1)]">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#605A57] uppercase tracking-widest">Join Code</span>
              <span className="text-sm font-mono font-bold text-[#37322F]">{organization?.organizationJoinCode}</span>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full hover:bg-white text-[#37322F]"
              onClick={handleCopyCode}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </header>

      <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
        <CardHeader className="border-b border-[rgba(55,50,47,0.05)] bg-[#F7F5F3]/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 bg-white border-[rgba(55,50,47,0.12)] focus:ring-[#37322F]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#37322F]/5 text-[#37322F] px-3 py-1">
                {filteredMembers.length} Found
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F5F3]/50">
              <TableRow className="hover:bg-transparent border-b border-[rgba(55,50,47,0.08)]">
                <TableHead className="text-[#37322F] font-semibold py-4 pl-6">Member</TableHead>
                <TableHead className="text-[#37322F] font-semibold py-4">Role</TableHead>
                <TableHead className="text-[#37322F] font-semibold py-4">Status</TableHead>
                <TableHead className="text-[#37322F] font-semibold py-4">Activity</TableHead>
                <TableHead className="text-[#37322F] font-semibold py-4 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const isOnline = onlineUsers.includes(member._id)
                const isSelf = member._id?.toString() === user?.id?.toString()

                return (
                  <TableRow key={member._id} className="hover:bg-[#F7F5F3]/20 border-b border-[rgba(55,50,47,0.05)] transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[#37322F]/5 border border-[rgba(55,50,47,0.1)] flex items-center justify-center text-[#37322F] font-bold">
                            {member.username.charAt(0)}
                          </div>
                          <Circle className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-current border-[1.5px] border-white",
                            isOnline ? "text-green-500" : "text-gray-300"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-[#37322F]">
                            {member.username} 
                            {member._id?.toString() === user?.id?.toString() && <span className="ml-2 text-[10px] bg-[#F7F5F3] px-2 py-0.5 rounded-full text-[#605A57]">You</span>}
                          </p>
                          <p className="text-xs text-[#605A57] flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" /> {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Shield className={cn("w-4 h-4", member.role === "organization" ? "text-amber-600" : "text-blue-600")} />
                        <span className="text-sm text-[#37322F] capitalize">{member.role === 'organization' ? 'Owner' : 'Member'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {isOnline ? (
                         <span className="text-xs font-medium text-green-600 flex items-center">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" /> Online
                         </span>
                      ) : (
                         <span className="text-xs font-medium text-[#605A57]">Offline</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      {isOwner && member._id?.toString() !== user?.id?.toString() ? (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === member._id ? null : member._id)
                            }}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[#F7F5F3] text-[#605A57] hover:text-[#37322F] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === member._id && (
                            <div className="absolute right-0 top-10 z-50 bg-white border border-[rgba(55,50,47,0.12)] rounded-lg shadow-lg w-48 p-1" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[10px] font-bold text-[#605A57] uppercase tracking-wider px-3 py-1.5">Actions</div>
                              <div className="border-t border-[rgba(55,50,47,0.05)] my-1" />
                              <button
                                onClick={() => confirmRemoveMember(member._id, member.username)}
                                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                         <span className="text-xs text-[#605A57] italic px-2">
                            {member._id?.toString() === user?.id?.toString() ? "" : "View Only"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredMembers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-[#605A57]/20 mx-auto mb-4" />
              <h3 className="text-[#37322F] font-medium">No members found</h3>
              <p className="text-[#605A57] text-sm">Try adjusting your search terms.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{pendingRemoveName}</strong> from the organization? 
              They will lose access to all incidents, chats, and organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => removingId && handleRemoveMember(removingId)} 
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={removingId === null}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
