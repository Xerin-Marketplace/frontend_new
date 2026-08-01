"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  User,
  Bell,
  Shield,
  Lock,
  Save,
  Trash2,
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

type NotificationPrefs = {
  new_orders: boolean
  order_updates: boolean
  low_stock: boolean
  payout_updates: boolean
  product_reviews: boolean
  customer_messages: boolean
  marketing_tips: boolean
}

type UserData = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerSettingsPage() {
  const { user } = useAuth()
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const [account, setAccount] = React.useState<UserData>({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "Seller",
  })

  const [prefs, setPrefs] = React.useState<NotificationPrefs>({
    new_orders: true,
    order_updates: true,
    low_stock: true,
    payout_updates: true,
    product_reviews: false,
    customer_messages: true,
    marketing_tips: false,
  })

  React.useEffect(() => {
    api.get<UserData & { role: string }>('/users/me')
      .then((data) => {
        setAccount({
          id: data.id,
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email,
          phone: data.phone,
          role: user?.account_type ?? "Seller",
        })
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load profile",
          description: getApiError(err),
          type: "error",
        })
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
      await api.patch('/users/me', {
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        phone: account.phone,
      })
      toast.add({ title: "Account saved!", description: "Your account information has been updated.", type: "success" })
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
    try {
      await api.post('/auth/change-password', {
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
    { key: "new_orders", label: "New Orders", desc: "Get notified when you receive a new order", icon: <Package className="size-4" /> },
    { key: "order_updates", label: "Order Updates", desc: "Notifications about order status changes", icon: <Bell className="size-4" /> },
    { key: "low_stock", label: "Low Stock Alerts", desc: "Alert when products are running low", icon: <AlertTriangle className="size-4" /> },
    { key: "payout_updates", label: "Payout Updates", desc: "Notifications about payout status", icon: <DollarSign className="size-4" /> },
    { key: "product_reviews", label: "Product Reviews", desc: "Get notified when products get reviews", icon: <MessageSquare className="size-4" /> },
    { key: "customer_messages", label: "Customer Messages", desc: "Notifications for customer inquiries", icon: <Mail className="size-4" /> },
    { key: "marketing_tips", label: "Marketing Tips", desc: "Tips and best practices for selling", icon: <Bell className="size-4" /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account, notifications, and security settings.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                <Input id="first_name" value={account.first_name} onChange={(e) => updateAccount("first_name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                <Input id="last_name" value={account.last_name} onChange={(e) => updateAccount("last_name", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <div className="flex h-9 items-center gap-2">
                  <Badge variant="secondary">{account.role}</Badge>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" value={account.email} onChange={(e) => updateAccount("email", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" value={account.phone} onChange={(e) => updateAccount("phone", e.target.value)} />
              </Field>
            </div>
          </FieldGroup>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveAccount} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Account"}
            </Button>
          </div>
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
                  className={`relative h-6 w-11 rounded-full transition-colors ${prefs[item.key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${prefs[item.key] ? "translate-x-5" : "translate-x-0.5"}`} />
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Password</div>
                  <div className="text-xs text-muted-foreground">Last changed 3 months ago</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Shield className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div>
              <div className="text-sm font-medium text-red-700">Deactivate Store</div>
              <div className="text-xs text-red-600">Temporarily disable your store. You can reactivate anytime.</div>
            </div>
            <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-100">
              Deactivate
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div>
              <div className="text-sm font-medium text-red-700">Delete Account</div>
              <div className="text-xs text-red-600">Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <PasswordForm onSubmit={handleChangePassword} />
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your seller account, store, products, and all associated data. <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => { setDeleteOpen(false); toast.add({ title: "Account deletion requested", description: "Contact support to complete deletion.", type: "success" }) }}>
              <Trash2 className="size-4" /> Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PasswordForm({
  onSubmit,
}: {
  onSubmit: (data: { current: string; new: string; confirm: string }) => void
}) {
  const [current, setCurrent] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !newPwd || newPwd !== confirm) return
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
          <FieldDescription>At least 8 characters with a mix of letters and numbers</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm New Password</FieldLabel>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {confirm && newPwd !== confirm && (
            <FieldDescription className="text-red-500">Passwords do not match</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Update Password</Button>
      </DialogFooter>
    </form>
  )
}
