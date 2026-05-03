"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, X, UserPlus, Loader2, Info } from "lucide-react"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export default function CreateOrgPage() {
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<{name: string, email: string}[]>([])
  const [memberName, setMemberName] = useState("")
  const [memberEmail, setMemberEmail] = useState("")
  const router = useRouter()

  const handleAddMember = () => {
    // 1 owner + 2 members = 3 total
    if (members.length >= 2) {
      return
    }
    if (memberName && memberEmail) {
      setMembers([...members, { name: memberName, email: memberEmail }])
      setMemberName("")
      setMemberEmail("")
    }
  }

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const orgName = formData.get("orgName") as string
    const description = formData.get("orgDescription") as string

    try {
      await apiClient.post("/organization/create", { 
        organizationName: orgName,
        description: description
      })
      await refreshUser()
      toast.success("Organization created successfully!")
      router.push("/dashboard")
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-[600px]">
        <Button 
          variant="ghost" 
          className="mb-8 text-[#605A57] hover:text-[#37322F]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to choices
        </Button>

        <Card className="border-[rgba(55,50,47,0.12)] shadow-xl shadow-[rgba(55,50,47,0.04)] bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-serif text-[#37322F]">Create Organization</CardTitle>
            <CardDescription className="text-[#605A57]">
              Set up your workspace and invite your core team.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent className="space-y-8 pb-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#37322F] uppercase tracking-wider">Basic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" name="orgName" placeholder="Acme Inc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgDescription">Description</Label>
                  <Textarea id="orgDescription" name="orgDescription" placeholder="Briefly describe what your organization does." className="min-h-[100px]" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[rgba(55,50,47,0.12)]">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-[#37322F] uppercase tracking-wider">Initial Team</h3>
                  <Badge className="bg-[#37322F] text-white">Free Plan: {members.length + 1}/3 Members</Badge>
                </div>
                
                <Alert className="bg-[#37322F]/5 border-[rgba(55,50,47,0.12)]">
                  <Info className="h-4 w-4 text-[#37322F]" />
                  <AlertTitle className="text-[#37322F] font-medium">Free Plan Limit</AlertTitle>
                  <AlertDescription className="text-[#605A57] text-xs">
                    Your current plan allows for 1 Owner (you) and up to 2 Team Members. Upgrade later to add more.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-[rgba(55,50,47,0.12)] rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#37322F]">{member.name}</span>
                        <span className="text-xs text-[#605A57]">{member.email}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#605A57] hover:text-red-500"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {members.length < 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-[#F7F5F3]/50 rounded-xl border border-dashed border-[rgba(55,50,47,0.2)]">
                      <div className="space-y-2">
                        <Input 
                          placeholder="Member Name" 
                          value={memberName} 
                          onChange={(e) => setMemberName(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <Input 
                          placeholder="Member Email" 
                          type="email"
                          value={memberEmail} 
                          onChange={(e) => setMemberEmail(e.target.value)}
                          className="bg-white pr-10"
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          className="absolute right-1 top-1 h-8 w-8 bg-[#37322F] text-white"
                          onClick={handleAddMember}
                          disabled={!memberName || !memberEmail}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
              <Button 
                type="submit" 
                className="w-full bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full h-12 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Create Organization"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${className}`}>
      {children}
    </span>
  )
}
