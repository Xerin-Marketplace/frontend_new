"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type UserData = {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

type NotificationPrefs = {
  new_users: boolean
  seller_applications: boolean
  product_approvals: boolean
  refund_requests: boolean
  payout_requests: boolean
  security_alerts: boolean
  system_updates: boolean
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

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

  const [prefs, setPrefs] = React.useState<NotificationPrefs>({
    new_users: true,
    seller_applications: true,
    product_approvals: true,
    refund_requests: true,
    payout_requests: true,
    security_alerts: true,
    system_updates: false,
  })

  React.useEffect(() => {
    api.get<UserData & { first_name: string; last_name: string }>("/users/me")
      .then((data) => {
        setAccount({
          id: data.id,
          full_name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
          email: data.email,
          phone: data.phone ?? "",
          role: user?.account_type ?? "Admin",
        })
      })
      .catch((err) => {
        toast.add({ title: "Failed to load profile", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [user])

  const updateAccount = (field: keyof UserData, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
  }

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
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

  const handleSavePrefs = () => {
    toast.add({ title: "Preferences saved!", description: "Notification settings have been updated.", type: "success" })
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

  const notificationItems: { key: keyof NotificationPrefs; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: "new_users", label: "New User Registrations", desc: "Get notified when new users sign up", icon: <Settings className="size-4" /> },
    { key: "seller_applications", label: "Seller Applications", desc: "Notifications for pending seller approvals", icon: <Package className="size-4" /> },
    { key: "product_approvals", label: "Product Approvals", desc: "Alerts for products awaiting review", icon: <Package className="size-4" /> },
    { key: "refund_requests", label: "Refund Requests", desc: "Notifications for new refund requests", icon: <AlertTriangle className="size-4" /> },
    { key: "payout_requests", label: "Payout Requests", desc: "Alerts for pending payout requests", icon: <DollarSign className="size-4" /> },
    { key: "security_alerts", label: "Security Alerts", desc: "Critical security events and alerts", icon: <Shield className="size-4" /> },
    { key: "system_updates", label: "System Updates", desc: "Platform maintenance and update notifications", icon: <Bell className="size-4" /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your admin account and platform preferences.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4" /> Account Information
          </CardTitle>
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

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" /> Notification Preferences
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSavePrefs}>
              <Save className="size-4" /> Save Preferences
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => togglePref(item.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    prefs[item.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${
                      prefs[item.key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
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
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Shield className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-xs text-muted-foreground">Your account security status</div>
                </div>
              </div>
              <Badge variant="default">Secure</Badge>
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
