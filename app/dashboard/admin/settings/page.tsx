"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Settings,
  Shield,
  Lock,
  Save,
  Bell,
  Mail,
  MessageSquare,
  Package,
  DollarSign,
  AlertTriangle,
  Smartphone,
  Monitor,
  Clock,
  Globe,
  Store,
  CreditCard,
  Truck,
  RefreshCw,
  CheckCircle,
  Moon,
  ShoppingBag,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

// ─── Types ──────────────────────────────────────────────────────────────────

type UserData = {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

type NotificationPrefsResponse = {
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  event_preferences: Record<string, Record<string, boolean>>
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
}

type EventPref = {
  event: string
  label: string
  desc: string
  icon: React.ReactNode
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

// ─── Notification Events ─────────────────────────────────────────────────────

const NOTIFICATION_EVENTS: EventPref[] = [
  { event: "new_order", label: "New Orders", desc: "When a new order is placed on the platform", icon: <Package className="size-4" /> },
  { event: "payment_confirmed", label: "Payment Confirmed", desc: "When payments are confirmed", icon: <DollarSign className="size-4" /> },
  { event: "order_placed", label: "Order Placed", desc: "Notifications for all placed orders", icon: <ShoppingBag className="size-4" /> },
  { event: "order_accepted", label: "Order Accepted", desc: "When sellers accept orders", icon: <CheckCircle className="size-4" /> },
  { event: "order_dispatched", label: "Order Dispatched", desc: "When orders are shipped", icon: <Truck className="size-4" /> },
  { event: "order_delivered", label: "Order Delivered", desc: "When orders are delivered", icon: <CheckCircle className="size-4" /> },
  { event: "delivery_updated", label: "Delivery Updates", desc: "Shipping status changes", icon: <Truck className="size-4" /> },
  { event: "cancellation_requested", label: "Cancellation Requests", desc: "When buyers request cancellations", icon: <AlertTriangle className="size-4" /> },
  { event: "refund_updated", label: "Refund Updates", desc: "Refund status changes", icon: <RefreshCw className="size-4" /> },
  { event: "payout_updated", label: "Payout Updates", desc: "Payout request status changes", icon: <CreditCard className="size-4" /> },
  { event: "seller_approval_required", label: "Seller Approvals", desc: "Pending seller applications", icon: <Store className="size-4" /> },
  { event: "product_approval_required", label: "Product Approvals", desc: "Products awaiting review", icon: <Package className="size-4" /> },
  { event: "product_reviewed", label: "Product Reviews", desc: "New product reviews submitted", icon: <MessageSquare className="size-4" /> },
  { event: "low_stock", label: "Low Stock Alerts", desc: "When product stock is low", icon: <AlertTriangle className="size-4" /> },
  { event: "promotion_available", label: "Promotions", desc: "New promotions available", icon: <Bell className="size-4" /> },
  { event: "review_reply", label: "Review Replies", desc: "Replies to product reviews", icon: <MessageSquare className="size-4" /> },
  { event: "system_alert", label: "System Alerts", desc: "Critical system events", icon: <Shield className="size-4" /> },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  const [account, setAccount] = React.useState<UserData>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    role: "Admin",
  })

  // Backend notification preferences
  const [channelPrefs, setChannelPrefs] = React.useState({
    in_app_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
  })
  const [eventPrefs, setEventPrefs] = React.useState<Record<string, Record<string, boolean>>>({})
  const [quietHoursStart, setQuietHoursStart] = React.useState("")
  const [quietHoursEnd, setQuietHoursEnd] = React.useState("")
  const [timezone, setTimezone] = React.useState("UTC")

  // Load user profile + notification preferences
  React.useEffect(() => {
    Promise.allSettled([
      api.get<UserData & { first_name: string; last_name: string }>("/users/me"),
      api.get<NotificationPrefsResponse>("/notifications/preferences"),
    ])
      .then(([userRes, prefsRes]) => {
        if (userRes.status === "fulfilled") {
          const data = userRes.value
          setAccount({
            id: data.id,
            full_name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
            email: data.email,
            phone: data.phone ?? "",
            role: user?.account_type ?? "Admin",
          })
        } else {
          toast.add({ title: "Failed to load profile", description: getApiError(userRes.reason), type: "error" })
        }

        if (prefsRes.status === "fulfilled") {
          const p = prefsRes.value
          setChannelPrefs({
            in_app_enabled: p.in_app_enabled,
            email_enabled: p.email_enabled,
            sms_enabled: p.sms_enabled,
            push_enabled: p.push_enabled,
          })
          setEventPrefs(p.event_preferences || {})
          setQuietHoursStart(p.quiet_hours_start ?? "")
          setQuietHoursEnd(p.quiet_hours_end ?? "")
          setTimezone(p.timezone || "UTC")
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  const updateAccount = (field: keyof UserData, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
  }

  const toggleChannel = (key: keyof typeof channelPrefs) => {
    setChannelPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleEventChannel = (event: string, channel: string) => {
    setEventPrefs((prev) => {
      const current = prev[event] || {}
      return {
        ...prev,
        [event]: { ...current, [channel]: !current[channel] },
      }
    })
  }

  const isEventChannelEnabled = (event: string, channel: string): boolean => {
    const overrides = eventPrefs[event] || {}
    if (channel in overrides) return overrides[channel]
    // Fall back to channel default
    if (channel === "in_app") return channelPrefs.in_app_enabled
    if (channel === "email") return channelPrefs.email_enabled
    if (channel === "sms") return channelPrefs.sms_enabled
    if (channel === "push") return channelPrefs.push_enabled
    return true
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      const [firstName, ...rest] = account.full_name.split(" ")
      const lastName = rest.join(" ")
      await api.patch("/users/me", {
        first_name: firstName,
        last_name: lastName,
        email: account.email,
        phone: account.phone,
      })
      toast.add({ title: "Account saved!", description: "Your admin profile has been updated.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to save", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrefs = async () => {
    setSaving(true)
    try {
      await api.patch<NotificationPrefsResponse>("/notifications/preferences", {
        in_app_enabled: channelPrefs.in_app_enabled,
        email_enabled: channelPrefs.email_enabled,
        sms_enabled: channelPrefs.sms_enabled,
        push_enabled: channelPrefs.push_enabled,
        event_preferences: eventPrefs,
        quiet_hours_start: quietHoursStart || null,
        quiet_hours_end: quietHoursEnd || null,
        timezone,
      })
      toast.add({ title: "Preferences saved!", description: "Notification settings have been saved to the server.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to save preferences", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (data: { current: string; new: string; confirm: string }) => {
    if (data.new !== data.confirm) {
      toast.add({ title: "Passwords don't match", description: "New password and confirmation must match.", type: "error" })
      return
    }
    try {
      await api.post("/auth/change-password", {
        current_password: data.current,
        new_password: data.new,
      })
      setPasswordOpen(false)
      toast.add({ title: "Password changed!", description: "Your password has been updated successfully.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to change password", description: getApiError(err), type: "error" })
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </PageSkeleton>
    )
  }

  const channels = [
    { key: "in_app" as const, label: "In-App", icon: <Monitor className="size-4" />, prefKey: "in_app_enabled" as const },
    { key: "email" as const, label: "Email", icon: <Mail className="size-4" />, prefKey: "email_enabled" as const },
    { key: "sms" as const, label: "SMS", icon: <Smartphone className="size-4" />, prefKey: "sms_enabled" as const },
    { key: "push" as const, label: "Push", icon: <Bell className="size-4" />, prefKey: "push_enabled" as const },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your admin account, notification channels, and platform preferences.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4" /> Account Information
          </CardTitle>
          <CardDescription>Your personal admin account details</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <Input id="full_name" value={account.full_name} onChange={(e) => updateAccount("full_name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Input id="role" value={account.role} disabled className="bg-muted" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" value={account.email} onChange={(e) => updateAccount("email", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" value={account.phone} onChange={(e) => updateAccount("phone", e.target.value)} placeholder="+255..." />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveAccount} disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" /> Notification Channels
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((ch) => (
              <div
                key={ch.key}
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                  channelPrefs[ch.prefKey] ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${
                    channelPrefs[ch.prefKey] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {ch.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{ch.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {channelPrefs[ch.prefKey] ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={channelPrefs[ch.prefKey]}
                  onCheckedChange={() => toggleChannel(ch.prefKey)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event-based Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4" /> Event Preferences
              </CardTitle>
              <CardDescription>Toggle individual notification events and their delivery channels</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSavePrefs} disabled={saving}>
              <Save className="size-4" /> {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {NOTIFICATION_EVENTS.map((item) => (
              <div key={item.event} className="rounded-xl border p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                  {/* Per-channel toggles */}
                  <div className="flex items-center gap-4">
                    {channels.map((ch) => (
                      <div key={ch.key} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">{ch.label}</span>
                        <Switch
                          size="sm"
                          checked={isEventChannelEnabled(item.event, ch.key)}
                          onCheckedChange={() => toggleEventChannel(item.event, ch.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="size-4" /> Quiet Hours
          </CardTitle>
          <CardDescription>Pause non-critical notifications during specified hours</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="quiet_start">
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> Start Time</span>
                </FieldLabel>
                <Input
                  id="quiet_start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="quiet_end">
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> End Time</span>
                </FieldLabel>
                <Input
                  id="quiet_end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="timezone">
                  <span className="flex items-center gap-1.5"><Globe className="size-3.5" /> Timezone</span>
                </FieldLabel>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="UTC"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSavePrefs} disabled={saving}>
                <Save className="size-4" /> {saving ? "Saving..." : "Save Quiet Hours"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" /> Security
          </CardTitle>
          <CardDescription>Account security and password management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Change Password</div>
                  <div className="text-xs text-muted-foreground">Update your password regularly for security</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                  <Shield className="size-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-xs text-muted-foreground">Your account security status</div>
                </div>
              </div>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="size-3" /> Secure
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Smartphone className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
                </div>
              </div>
              <Badge variant="secondary">Not Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <PasswordForm onSubmit={handleChangePassword} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PasswordForm({ onSubmit }: { onSubmit: (data: { current: string; new: string; confirm: string }) => void }) {
  const [current, setCurrent] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !newPwd || !confirm) return
    onSubmit({ current, new: newPwd, confirm })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>Enter your current password and a new password.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current">Current Password</FieldLabel>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="new">New Password</FieldLabel>
          <Input id="new" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
          <FieldDescription>At least 8 characters</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm New Password</FieldLabel>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Update Password</Button>
      </DialogFooter>
    </form>
  )
}
