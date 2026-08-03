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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/toast"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Save,
  Search,
  AlertCircle,
} from "lucide-react"

type Role = {
  id: string
  name: string
  description: string | null
}

type Permission = {
  id: string
  code: string
  name: string
  description: string | null
}

type RolePermissionsResponse = {
  role_id: string
  role_name: string
  permission_codes: string[]
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function RolesPermissionsPage() {
  const { isSuperAdmin } = useAuth()
  const [roles, setRoles] = React.useState<Role[]>([])
  const [permissions, setPermissions] = React.useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = React.useState<string[]>([])
  const [originalPermissions, setOriginalPermissions] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      api.get<Role[]>("/admin/roles"),
      api.get<Permission[]>("/admin/permissions"),
    ])
      .then(([r, p]) => {
        setRoles(r)
        setPermissions(p)
        if (r.length > 0) {
          setSelectedRoleId(r[0].id)
        }
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load roles & permissions",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (!selectedRoleId) return
    api.get<RolePermissionsResponse>(`/admin/roles/${selectedRoleId}/permissions`)
      .then((res) => {
        setRolePermissions(res.permission_codes)
        setOriginalPermissions(res.permission_codes)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load role permissions",
          description: getApiError(err),
          type: "error",
        })
      })
  }, [selectedRoleId])

  const togglePermission = (code: string) => {
    setRolePermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const hasChanges = React.useMemo(() => {
    const sorted = (arr: string[]) => [...arr].sort().join(",")
    return sorted(rolePermissions) !== sorted(originalPermissions)
  }, [rolePermissions, originalPermissions])

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await api.put(`/admin/roles/${selectedRoleId}/permissions`, {
        permission_codes: rolePermissions,
      })
      setOriginalPermissions([...rolePermissions])
      toast.add({
        title: "Permissions updated",
        description: "Role permissions have been saved successfully.",
        type: "success",
      })
      setDialogOpen(false)
    } catch (err) {
      toast.add({
        title: "Failed to save",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredPermissions = React.useMemo(() => {
    if (!search) return permissions
    const q = search.toLowerCase()
    return permissions.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    )
  }, [permissions, search])

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <AlertCircle className="size-10 text-amber-500" />
        <h2 className="text-lg font-semibold">Super Admin Only</h2>
        <p className="text-sm text-muted-foreground">
          You need super admin privileges to access this page.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Manage roles and their assigned permissions.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId
          const icon = role.name === "super_admin" ? ShieldCheck : role.name === "admin" ? Shield : KeyRound
          const Icon = icon
          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-muted-foreground/30"}`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">{role.name.replace("_", " ")}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {role.description || `Role: ${role.name}`}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Permissions Table */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="size-4" />
                  Permissions for <span className="capitalize">{selectedRole.name.replace("_", " ")}</span>
                </CardTitle>
                <CardDescription>
                  {rolePermissions.length} of {permissions.length} permissions assigned
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    className="pl-9 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasChanges && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger render={
                      <Button className="gap-2">
                        <Save className="size-4" />
                        Save Changes
                      </Button>
                    } />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Permission Changes</DialogTitle>
                        <DialogDescription>
                          You are about to update permissions for the{" "}
                          <span className="font-semibold capitalize">{selectedRole.name.replace("_", " ")}</span> role.
                          This will affect all users with this role.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} loading={saving}>
                          {saving ? "Saving..." : "Confirm Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Assigned</TableHead>
                  <TableHead>Permission Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <Checkbox
                        checked={rolePermissions.includes(perm.code)}
                        onCheckedChange={() => togglePermission(perm.code)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{perm.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{perm.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{perm.description}</TableCell>
                  </TableRow>
                ))}
                {filteredPermissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No permissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
