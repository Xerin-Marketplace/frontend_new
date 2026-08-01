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
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type AdminUser = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  status: string
  is_verified: boolean
  created_at: string
}

type PaginatedUsers = {
  total: number
  page: number
  page_size: number
  results: AdminUser[]
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editUser, setEditUser] = React.useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = React.useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)
  const pageSize = 10

  const fetchUsers = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (search) params.set("search", search)
    api.get<PaginatedUsers>(`/admin/users?${params}`)
      .then((data) => {
        setUsers(data.results)
        setTotal(data.total)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load users", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [page, search])

  React.useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleCreate = async (data: { first_name: string; last_name: string; email: string; phone: string; password: string }) => {
    setActionLoading(true)
    try {
      await api.post("/admin/users", {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
      })
      setCreateOpen(false)
      toast.add({ title: "User created!", description: `${data.first_name} ${data.last_name} has been added.`, type: "success" })
      fetchUsers()
    } catch (err) {
      toast.add({ title: "Failed to create user", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (data: { first_name: string; last_name: string; email: string; phone: string }) => {
    if (!editUser) return
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${editUser.id}`, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
      })
      setEditUser(null)
      toast.add({ title: "User updated!", description: "User information has been updated.", type: "success" })
      fetchUsers()
    } catch (err) {
      toast.add({ title: "Failed to update user", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/users/${deleteUser.id}`)
      setDeleteUser(null)
      toast.add({ title: "User deleted", description: "User has been removed.", type: "success" })
      fetchUsers()
    } catch (err) {
      toast.add({ title: "Failed to delete user", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && users.length === 0) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">Manage all platform users ({total} total).</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" /> All Users
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.first_name ?? ""} {u.last_name ?? ""}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "default" : "outline"}>{u.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_verified ? "default" : "secondary"}>
                        {u.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setEditUser(u)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setDeleteUser(u)} className="text-red-500">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages || loading} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <UserForm onSubmit={handleCreate} actionLoading={actionLoading} />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {editUser && <UserForm user={editUser} onSubmit={handleEdit} actionLoading={actionLoading} />}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete User?</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteUser?.first_name} {deleteUser?.last_name}</strong> ({deleteUser?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={handleDelete}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserForm({
  user,
  onSubmit,
  actionLoading,
}: {
  user?: AdminUser
  onSubmit: (data: { first_name: string; last_name: string; email: string; phone: string; password: string }) => void
  actionLoading: boolean
}) {
  const [firstName, setFirstName] = React.useState(user?.first_name ?? "")
  const [lastName, setLastName] = React.useState(user?.last_name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [phone, setPhone] = React.useState(user?.phone ?? "")
  const [password, setPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return
    if (!user && !password.trim()) return
    onSubmit({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), phone: phone.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
        <DialogDescription>{user ? "Update user information." : "Create a new platform user."}</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255..." />
        </Field>
        {!user && (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <FieldDescription>At least 8 characters</FieldDescription>
          </Field>
        )}
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? "Saving..." : user ? "Save Changes" : "Create User"}
        </Button>
      </DialogFooter>
    </form>
  )
}
