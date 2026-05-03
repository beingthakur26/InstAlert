"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Search, Link as LinkIcon, CheckCircle2 } from "lucide-react"

import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export default function JoinOrgPage() {
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode) return
    
    setIsLoading(true)

    try {
      await apiClient.post("/user/join-organization", { joinCode: inviteCode })
      setIsJoined(true)
      await refreshUser()
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to join organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-[500px]">
        <Button 
          variant="ghost" 
          className="mb-8 text-[#605A57] hover:text-[#37322F]"
          onClick={() => router.back()}
          disabled={isJoined}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to choices
        </Button>

        <Card className="border-[rgba(55,50,47,0.12)] shadow-xl shadow-[rgba(55,50,47,0.04)] bg-white/80 backdrop-blur-sm overflow-hidden">
          {isJoined ? (
            <div className="p-12 text-center space-y-6 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-[#37322F]">Successfully Joined!</h3>
                  <p className="text-[#605A57]">You are now a member of Acme Global. Redirecting to your dashboard...</p>
               </div>
               <Loader2 className="w-6 h-6 text-[#37322F]/20 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-serif text-[#37322F]">Join Organization</CardTitle>
                <CardDescription className="text-[#605A57]">
                  Enter an invite code or link to connect with your team.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleJoin}>
                <CardContent className="space-y-6 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code or Link</Label>
                    <div className="relative">
                      <Input 
                        id="inviteCode" 
                        placeholder="BR-XXXX-XXXX" 
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="pl-10"
                        required 
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-[#605A57]" />
                    </div>
                  </div>

                  <div className="p-4 bg-[#F7F5F3]/50 rounded-lg border border-[rgba(55,50,47,0.12)] flex items-start gap-3">
                     <LinkIcon className="w-4 h-4 text-[#37322F] mt-1 shrink-0" />
                     <div className="space-y-1">
                        <p className="text-xs font-medium text-[#37322F]">Don't have a code?</p>
                        <p className="text-xs text-[#605A57]">Ask your organization administrator for an invite link or a 10-digit join code.</p>
                     </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full h-12 transition-all"
                    disabled={isLoading || !inviteCode}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Request Access"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
