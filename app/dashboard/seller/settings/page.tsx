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
  Shield,
  Lock,
  Save,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PhoneInput } from "@/components/ui/phone-input"
import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

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

  const [account, setAccount] = React.useState<UserData>({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "Seller",
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
                <PhoneInput id="phone" value={account.phone} onChange={(val) => updateAccount("phone", val)} />
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
                  <div className="text-xs text-muted-foreground">Change your account password</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                Change Password
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
