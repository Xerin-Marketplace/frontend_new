"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import {
  Search,
  Send,
  MessageSquare,
  Store,
  Headphones,
  ArrowLeft,
} from "lucide-react"

type Message = {
  id: string
  sender: "me" | "them"
  text: string
  time: string
}

type Conversation = {
  id: string
  name: string
  type: "seller" | "support"
  last_message: string
  last_time: string
  unread: number
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Acme Trading Co.",
    type: "seller",
    last_message: "Your order has been shipped!",
    last_time: "2025-08-01 14:40",
    unread: 2,
    messages: [
      { id: "m1", sender: "them", text: "Hello! Thank you for your order #ORD-3921.", time: "2025-08-01 14:30" },
      { id: "m2", sender: "me", text: "Hi, when will it be delivered?", time: "2025-08-01 14:32" },
      { id: "m3", sender: "them", text: "Your order has been shipped! It should arrive in 1-2 days.", time: "2025-08-01 14:40" },
      { id: "m4", sender: "them", text: "Tracking number: G4S-789456", time: "2025-08-01 14:40" },
    ],
  },
  {
    id: "2",
    name: "XerinMarket Support",
    type: "support",
    last_message: "How can we help you today?",
    last_time: "2025-07-30 10:00",
    unread: 0,
    messages: [
      { id: "m1", sender: "them", text: "Welcome to XerinMarket Support! How can we help you today?", time: "2025-07-30 10:00" },
    ],
  },
  {
    id: "3",
    name: "TechWorld TZ",
    type: "seller",
    last_message: "The Smart Watch Pro is back in stock!",
    last_time: "2025-07-28 09:15",
    unread: 1,
    messages: [
      { id: "m1", sender: "me", text: "Is the Smart Watch Pro available?", time: "2025-07-28 09:10" },
      { id: "m2", sender: "them", text: "The Smart Watch Pro is back in stock!", time: "2025-07-28 09:15" },
    ],
  },
]

export default function UserMessagesPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>(mockConversations)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [input, setInput] = React.useState("")

  const active = conversations.find((c) => c.id === activeId)

  const filtered = React.useMemo(() => {
    if (!search) return conversations
    const term = search.toLowerCase()
    return conversations.filter((c) => c.name.toLowerCase().includes(term) || c.last_message.toLowerCase().includes(term))
  }, [conversations, search])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeId) return
    const newMsg: Message = {
      id: crypto.randomUUID(),
      sender: "me",
      text: input.trim(),
      time: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().slice(0, 5),
    }
    setConversations((prev) => prev.map((c) => c.id === activeId ? {
      ...c,
      messages: [...c.messages, newMsg],
      last_message: newMsg.text,
      last_time: newMsg.time,
      unread: 0,
    } : c))
    setInput("")
    toast.add({ title: "Message sent", description: "Your message has been delivered.", type: "success" })
  }

  const openConversation = (id: string) => {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c))
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">Chat with sellers and customer support.</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-[600px]">
            {/* Conversation List */}
            <div className={`flex flex-col border-r ${activeId ? "hidden sm:flex w-72" : "flex flex-1"}`}>
              {/* Search */}
              <div className="border-b p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No conversations found.</div>
                ) : (
                  filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className={`flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted/50 ${activeId === conv.id ? "bg-muted" : ""}`}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        {conv.type === "seller" ? <Store className="size-5 text-muted-foreground" /> : <Headphones className="size-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-sm">{conv.name}</span>
                          {conv.unread > 0 && <Badge variant="default" className="shrink-0 text-xs">{conv.unread}</Badge>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{conv.last_message}</p>
                        <span className="text-xs text-muted-foreground">{conv.last_time}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat View */}
            {activeId && active ? (
              <div className="flex flex-1 flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b p-3">
                  <Button variant="ghost" size="icon-sm" onClick={() => setActiveId(null)} className="sm:hidden">
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                    {active.type === "seller" ? <Store className="size-4 text-muted-foreground" /> : <Headphones className="size-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{active.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{active.type}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-3">
                    {active.messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p>{msg.text}</p>
                          <span className={`mt-1 block text-xs ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
                  <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1" />
                  <Button type="submit" size="icon" disabled={!input.trim()}>
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="hidden flex-1 items-center justify-center sm:flex">
                <div className="text-center">
                  <MessageSquare className="mx-auto size-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Select a conversation to start chatting</p>
                  {totalUnread > 0 && <Badge variant="default" className="mt-2">{totalUnread} unread</Badge>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
