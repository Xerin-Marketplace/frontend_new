"use client"

import * as React from "react"
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BarChart3,
  Smartphone,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton } from "@/components/skeletons"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type Tab = "overview" | "templates" | "logs" | "send"

type NotificationTemplateT = {
  id: string
  event: string
  channel: string
  subject_template: string | null
  body_template: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

type NotificationLogT = {
  id: string
  notification_id: string
  channel: string
  status: string
  provider: string | null
  provider_reference: string | null
  attempts: number
  sent_at: string | null
  delivered_at: string | null
  failed_at: string | null
  failure_reason: string | null
  notification_title: string | null
  notification_event: string | null
  user_name: string | null
  user_phone: string | null
  user_email: string | null
  created_at: string
}

type NotificationStats = {
  total_notifications: number
  total_deliveries: number
  by_channel: Record<string, number>
  by_status: Record<string, number>
  by_event: Record<string, number>
}

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

const channelIcon: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="size-4" />,
  email: <Mail className="size-4" />,
  in_app: <Bell className="size-4" />,
  push: <Smartphone className="size-4" />,
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "secondary",
  sent: "secondary",
  delivered: "default",
  failed: "destructive",
  cancelled: "outline",
}

const EVENT_OPTIONS = [
  "order_placed", "payment_confirmed", "order_accepted", "order_dispatched",
  "delivery_updated", "order_delivered", "refund_updated", "promotion_available",
  "review_reply", "new_order", "low_stock", "product_reviewed",
  "cancellation_requested", "payout_updated", "seller_approval_required",
  "product_approval_required", "system_alert", "warehouse_received",
  "ready_for_delivery", "driver_assigned", "out_for_delivery", "delivery_failed",
  "stock_transfer_approved", "stock_transfer_received", "stock_transfer_rejected",
  "admin_order_alert", "admin_delivery_alert", "seller_order_ready", "otp_verification",
]

