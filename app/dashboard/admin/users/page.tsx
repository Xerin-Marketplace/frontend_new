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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Eye,
  FileDown,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"
import { useRouter } from "next/navigation"

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

type SortField = "name" | "email" | "phone" | "status" | "verified" | "created"
type SortDir = "asc" | "desc"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function exportToCSV(users: AdminUser[]) {
  const headers = ["Name", "Email", "Phone", "Status", "Verified", "Created"]
  const rows = users.map((u) => [
    `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    u.email,
    u.phone ?? "",
    u.status,
    u.is_verified ? "Verified" : "Unverified",
    new Date(u.created_at).toLocaleDateString(),
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({ title: "CSV exported", description: `${users.length} users exported.`, type: "success" })
}

function exportToPDF(users: AdminUser[]) {
  const win = window.open("", "_blank")
  if (!win) {
    toast.add({ title: "Popup blocked", description: "Please allow popups to export PDF.", type: "error" })
    return
  }
  const rows = users
    .map(
      (u, i) => `<tr>
        <td>${i + 1}</td>
        <td>${u.first_name ?? ""} ${u.last_name ?? ""}</td>
        <td>${u.email}</td>
        <td>${u.phone ?? "—"}</td>
        <td>${u.status}</td>
        <td>${u.is_verified ? "✓" : "✗"}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
      </tr>`
    )
    .join("")
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Users Export — ${new Date().toLocaleDateString()}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .verified { background: #dcfce7; color: #166534; }
  .unverified { background: #fef3c7; color: #92400e; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>Users Export Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} · Total: ${users.length} users</div>
  <table>
    <thead>
      <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Verified</th><th>Created</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`)
  win.document.close()
}

export default function AdminUsersPage() {
  const router = useRouter()
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
  const [sortField, setSortField] = React.useState<SortField>("created")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [verifiedFilter, setVerifiedFilter] = React.useState<string>("")
  const pageSize = 10

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all users in batches of 100 (backend max page_size)
      const allUsers: AdminUser[] = []
      let currentPage = 1
      let totalCount = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const data = await api.get<PaginatedUsers>(`/admin/users?page=${currentPage}&page_size=100`)
        allUsers.push(...data.results)
        totalCount = data.total
        if (allUsers.length >= totalCount || data.results.length === 0) break
        currentPage++
      }
      setUsers(allUsers)
      setTotal(allUsers.length)
    } catch (err) {
      toast.add({ title: "Failed to load users", description: getApiError(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounced AJAX search (client-side)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Client-side search + sorting + filtering
  const processedUsers = React.useMemo(() => {
    let result = [...users]

    // Search (client-side)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((u) =>
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((u) => u.status === statusFilter)
    }
    // Verified filter
    if (verifiedFilter === "verified") {
      result = result.filter((u) => u.is_verified)
    } else if (verifiedFilter === "unverified") {
      result = result.filter((u) => !u.is_verified)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name":
          cmp = `${a.first_name ?? ""} ${a.last_name ?? ""}`.localeCompare(`${b.first_name ?? ""} ${b.last_name ?? ""}`)
          break
        case "email":
          cmp = a.email.localeCompare(b.email)
          break
        case "phone":
          cmp = (a.phone ?? "").localeCompare(b.phone ?? "")
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "verified":
          cmp = Number(a.is_verified) - Number(b.is_verified)
          break
        case "created":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [users, search, sortField, sortDir, statusFilter, verifiedFilter])

  const handleSort = (field: SortField, dir: SortDir) => {
    setSortField(field)
    setSortDir(dir)
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

  const filteredTotal = processedUsers.length
  const totalPages = Math.ceil(filteredTotal / pageSize)
  const paginatedUsers = processedUsers.slice((page - 1) * pageSize, page * pageSize)

  if (loading && users.length === 0) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={7} /></Card>
      </PageSkeleton>
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 text-muted-foreground/50" />
    return sortDir === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
  }

  const SortMenu = ({ field, label }: { field: SortField; label: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            {label} <SortIcon field={field} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>Sort {label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSort(field, "asc")}>
          <ArrowUp className="size-3.5" /> A to Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort(field, "desc")}>
          <ArrowDown className="size-3.5" /> Z to A
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">Manage all platform users ({total} total).</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <FileDown className="size-4" /> Export
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Export {filteredTotal} users</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportToCSV(processedUsers)}>
                <FileDown className="size-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(processedUsers)}>
                <FileText className="size-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" /> All Users
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className={statusFilter ? "border-primary" : ""}>
                      <Filter className="size-3.5" /> {statusFilter || "Status"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending_verification")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspended</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Verified filter */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className={verifiedFilter ? "border-primary" : ""}>
                      <Filter className="size-3.5" /> {verifiedFilter || "Verified"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Filter by Verification</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setVerifiedFilter("")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVerifiedFilter("verified")}>Verified</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVerifiedFilter("unverified")}>Unverified</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AJAX Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortMenu field="name" label="Name" /></TableHead>
                <TableHead><SortMenu field="email" label="Email" /></TableHead>
                <TableHead><SortMenu field="phone" label="Phone" /></TableHead>
                <TableHead><SortMenu field="status" label="Status" /></TableHead>
                <TableHead><SortMenu field="verified" label="Verified" /></TableHead>
                <TableHead><SortMenu field="created" label="Created" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => (
                  <TableRow key={u.id} className="transition-colors hover:bg-muted/30">
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
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}>
                          <Eye className="size-4" />
                        </Button>
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
                Page {page} of {totalPages} · {filteredTotal} of {total} users
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="size-4" />
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
