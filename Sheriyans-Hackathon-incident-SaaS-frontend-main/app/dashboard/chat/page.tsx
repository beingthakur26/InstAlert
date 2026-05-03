"use client"

import { useState, useEffect, useRef } from "react"
import {
  Send,
  Paperclip,
  Smile,
  Hash,
  Lock,
  MoreVertical,
  Search,
  Plus,
  Phone,
  Video,
  Info,
  Circle,
  Loader2,
  MessageSquare,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import apiClient from "@/lib/api-client"
import socket from "@/lib/socket"
import { toast } from "sonner"
import { Member } from "@/types"

export default function ChatPage() {
  const { user, organization, userRole } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  
  const [chatMode, setChatMode] = useState<"incident" | "dm" | "channel">("channel")
  const [activeIncident, setActiveIncident] = useState<any>(null)
  const [activeDmUser, setActiveDmUser] = useState<any>(null)
  const [activeChannel, setActiveChannel] = useState<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const isOwner = userRole === "owner"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("[Chat] Fetching initial data...");

        // Fetch basic info in parallel
        const [incRes, memRes] = await Promise.all([
          apiClient.get("/incidents").catch(err => ({ data: { incidents: [] } })),
          apiClient.get("/organization/get-employees").catch(err => ({ data: { members: [] } })),
        ]);
        
        const fetchedIncidents = incRes.data.incidents || [];
        const fetchedMembers = memRes.data.members || [];
        
        setIncidents(fetchedIncidents);
        
        // Handle member list + owner
        let allMembers = [...fetchedMembers];
        if (organization?.owner) {
           const ownerId = typeof organization.owner === 'string' ? organization.owner : organization.owner._id;
            const ownerExists = allMembers.some((m: Member) => m._id === ownerId);
           if (!ownerExists && ownerId !== user?.id) {
              allMembers.unshift({
                 ...organization.owner,
                 role: "organization"
              });
           }
        }
         setMembers(allMembers.filter((m: Member) => m._id !== user?.id));

        // Fetch channels with robust fallback
        console.log("[Chat] Fetching channels...");
        const chanRes = await apiClient.get(`/channels`).catch(err => ({ data: { channels: [] } }));
        const fetchedChannels = chanRes.data.channels || [];
        setChannels(fetchedChannels);

        // Determine which chat to open by default
        if (fetchedChannels.length > 0) {
          setActiveChannel(fetchedChannels[0]);
          setChatMode("channel");
        } else if (fetchedIncidents.length > 0) {
          setActiveIncident(fetchedIncidents[0]);
          setChatMode("incident");
        } else if (allMembers.length > 0) {
          const firstDm = allMembers.find(m => m._id !== user?.id);
          if (firstDm) {
            setActiveDmUser(firstDm);
            setChatMode("dm");
          }
        }
      } catch (err) {
        console.error("[Chat] Fatal data load error:", err);
        toast.error("Failed to sync chat rooms");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user, organization?._id]); // Run when user is ready or organization changes

  useEffect(() => {
    if (!user) return
    socket.connect()
    socket.emit("register-user", { userId: user.id })
    if (organization?.organizationJoinCode) {
      socket.emit("join-org", { joinCode: organization.organizationJoinCode })
    }

    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users)
    socket.on("online-users", handleOnlineUsers)

    return () => {
      socket.off("online-users", handleOnlineUsers)
    }
  }, [user, organization])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (chatMode === "incident" && activeIncident) {
          const res = await apiClient.get(`/incidents/${activeIncident._id}/messages`)
          setMessages(res.data.messages || [])
        } else if (chatMode === "dm" && activeDmUser) {
          const res = await apiClient.get(`/dm/${activeDmUser._id}`)
          setMessages(res.data.messages || [])
        } else if (chatMode === "channel" && activeChannel) {
          const res = await apiClient.get(`/channels/${activeChannel._id}/messages`)
          setMessages(res.data.messages || [])
        }
      } catch (err) {
        toast.error("Failed to load message history")
      }
    }
    fetchMessages()
  }, [chatMode, activeIncident, activeDmUser, activeChannel])

  useEffect(() => {
    const handleReceiveMessage = (data: string) => {
      let parsed
      try { parsed = JSON.parse(data) } catch { return }
      if (chatMode === "incident" && activeIncident && parsed.incidentId === activeIncident._id) {
        setMessages(prev => {
          if (prev.some(m => m.tempId && m.tempId === parsed.tempId)) return prev;
          return [...prev, parsed];
        })
      } else if (chatMode === "channel" && activeChannel && parsed.channelId === activeChannel._id) {
        setMessages(prev => {
          if (prev.some(m => m.tempId && m.tempId === parsed.tempId)) return prev;
          return [...prev, parsed];
        })
      }
    }

    const handleReceiveDm = (data: string) => {
      let parsed
      try { parsed = JSON.parse(data) } catch { return }
      if (chatMode === "dm" && activeDmUser) {
        if (parsed.senderId === activeDmUser._id || parsed.receiverId === activeDmUser._id) {
           setMessages(prev => {
             if (prev.some(m => m.tempId && m.tempId === parsed.tempId)) return prev;
             return [...prev, parsed];
           })
        }
      }
    }

    socket.on("receive-message", handleReceiveMessage)
    socket.on("receive-dm", handleReceiveDm)

    return () => {
      socket.off("receive-message", handleReceiveMessage)
      socket.off("receive-dm", handleReceiveDm)
    }
  }, [chatMode, activeIncident, activeDmUser, activeChannel])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !organization) return

    const tempId = Date.now().toString()

    if (chatMode === "incident" && activeIncident) {
      const payload = {
        message: newMessage,
        userId: user.id,
        senderName: user.username,
        incidentId: activeIncident._id,
        joinCode: organization.organizationJoinCode,
        tempId
      }
      socket.emit("send-message", payload)
    } else if (chatMode === "channel" && activeChannel) {
      const payload = {
        message: newMessage,
        userId: user.id,
        senderName: user.username,
        channelId: activeChannel._id,
        joinCode: organization.organizationJoinCode,
        tempId
      }
      socket.emit("send-message", payload)
    } else if (chatMode === "dm" && activeDmUser) {
      const payload = {
        message: newMessage,
        senderId: user.id,
        senderName: user.username,
        receiverId: activeDmUser._id,
        joinCode: organization.organizationJoinCode,
        tempId
      }
      socket.emit("send-dm", payload)
    }
    
    setNewMessage("")
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return
    try {
      const res = await apiClient.post("/channels", {
        name: newChannelName.trim(),
        organizationId: organization?._id
      })
      setChannels(prev => [...prev, res.data.channel])
      setIsCreateChannelOpen(false)
      setNewChannelName("")
      toast.success("Channel created")
      setActiveChannel(res.data.channel)
      setChatMode("channel")
    } catch (err) {
      toast.error("Failed to create channel")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#37322F]" />
      </div>
    )
  }

  const currentChatTitle = chatMode === "incident" ? activeIncident?.title : 
                           chatMode === "channel" ? activeChannel?.name :
                           activeDmUser?.username
  
  const currentChatStatus = chatMode === "incident" ? activeIncident?.status : 
                            chatMode === "channel" ? "Team Chat" :
                            (onlineUsers.includes(activeDmUser?._id) ? "Online" : "Offline")

  return (
    <div className="h-[calc(100vh-2rem)] flex m-4 border border-[rgba(55,50,47,0.12)] rounded-3xl bg-white shadow-xl shadow-[rgba(55,50,47,0.05)]">
      {/* Channels Sidebar */}
      <aside className="w-64 border-r border-[rgba(55,50,47,0.08)] bg-[#F7F5F3]/50 flex flex-col">
        <div className="p-6 border-b border-[rgba(55,50,47,0.08)] bg-white/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-[#37322F]">Communications</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#605A57]" />
            <Input placeholder="Search chats..." className="pl-8 h-9 text-sm bg-white/80 border-[rgba(55,50,47,0.1)] rounded-xl" />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            
            {/* Channels Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 mb-2">
                 <p className="text-[10px] font-bold text-[#605A57] uppercase tracking-wider">General Channels</p>
                 {isOwner && (
                   <Button variant="ghost" size="icon" className="h-4 w-4 text-[#605A57] hover:text-[#37322F]" onClick={() => setIsCreateChannelOpen(true)}>
                     <Plus className="w-3 h-3" />
                   </Button>
                 )}
              </div>
              {isLoading ? (
                <div className="px-2 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#605A57]" />
                  <span className="text-xs text-[#605A57]">Syncing...</span>
                </div>
              ) : (
                <>
                  {channels.map(chan => (
                    <button
                      key={chan._id}
                      onClick={() => {
                        setActiveChannel(chan)
                        setChatMode("channel")
                      }}
                      className={cn(
                        "w-full flex items-center px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
                        chatMode === "channel" && activeChannel?._id === chan._id ? "bg-[#37322F] text-white" : "text-[#605A57] hover:bg-[#37322F]/5"
                      )}
                    >
                      <Hash className={cn("w-3.5 h-3.5 mr-2 shrink-0", chatMode === "channel" && activeChannel?._id === chan._id ? "text-white/70" : "text-[#605A57]")} />
                      <span className="truncate">{chan.name}</span>
                    </button>
                  ))}
                  {channels.length === 0 && <p className="px-2 text-xs text-[#605A57] italic">No channels found</p>}
                </>
              )}
            </div>

            {/* Incidents Section */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-bold text-[#605A57] uppercase tracking-wider mb-2">Active Incidents</p>
              {isLoading ? (
                <div className="px-2 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#605A57]" />
                </div>
              ) : (
                <>
                  {incidents.map(inc => (
                    <button
                      key={inc._id}
                      onClick={() => {
                        setActiveIncident(inc)
                        setChatMode("incident")
                      }}
                      className={cn(
                        "w-full flex items-center px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
                        chatMode === "incident" && activeIncident?._id === inc._id ? "bg-[#37322F] text-white" : "text-[#605A57] hover:bg-[#37322F]/5"
                      )}
                    >
                      <AlertCircle className={cn("w-3.5 h-3.5 mr-2 shrink-0", chatMode === "incident" && activeIncident?._id === inc._id ? "text-white/70" : "text-[#605A57]")} />
                      <span className="truncate">{inc.title}</span>
                    </button>
                  ))}
                  {incidents.length === 0 && <p className="px-2 text-xs text-[#605A57] italic">No active incidents</p>}
                </>
              )}
            </div>

            {/* Members Section */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-bold text-[#605A57] uppercase tracking-wider mb-2">Direct Messages</p>
              {isLoading ? (
                 <div className="px-2 py-2">
                   <Loader2 className="w-3 h-3 animate-spin text-[#605A57]" />
                 </div>
              ) : (
                <>
                  {members.map(member => {
                    const isOnline = onlineUsers.includes(member._id)
                    return (
                      <button
                        key={member._id}
                        onClick={() => {
                          setActiveDmUser(member)
                          setChatMode("dm")
                        }}
                        className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors",
                          chatMode === "dm" && activeDmUser?._id === member._id ? "bg-[#37322F] text-white" : "text-[#605A57] hover:bg-[#37322F]/5"
                        )}
                      >
                        <div className="flex items-center">
                          <div className="relative mr-2">
                            <Avatar className="h-6 w-6 border border-white">
                              <AvatarFallback className={cn("text-[10px]", chatMode === "dm" && activeDmUser?._id === member._id ? "bg-white/20 text-white" : "bg-[#37322F]/5 text-[#37322F]")}>
                                {member.username.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <Circle className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 fill-current border border-white", isOnline ? "text-green-500" : "text-gray-300")} />
                          </div>
                          <span className="truncate">{member.username}</span>
                        </div>
                      </button>
                    )
                  })}
                  {members.length === 0 && <p className="px-2 text-xs text-[#605A57] italic">No team members</p>}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <header className="p-4 border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
          {currentChatTitle ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F7F5F3] flex items-center justify-center text-[#37322F]">
                  {chatMode === "incident" ? <AlertCircle className="w-5 h-5" /> : 
                   chatMode === "channel" ? <Hash className="w-5 h-5" /> : 
                   <MessageSquare className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#37322F] flex items-center gap-2">
                    {chatMode === "channel" ? `#${currentChatTitle}` : currentChatTitle}
                    <Badge variant="outline" className="h-5 text-[10px] border-[rgba(55,50,47,0.1)] text-[#605A57]">
                      {chatMode === "incident" ? "Incident Room" : 
                       chatMode === "channel" ? "Team Channel" : 
                       "Direct Message"}
                    </Badge>
                  </h3>
                  <p className="text-xs text-[#605A57]">
                    {chatMode === "dm" ? (
                      <span className="flex items-center gap-1">
                        <Circle className={cn("w-2 h-2 fill-current", currentChatStatus === "Online" ? "text-green-500" : "text-gray-300")} /> {currentChatStatus}
                      </span>
                    ) : (
                      currentChatStatus || "Status N/A"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-[#605A57]"><Info className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-[#605A57]"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex items-center h-10 w-full justify-center">
               <span className="text-sm font-medium text-[#605A57]">Select a chat to start messaging</span>
            </div>
          )}
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6 overflow-hidden ">
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const isSelf = msg.senderId === user?.id || msg.sender?._id === user?.id
              const senderName = typeof msg.sender === 'object' ? msg.sender.username : msg.sender
              
              if (msg.isAi) {
                return (
                  <div key={msg._id || i} className="flex gap-3 flex-row">
                    <Avatar className="h-9 w-9 shrink-0 border border-indigo-200 mt-1 shadow-sm">
                      <AvatarFallback className="bg-indigo-50 text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 max-w-[85%] items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700">{senderName}</span>
                        <span className="text-[10px] text-[#605A57]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl text-sm shadow-sm bg-indigo-50 text-indigo-950 rounded-tl-none border border-indigo-100/50 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg._id || i} className={cn("flex gap-3", isSelf ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-9 w-9 shrink-0 border border-[rgba(55,50,47,0.1)] mt-1">
                    <AvatarFallback className="bg-[#F7F5F3] text-[#37322F] text-xs font-bold">
                      {senderName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("space-y-1 max-w-[70%]", isSelf ? "items-end text-right" : "items-start")}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#37322F]">{senderName}</span>
                      <span className="text-[10px] text-[#605A57]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap",
                      isSelf
                        ? "bg-[#37322F] text-white rounded-tr-none"
                        : "bg-[#F7F5F3] text-[#37322F] rounded-tl-none border border-[rgba(55,50,47,0.05)]"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea> 

        {/* Input Area */}
        <footer className="p-4 border-t border-[rgba(55,50,47,0.08)]">
          <form onSubmit={handleSendMessage} className="relative bg-[#F7F5F3] rounded-2xl p-2 flex items-end gap-2 border border-[rgba(55,50,47,0.1)] focus-within:border-[#37322F]/30 transition-colors">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-[#605A57] hover:bg-white rounded-xl shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={
                chatMode === "incident" ? `Message in ${activeIncident?.title} (Mention @InstaAlert or #InstaAlert)` :
                chatMode === "channel" ? `Message in #${activeChannel?.name} (Mention @InstaAlert or #InstaAlert)` :
                `Message ${activeDmUser?.username}`
              }
              disabled={!currentChatTitle}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none min-h-[44px] py-3 text-sm placeholder:text-[#605A57]/50"
              rows={1}
            />
            <div className="flex items-center gap-1 mb-1 mr-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#605A57] hover:bg-white rounded-lg">
                <Smile className="w-4 h-4" />
              </Button>
              <Button type="submit" size="icon" className="h-8 w-8 bg-[#37322F] text-white rounded-lg shadow-lg shadow-[#37322F]/20 disabled:opacity-50" disabled={!newMessage.trim() || !currentChatTitle}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <p className="text-[10px] text-center text-[#605A57] mt-2">Press Enter to send, Shift + Enter for new line. Mention <span className="font-bold">@InstaAlert</span> or <span className="font-bold">#InstaAlert</span> to use AI.</p>
        </footer>
      </main>

      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-[#37322F]">Create General Channel</DialogTitle>
            <DialogDescription>Create a new chat room for your organization.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#37322F] uppercase tracking-widest">Channel Name</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
                <Input 
                  placeholder="e.g. engineering" 
                  className="pl-10 bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F]"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateChannel} className="bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full">
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
