"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Send, Loader2, Zap, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AIChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsage()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchUsage = async () => {
    try {
      const res = await apiClient.get("/ai/usage")
      setUsage(res.data)
    } catch {
      // silently fail
    }
  }

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

  const suggestions = [
    "What incidents are currently open?",
    "How do I set up SLA alerts?",
    "Best practices for incident response?",
    "Summarize my organization's incident history",
  ]

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-[#37322F]">InstaAlert AI</h1>
            <p className="text-xs text-[#605A57]">Your intelligent incident response assistant</p>
          </div>
        </div>
        {usage && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[#605A57]">Tokens used</p>
              <p className="text-sm font-bold text-[#37322F]">{usage.totalTokens?.toLocaleString() || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#605A57]">Cost</p>
              <p className="text-sm font-bold text-[#37322F]">${parseFloat(usage.totalCost || "0").toFixed(4)}</p>
            </div>
          </div>
        )}
      </header>

      <Card className="border-[rgba(55,50,47,0.08)] rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] px-6 py-6">
            {messages.length === 0 ? (
              <div className="py-16 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-serif text-[#37322F]">How can I help you today?</h2>
                  <p className="text-sm text-[#605A57] max-w-md mx-auto">
                    Ask me about incident management, SLA configuration, best practices, or analyze your incident history.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); }}
                      className="text-left p-3 rounded-xl border border-[rgba(55,50,47,0.08)] hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs text-[#605A57] hover:text-indigo-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 mb-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex items-start gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
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
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-[#F7F5F3]/50 border-t border-[rgba(55,50,47,0.05)]">
            <div className="relative">
              <Input
                placeholder="Ask anything about incident management..."
                className="bg-white border-[rgba(55,50,47,0.1)] pr-12 rounded-xl"
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
                className="absolute right-1 top-1 h-8 w-8 text-indigo-600"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[rgba(55,50,47,0.08)] rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs text-[#605A57]">AI Provider</p>
              <p className="text-sm font-bold text-[#37322F]">Mistral + OpenAI</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[rgba(55,50,47,0.08)] rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-xs text-[#605A57]">Rate Limit</p>
              <p className="text-sm font-bold text-[#37322F]">20 req/min</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[rgba(55,50,47,0.08)] rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-[#605A57]">Auto-retry</p>
              <p className="text-sm font-bold text-[#37322F]">2 retries w/ backoff</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
