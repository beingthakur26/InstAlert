"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Send, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function FloatingAI() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    try {
      setIsLoading(true)
      const res = await apiClient.post("/ai/chat", {
        message: userMessage,
        history: messages,
      })
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }])
    } catch (err: unknown) {
      toast.error("AI failed to respond")
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] group"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 blur-sm animate-pulse" />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
            <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl shadow-[#37322F]/20 border border-[rgba(55,50,47,0.12)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">InstaAlert AI</h3>
              <p className="text-[10px] text-indigo-100">Always online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#37322F]">How can I help?</h4>
                <p className="text-[11px] text-[#605A57]">Ask about incidents, SLAs, or best practices.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-2">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-start gap-2", msg.role === "user" && "justify-end")}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-[#F7F5F3] text-[#37322F] rounded-tr-none"
                        : "bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-tl-none",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl rounded-tl-none">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 bg-[#F7F5F3]/50 border-t border-[rgba(55,50,47,0.05)] shrink-0">
          <div className="relative">
            <Input
              placeholder="Ask anything..."
              className="bg-white border-[rgba(55,50,47,0.1)] pr-10 rounded-xl text-xs h-9"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-0.5 h-7 w-7 text-indigo-600"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
