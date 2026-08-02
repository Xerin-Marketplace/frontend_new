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
import { Skeleton } from "@/components/ui/skeleton"
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

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

type UserProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string | null
  gender: string | null
  account_type: string
}

export default function UserSettingsPage() {
  const { refreshUser } = useAuth()
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)

  React.useEffect(() => {
    api.get<UserProfile>("/users/me")
      .then(setProfile)
      .catch((err) => {
        toast.add({ title: "Failed to load profile", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const updateProfile = (field: string, value: string) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await api.patch("/users/me", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
      })
      toast.add({ title: "Profile saved!", description: "Your profile has been updated.", type: "success" })
      refreshUser()
    } catch (err) {
      toast.add({ title: "Failed to save", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (current: string, newPwd: string) => {
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: newPwd })
      setPasswordOpen(false)
      toast.add({ title: "Password changed!", description: "Your password has been updated.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to change password", description: getApiError(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, notifications, and security.</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
              <Skeleton className="h-9 w-full" />
            </div>
          ) : profile ? (
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                <Input id="first_name" value={profile.first_name ?? ""} onChange={(e) => updateProfile("first_name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                <Input id="last_name" value={profile.last_name ?? ""} onChange={(e) => updateProfile("last_name", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" value={profile.email ?? ""} onChange={(e) => updateProfile("email", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <PhoneInput id="phone" value={profile.phone ?? ""} onChange={(val) => updateProfile("phone", val)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                <Input id="dob" type="date" value={profile.date_of_birth ?? ""} onChange={(e) => updateProfile("date_of_birth", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <select id="gender" value={profile.gender ?? ""} onChange={(e) => updateProfile("gender", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </FieldGroup>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load profile.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving || !profile}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Profile"}
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
  onSubmit: (current: string, newPwd: string) => void
}) {
  const [current, setCurrent] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !newPwd || newPwd !== confirm) return
    setSaving(true)
    await onSubmit(current, newPwd)
    setSaving(false)
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
        <Button type="submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</Button>
      </DialogFooter>
    </form>
  )
}
