"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { FloatingAI } from "@/components/dashboard/floating-ai"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, organization, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
      </div>
    )
  }

  const isSetupPage = pathname === "/dashboard/create-org" || pathname === "/dashboard/join-org"
  const hasOrg = !!organization
  const showSidebar = hasOrg && !isSetupPage

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex">
      {showSidebar && <Sidebar orgData={organization} />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {!isSetupPage && <FloatingAI />}
    </div>
  )
}
