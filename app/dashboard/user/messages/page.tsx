"use client"

import { MessageSquare } from "lucide-react"

export default function UserMessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">Chat with sellers and customer support.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <MessageSquare className="size-12 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages from sellers and support will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
