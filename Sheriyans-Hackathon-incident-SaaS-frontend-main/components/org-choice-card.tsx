"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface OrgChoiceCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
  delay?: string
}

export function OrgChoiceCard({ title, description, icon: Icon, onClick, delay = "0ms" }: OrgChoiceCardProps) {
  return (
    <Card 
      className="group cursor-pointer border-[rgba(55,50,47,0.12)] hover:border-[#37322F]/40 transition-all duration-300 bg-white/50 hover:bg-white hover:shadow-2xl hover:shadow-[rgba(55,50,47,0.08)] overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: delay, animationFillMode: 'both' }}
      onClick={onClick}
    >
      <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F7F5F3] flex items-center justify-center group-hover:bg-[#37322F] group-hover:text-white transition-colors duration-300">
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[#37322F] font-sans">{title}</h3>
          <p className="text-[#605A57] text-sm leading-relaxed max-w-[240px]">
            {description}
          </p>
        </div>
        <div className="pt-4">
          <span className="text-[#37322F] text-sm font-medium border-b border-transparent group-hover:border-[#37322F] transition-all">
            Get started
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
