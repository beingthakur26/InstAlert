"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  Camera, 
  Check,
  Loader2,
  Key,
  Calendar,
  ArrowLeft,
  Github,
  ExternalLink,
  Tag,
  X,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)
  const [githubRepos, setGithubRepos] = useState<any[]>([])
  const [githubCommits, setGithubCommits] = useState<any[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  
  const [formData, setFormData] = useState({
    username: "",
    email: ""
  })

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, email: user.email })
      setSkills(user.skills || [])
    }
  }, [user])

  useEffect(() => {
    fetchGithubData()
  }, [])

  const fetchGithubData = async () => {
    try {
      const [reposRes, commitsRes] = await Promise.all([
        apiClient.get("/auth/repos").catch(() => ({ data: { repos: [] } })),
        apiClient.get("/auth/commits").catch(() => ({ data: { commits: [] } })),
      ])
      setGithubRepos(reposRes.data.repos || [])
      setGithubCommits(commitsRes.data.commits || [])
    } catch {
      // GitHub not connected
    }
  }

  const handleConnectGithub = () => {
    setIsConnectingGithub(true)
    window.location.href = `${apiClient.defaults.baseURL}/auth/github`
  }

  const handleAddSkill = () => {
    if (!newSkill.trim() || skills.includes(newSkill.trim().toLowerCase())) {
      setNewSkill("")
      return
    }
    setSkills(prev => [...prev, newSkill.trim().toLowerCase()])
    setNewSkill("")
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await apiClient.put("/user/update-profile", { ...formData, skills })
      await refreshUser()
      setSaveSuccess(true)
      toast.success("Profile updated successfully")
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-[#37322F]" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-4">
        <Button variant="ghost" size="sm" className="text-[#605A57] hover:text-[#37322F] -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">Personal Profile</h1>
        <p className="text-[#605A57] mt-1">Manage your identity and account settings across the organization.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar and Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white overflow-hidden text-center p-8">
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-24 h-24 rounded-3xl bg-[#F7F5F3] flex items-center justify-center border-2 border-dashed border-[rgba(55,50,47,0.2)]">
                <User className="w-10 h-10 text-[#37322F]/20" />
              </div>
              <Button size="icon" className="absolute -bottom-2 -right-2 rounded-full bg-[#37322F] text-white shadow-lg w-8 h-8">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="text-xl font-bold text-[#37322F]">{user.username}</h2>
            <p className="text-xs text-[#605A57] uppercase tracking-widest font-bold mt-1">{user.role === 'owner' ? 'Organization Owner' : 'Team Member'}</p>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white p-6 space-y-4">
             <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-[#605A57]" />
                <span className="text-[#37322F] font-medium">Role: {user.role === 'owner' ? 'Owner' : 'Employee'}</span>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-[#605A57]" />
                <span className="text-[#37322F] font-medium">Member since 2024</span>
             </div>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="border-b border-[rgba(55,50,47,0.05)] p-6">
              <CardTitle className="text-xl font-serif text-[#37322F]">Account Details</CardTitle>
              <CardDescription>Update your personal information and how others see you.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold text-[#37322F] uppercase">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
                    <Input 
                      id="username" 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="pl-10 bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)]" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-[#37322F] uppercase">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)]" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[rgba(55,50,47,0.05)] space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <h4 className="text-sm font-bold text-[#37322F]">Password</h4>
                       <p className="text-xs text-[#605A57]">Change your account security credentials.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full border-[rgba(55,50,47,0.12)] text-[#37322F]">
                       Update Password
                    </Button>
                 </div>
              </div>
            </CardContent>
            <CardFooter className="bg-[#F7F5F3]/20 border-t border-[rgba(55,50,47,0.05)] p-4 flex justify-end gap-3">
              <Button variant="ghost" className="text-[#605A57]" onClick={() => router.back()}>Cancel</Button>
              <Button 
                onClick={handleSave} 
                className={cn("bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full px-8 transition-all", saveSuccess && "bg-green-600 hover:bg-green-600")}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : saveSuccess ? <><Check className="w-4 h-4 mr-2" /> Updated</> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
              </Button>
            </CardFooter>
          </Card>

          {/* Skills Card */}
          <Card className="mt-8 border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="border-b border-[rgba(55,50,47,0.05)] p-6">
              <CardTitle className="text-lg font-serif text-[#37322F] flex items-center gap-2">
                <Tag className="w-5 h-5" /> Skills
              </CardTitle>
              <CardDescription>Skills used for AI-powered incident assignment recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="bg-[#F7F5F3] text-[#37322F] rounded-full pr-1">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                {skills.length === 0 && <p className="text-sm text-[#605A57] italic">No skills added yet.</p>}
              </div>
              <div className="flex gap-2">
                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill() } }} placeholder="Add a skill (e.g., Python, AWS, Docker)" className="bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)]" />
                <Button onClick={handleAddSkill} size="sm" className="bg-[#37322F] text-white"><Plus className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Card */}
          <Card className="mt-8 border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="border-b border-[rgba(55,50,47,0.05)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-serif text-[#37322F] flex items-center gap-2">
                    <Github className="w-5 h-5" /> GitHub
                  </CardTitle>
                  <CardDescription>Link your account to view repos and recent commits.</CardDescription>
                </div>
                <Button onClick={handleConnectGithub} disabled={isConnectingGithub} className="bg-[#37322F] text-white rounded-full">
                  {isConnectingGithub ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
                  Connect
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {githubRepos.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#37322F] mb-2">Repositories</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {githubRepos.slice(0, 6).map(repo => (
                      <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-[#F7F5F3]/50 rounded-lg hover:bg-[#F7F5F3] transition-colors text-sm">
                        <ExternalLink className="w-3 h-3 text-[#605A57]" />
                        <span className="truncate font-medium">{repo.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {githubCommits.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#37322F] mb-2">Recent Commits</h4>
                  <div className="space-y-2">
                    {githubCommits.slice(0, 5).map(commit => (
                      <a key={commit.sha} href={commit.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-[#F7F5F3]/50 rounded-lg hover:bg-[#F7F5F3] transition-colors">
                        <span className="text-[10px] font-mono text-[#605A57] bg-[#F7F5F3] px-1.5 py-0.5 rounded">{commit.sha?.slice(0, 7)}</span>
                        <span className="text-sm truncate">{commit.message || "No message"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {githubRepos.length === 0 && githubCommits.length === 0 && (
                <div className="text-center py-6">
                  <Github className="w-8 h-8 text-[#605A57]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#605A57]">Connect GitHub to see your repositories and recent commits.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8 border-[rgba(55,50,47,0.12)] bg-red-50/20 border-dashed">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-900">Deactivate Account</h4>
                <p className="text-xs text-red-700">This will remove your access to all organizations.</p>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-100 hover:text-red-700">Deactivate</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
