"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

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

  // The current Gateway exposes profile and password settings only.
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
      .catch((error) => toast.add({ title: "Failed to load profile", description: getApiError(error), type: "error" }))
      .finally(() => setLoading(false))
  }, [user])

  const updateAccount = (field: keyof UserData, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your admin profile and account security.</p>
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
