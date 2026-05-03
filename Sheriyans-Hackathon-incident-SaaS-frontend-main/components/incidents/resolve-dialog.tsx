"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

interface ResolveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string | null
  onResolved: () => void
}

export function ResolveDialog({ open, onOpenChange, incidentId, onResolved }: ResolveDialogProps) {
  const [resolutionText, setResolutionText] = useState("")

  const handleResolve = async () => {
    if (!incidentId) return
    try {
      await apiClient.put(`/incidents/${incidentId}`, {
        status: "closed",
        resolution: resolutionText,
      })
      toast.success("Incident resolved and archived")
      setResolutionText("")
      onOpenChange(false)
      onResolved()
    } catch (err) {
      toast.error("Failed to resolve incident")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-[#37322F]">Resolve Incident</DialogTitle>
          <DialogDescription>Provide details on how the issue was fixed for future reference.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#37322F] uppercase tracking-widest">Resolution Notes</Label>
            <Textarea
              placeholder="e.g., Restarted the server and updated the DB connection pool size..."
              className="bg-[#F7F5F3]/50 border-[rgba(55,50,47,0.1)] focus:ring-[#37322F] min-h-[120px]"
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); setResolutionText("") }}>Cancel</Button>
          <Button
            onClick={handleResolve}
            className="bg-[#37322F] text-white rounded-full px-8"
            disabled={!resolutionText.trim()}
          >
            Confirm Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