export function NotificationManagement({ initialTab = "overview" }: { initialTab?: Tab }) {
  const [tab, setTab] = React.useState<Tab>(initialTab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage SMS &amp; email templates, notification logs, and send bulk messages.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="size-4" /> Overview</TabsTrigger>
          <TabsTrigger value="templates"><Mail className="size-4" /> Templates</TabsTrigger>
          <TabsTrigger value="logs"><Clock className="size-4" /> Delivery Logs</TabsTrigger>
          <TabsTrigger value="send"><Send className="size-4" /> Send</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
        <TabsContent value="send"><SendTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = React.useState<NotificationStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.get<NotificationStats>("/admin/notification-stats")
      .then(setStats)
      .catch((err) => toast.add({ title: "Failed to load stats", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TableSkeleton rows={3} cols={4} />
  if (!stats) return null

  const cards = [
    { label: "Total Notifications", value: stats.total_notifications, icon: <Bell className="size-5" /> },
    { label: "Total Deliveries", value: stats.total_deliveries, icon: <Send className="size-5" /> },
    { label: "SMS Sent", value: stats.by_channel.sms || 0, icon: <MessageSquare className="size-5" /> },
    { label: "Emails Sent", value: stats.by_channel.email || 0, icon: <Mail className="size-5" /> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{c.icon}</div>
              <div>
                <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Delivery Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.by_status).filter(([, v]) => v > 0).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <Badge variant={statusVariant[key] ?? "outline"}>{key}</Badge>
                <span className="text-sm font-medium">{val}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Event Type</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.by_event).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-mono">{key}</span>
                <span className="text-sm font-medium">{val}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TemplatesTab() {
  const [templates, setTemplates] = React.useState<NotificationTemplateT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [editing, setEditing] = React.useState<NotificationTemplateT | null>(null)
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<NotificationTemplateT[]>("/admin/notification-templates")
      .then(setTemplates)
      .catch((err) => toast.add({ title: "Failed to load templates", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const filtered = templates.filter((t) =>
    !search || t.event.toLowerCase().includes(search.toLowerCase()) || t.channel.toLowerCase().includes(search.toLowerCase())
  )

  const handleSeed = async () => {
    try {
      const result = await api.post<{ created: number; skipped: number }>("/admin/notification-templates/seed", {})
      toast.add({ title: "Templates seeded", description: `${result.created} created, ${result.skipped} skipped`, type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to seed templates", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}><Sparkles className="size-4" /> Seed Defaults</Button>
          <Button onClick={() => setCreating(true)}><Plus className="size-4" /> New Template</Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Mail className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No templates found</p>
            <p className="text-xs text-muted-foreground">Click "Seed Defaults" to create standard notification templates.</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.event}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {channelIcon[t.channel]}
                        <span className="text-sm">{t.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.subject_template || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "outline"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(t)}><Eye className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(editing || creating) && (
        <TemplateDialog
          template={editing}
          open={!!editing || creating}
          onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false) } }}
          onSaved={load}
        />
      )}
    </div>
  )
}

function TemplateDialog({
  template,
  open,
  onOpenChange,
  onSaved,
}: {
  template: NotificationTemplateT | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [event, setEvent] = React.useState(template?.event ?? "order_placed")
  const [channel, setChannel] = React.useState(template?.channel ?? "sms")
  const [subject, setSubject] = React.useState(template?.subject_template ?? "")
  const [body, setBody] = React.useState(template?.body_template ?? "")
  const [isActive, setIsActive] = React.useState(template?.is_active ?? true)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (template) {
        await api.patch(`/admin/notification-templates/${template.id}`, {
          subject_template: subject || null,
          body_template: body,
          is_active: isActive,
        })
        toast.add({ title: "Template updated", type: "success" })
      } else {
        await api.post("/admin/notification-templates", {
          event,
          channel,
          subject_template: subject || null,
          body_template: body,
          is_active: isActive,
        })
        toast.add({ title: "Template created", type: "success" })
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.add({ title: "Failed to save template", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>Use $variable for dynamic content (e.g. $order_number, $user_name).</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            {!template && (
              <>
                <Field>
                  <FieldLabel>Event *</FieldLabel>
                  <Select value={event} onValueChange={(v) => setEvent(v ?? "order_placed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {EVENT_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Channel *</FieldLabel>
                  <Select value={channel} onValueChange={(v) => setChannel(v ?? "sms")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            <Field>
              <FieldLabel>Subject Template {channel === "email" ? "*" : ""}</FieldLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Order Confirmed - $order_number" />
            </Field>
            <Field>
              <FieldLabel>Body Template *</FieldLabel>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Hello $user_name, your order $order_number has been placed." />
            </Field>
            <Field>
              <FieldLabel>Active</FieldLabel>
              <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>{template ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LogsTab() {
  const [logs, setLogs] = React.useState<NotificationLogT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [channelFilter, setChannelFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("page_size", "20")
    if (channelFilter !== "all") params.set("channel", channelFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (search) params.set("search", search)
    api.get<{ total: number; results: NotificationLogT[] }>(`/admin/notification-logs?${params}`)
      .then((d) => { setLogs(d.results); setTotal(d.total) })
      .catch((err) => toast.add({ title: "Failed to load logs", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [page, channelFilter, statusFilter, search])

  React.useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by user, phone, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v ?? "all"); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="in_app">In-App</SelectItem>
            <SelectItem value="push">Push</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : logs.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Clock className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No delivery logs found</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{l.user_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.user_phone ?? l.user_email ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {channelIcon[l.channel]}
                        <span className="text-sm">{l.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.notification_event ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {l.status === "delivered" && <CheckCircle2 className="size-3 text-green-600" />}
                        {l.status === "failed" && <XCircle className="size-3 text-red-600" />}
                        {l.status === "sent" && <Send className="size-3 text-blue-600" />}
                        <Badge variant={statusVariant[l.status] ?? "outline"}>{l.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.provider ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SendTab() {
  const [tab, setTab] = React.useState<"test" | "bulk">("test")
  const [sending, setSending] = React.useState(false)

  // Test send
  const [testChannel, setTestChannel] = React.useState("sms")
  const [testRecipient, setTestRecipient] = React.useState("")
  const [testSubject, setTestSubject] = React.useState("")
  const [testMessage, setTestMessage] = React.useState("")

  // Bulk SMS
  const [bulkRecipients, setBulkRecipients] = React.useState("")
  const [bulkMessage, setBulkMessage] = React.useState("")

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const result = await api.post<{ accepted: boolean; error?: string }>('/admin/notification-test-send', {
        channel: testChannel,
        recipient: testRecipient,
        subject: testSubject || null,
        message: testMessage,
      })
      if (result.accepted) {
        toast.add({ title: 'Test message sent successfully', type: 'success' })
      } else {
        toast.add({ title: 'Send failed', description: result.error || 'Unknown error', type: 'error' })
      }
    } catch (err) {
      toast.add({ title: "Failed to send", description: message(err), type: "error" })
    } finally {
      setSending(false)
    }
  }

  const handleBulkSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const recipients = bulkRecipients.split("\n").map((r) => r.trim()).filter(Boolean)
    if (recipients.length === 0) {
      toast.add({ title: "Add at least one recipient", type: "warning" })
      return
    }
    setSending(true)
    try {
      const result = await api.post<{ total: number; sent: number; failed: number }>("/admin/notification-bulk-sms", {
        recipients,
        message: bulkMessage,
      })
      toast.add({ title: "Bulk SMS sent", description: `${result.sent} sent, ${result.failed} failed`, type: "success" })
      setBulkRecipients("")
      setBulkMessage("")
    } catch (err) {
      toast.add({ title: "Failed to send bulk SMS", description: message(err), type: "error" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "test" | "bulk")}>
        <TabsList>
          <TabsTrigger value="test"><Send className="size-4" /> Test Send</TabsTrigger>
          <TabsTrigger value="bulk"><MessageSquare className="size-4" /> Bulk SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <Card>
            <CardHeader><CardTitle className="text-base">Send Test Notification</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleTestSend} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Channel *</FieldLabel>
                    <Select value={testChannel} onValueChange={(v) => setTestChannel(v ?? "sms")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Recipient {testChannel === "sms" ? "Phone" : "Email"} *</FieldLabel>
                    <Input value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder={testChannel === "sms" ? "+255712345678" : "user@example.com"} required />
                  </Field>
                  {testChannel === "email" && (
                    <Field>
                      <FieldLabel>Subject</FieldLabel>
                      <Input value={testSubject} onChange={(e) => setTestSubject(e.target.value)} placeholder="Test Subject" />
                    </Field>
                  )}
                  <Field>
                    <FieldLabel>Message *</FieldLabel>
                    <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={3} placeholder="Test message content..." required />
                  </Field>
                </FieldGroup>
                <Button type="submit" loading={sending}><Send className="size-4" /> Send Test</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle className="text-base">Send Bulk SMS</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleBulkSend} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Recipients (one per line) *</FieldLabel>
                    <Textarea value={bulkRecipients} onChange={(e) => setBulkRecipients(e.target.value)} rows={5} placeholder="+255712345678&#10;+255787654321&#10;+255700000000" required />
                    <p className="text-xs text-muted-foreground">Maximum 500 recipients per batch.</p>
                  </Field>
                  <Field>
                    <FieldLabel>Message *</FieldLabel>
                    <Textarea value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} rows={3} placeholder="Your message here..." required />
                  </Field>
                </FieldGroup>
                <Button type="submit" loading={sending}><MessageSquare className="size-4" /> Send Bulk SMS</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
