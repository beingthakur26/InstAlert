"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2 } from "lucide-react"

import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      await login({ email, password })
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background patterns similar to landing page */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-[calc(50%-530px)] top-0 bg-[rgba(55,50,47,0.12)]"></div>
         <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-[calc(50%-530px)] top-0 bg-[rgba(55,50,47,0.12)]"></div>
      </div>

      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="text-[#37322F] text-3xl font-semibold mb-3 font-sans">
            InstaAlert
          </Link>
          <div className="h-[1px] w-16 bg-[#37322F]/20"></div>
        </div>

        <Card className="border-[rgba(55,50,47,0.12)] shadow-xl shadow-[rgba(55,50,47,0.04)] bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-3 pt-4">
            <CardTitle className="text-2xl font-serif text-[#37322F]">Welcome back</CardTitle>
            <CardDescription className="text-[#605A57] text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 pb-6">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-[#37322F] font-medium">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="you@company.com" 
                  required 
                  className="border-[rgba(55,50,47,0.12)] focus:border-[#37322F]/40 focus:ring-1 focus:ring-[#37322F]/20 transition-all h-11"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#37322F] font-medium">Password</Label>
                </div>
                <Input 
                  id="password"
                  name="password"
                  type="password" 
                  placeholder="Enter your password"
                  required 
                  className="border-[rgba(55,50,47,0.12)] focus:border-[#37322F]/40 focus:ring-1 focus:ring-[#37322F]/20 transition-all h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0 pb-6 px-6">
              <Button 
                type="submit" 
                className="w-full bg-[#37322F] hover:bg-[#37322F]/90 text-white rounded-full h-12 text-base transition-all group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <div className="text-center text-sm text-[#605A57] pt-1">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#37322F] font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
