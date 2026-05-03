"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Building, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Lock,
  Save,
  Image as ImageIcon,
  Camera,
  Check,
  Loader2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { organization, user, userRole, refreshUser, logout } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [selectedNewOwner, setSelectedNewOwner] = useState("")
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    incident_events: ["incident.created", "incident.updated", "incident.resolved", "sla.breach"] as string[],
    slack_webhook_url: "",
  })
  const [securityPrefs, setSecurityPrefs] = useState({
    session_timeout: true,
  })
  const [formData, setFormData] = useState({
    organizationName: "",
    description: "",
    website: ""
  })

  const isOwner = userRole === "owner"

  useEffect(() => {
    if (organization) {
      setFormData({
        organizationName: organization.organizationName,
        description: (organization as any).description || "",
        website: (organization as any).website || ""
      })
      const storedLogo = (organization as any).logo_url
      if (storedLogo) {
        setLogoUrl(storedLogo.startsWith("http") ? storedLogo : `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://instalert-atbh.onrender.com"}${storedLogo}`)
      }
      const ns = (organization as any).notification_settings
      if (ns) {
        setNotificationPrefs({
          email_enabled: ns.email_enabled ?? true,
          incident_events: ns.incident_events || ["incident.created", "incident.updated", "incident.resolved", "sla.breach"],
          slack_webhook_url: ns.slack_webhook_url || "",
        })
      }
    }
  }, [organization])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await apiClient.put("/organization/update", formData)
      await refreshUser()
      setSaveSuccess(true)
      toast.success("Settings updated successfully")
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      toast.error("Failed to update settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB")
      return
    }

    try {
      setIsUploadingLogo(true)
      const formDataUpload = new FormData()
      formDataUpload.append("logo", file)

      const res = await apiClient.post("/organization/upload-logo", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const fullUrl = res.data.logo_url.startsWith("http")
        ? res.data.logo_url
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://instalert-atbh.onrender.com"}${res.data.logo_url}`

      setLogoUrl(fullUrl)
      await refreshUser()
      toast.success("Logo uploaded successfully")
    } catch (err) {
      toast.error("Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveNotifications = async () => {
    try {
      await apiClient.put("/organization/notification-settings", notificationPrefs)
      await refreshUser()
      toast.success("Notification preferences updated")
    } catch (err) {
      toast.error("Failed to update notification settings")
    }
  }

  const toggleEvent = (event: string) => {
    setNotificationPrefs(prev => ({
      ...prev,
      incident_events: prev.incident_events.includes(event)
        ? prev.incident_events.filter(e => e !== event)
        : [...prev.incident_events, event],
    }))
  }

  const handleDeleteOrg = async () => {
    try {
      setIsDeleting(true)
      await apiClient.delete("/organization/delete")
      toast.success("Organization deleted")
      await refreshUser()
      router.push("/dashboard")
    } catch (err) {
      toast.error("Failed to delete organization")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return toast.error("Please select a member")
    try {
      setIsTransferring(true)
      await apiClient.post("/organization/transfer-ownership", { newOwnerId: selectedNewOwner })
      toast.success("Ownership transferred successfully")
      await refreshUser()
      router.push("/dashboard")
    } catch (err) {
      toast.error("Failed to transfer ownership")
    } finally {
      setIsTransferring(false)
    }
  }

  if (!organization) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-[#37322F]" />
    </div>
  )

  if (!isOwner) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif text-[#37322F]">Access Restricted</h2>
        <p className="text-[#605A57] max-w-md mx-auto">
          Only organization owners can access and modify organization settings. 
          Please contact your administrator if you believe this is an error.
        </p>
        <Button 
          variant="outline" 
          className="rounded-full border-[rgba(55,50,47,0.12)] text-[#37322F]"
          onClick={() => router.push("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-[#37322F] tracking-tight">Organization Settings</h1>
        <p className="text-[#605A57] mt-1">Manage your workspace preferences, billing, and security.</p>
      </header>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-[#F7F5F3] p-1 border border-[rgba(55,50,47,0.12)] rounded-full mb-8">
          <TabsTrigger value="general" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
            General
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="border-b border-[rgba(55,50,47,0.05)] p-6">
              <CardTitle className="text-xl font-serif text-[#37322F]">Organization Profile</CardTitle>
              <CardDescription>Update your organization's public information.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-3">
                  <Label>Organization Logo</Label>
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl bg-[#F7F5F3] border-2 border-dashed border-[rgba(55,50,47,0.2)] flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Org logo" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-[#605A57]/30 mx-auto" />
                          <span className="text-[10px] text-[#605A57] mt-1">No logo</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      className="absolute -bottom-2 -right-2 rounded-full bg-[#37322F] text-white shadow-lg w-8 h-8"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </Button>
                  </div>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/gif" 
                    className="hidden" 
                    onChange={handleLogoUpload} 
                  />
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input 
                        id="orgName" 
                        value={formData.organizationName} 
                        onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                        className="bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#605A57]" />
                        <Input 
                          id="website" 
                          value={formData.website} 
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          placeholder="https://acme.com" 
                          className="pl-10 bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)]" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-[#F7F5F3]/30 border-[rgba(55,50,47,0.12)] min-h-[100px]" 
                      placeholder="Briefly describe your organization..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-[#F7F5F3]/20 border-t border-[rgba(55,50,47,0.05)] p-4 flex justify-end gap-3">
              <Button variant="ghost" className="text-[#605A57]">Cancel</Button>
              <Button 
                onClick={handleSave} 
                className={cn("bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full px-6 transition-all", saveSuccess && "bg-green-600 hover:bg-green-600")}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : saveSuccess ? <><Check className="w-4 h-4 mr-2" /> Saved</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-serif text-[#37322F]">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
               <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-xl">
                 <div>
                   <h4 className="text-sm font-bold text-red-900">Transfer Ownership</h4>
                   <p className="text-xs text-red-700">Assign another member as the organization owner.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Select onValueChange={setSelectedNewOwner} value={selectedNewOwner}>
                      <SelectTrigger className="w-40 bg-white border-red-100 text-xs h-9">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[rgba(55,50,47,0.12)]">
                        {organization.members.map((m: any) => (
                          <SelectItem key={m._id} value={m._id}>{m.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-9" disabled={!selectedNewOwner || isTransferring}>
                          {isTransferring ? "Transferring..." : "Transfer"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will transfer full administrative control to the selected member. You will become a regular member.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleTransferOwnership} className="bg-red-600 text-white hover:bg-red-700">
                            Confirm Transfer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 rounded-xl">
                 <div>
                   <h4 className="text-sm font-bold text-red-900">Delete Organization</h4>
                   <p className="text-xs text-red-700">Permanently delete all data, members, and settings.</p>
                 </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700 text-white h-9" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete Forever"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your organization and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOrg} className="bg-red-600 text-white hover:bg-red-700">
                          Confirm Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
           <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white overflow-hidden">
             <div className="p-8 bg-[#37322F] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                  <Badge className="bg-white/20 text-white mb-4 border-none">Current Plan</Badge>
                  <h3 className="text-3xl font-serif mb-2">Free Starter Plan</h3>
                  <p className="text-white/60 text-sm max-w-[400px]">Perfect for individuals and small teams getting started with automated billing.</p>
                </div>
             </div>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#605A57] uppercase tracking-wider">Members</p>
                    <p className="text-2xl font-serif text-[#37322F]">{organization.members.length + 1} / 3 <span className="text-sm font-sans text-[#605A57] font-normal">used</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#605A57] uppercase tracking-wider">Storage</p>
                    <p className="text-2xl font-serif text-[#37322F]">500 MB <span className="text-sm font-sans text-[#605A57] font-normal">limit</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#605A57] uppercase tracking-wider">Renewal Date</p>
                    <p className="text-2xl font-serif text-[#37322F]">Never <span className="text-sm font-sans text-[#605A57] font-normal">Free forever</span></p>
                  </div>
                </div>
                <div className="pt-6 border-t border-[rgba(55,50,47,0.05)]">
                  <Button disabled className="w-full bg-[#37322F]/50 text-white/70 rounded-full h-12 text-lg cursor-not-allowed">
                    Upgrade to Pro Plan — Coming Soon
                  </Button>
                  <p className="text-center text-xs text-[#605A57] mt-2">Payment integration will be available in the next release.</p>
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-[rgba(55,50,47,0.12)] shadow-sm bg-white">
            <CardHeader className="p-6 border-b border-[rgba(55,50,47,0.05)]">
              <CardTitle className="text-xl font-serif text-[#37322F]">Security Settings</CardTitle>
              <CardDescription>Control how your organization stays secure.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-[#37322F]">Two-Factor Authentication</Label>
                  <p className="text-sm text-[#605A57]">Require all members to use 2FA to access this organization.</p>
                </div>
                <Switch disabled className="opacity-50" />
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(55,50,47,0.05)] pt-6">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-[#37322F]">SSO Enforcement</Label>
                  <p className="text-sm text-[#605A57]">Allow members to sign in only using Google or Microsoft SSO.</p>
                </div>
                <Switch disabled className="opacity-50" />
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(55,50,47,0.05)] pt-6">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-[#37322F]">Session Timeout</Label>
                  <p className="text-sm text-[#605A57]">Automatically log out users after 4 hours of inactivity.</p>
                </div>
                <Switch checked={securityPrefs.session_timeout} onCheckedChange={(v) => setSecurityPrefs(prev => ({...prev, session_timeout: v}))} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-800">Advanced Security — Coming Soon</h4>
                <p className="text-xs text-amber-700 mt-1">2FA and SSO integration will be available in the next release. Session timeout is currently tracked locally.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
