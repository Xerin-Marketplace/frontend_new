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
import { Switch } from "@/components/ui/switch"
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
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"
import {
  ShieldCheck,
  UserPlus,
  Search,
  Mail,
  Phone,
  AlertCircle,
  FileDown,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

type PaginatedAdmins = {
  total: number
  page: number
  page_size: number
  results: AdminUser[]
}

type PermissionItem = {
  id: string
  code: string
  name: string
  description: string | null
}

type UserPermissionsResponse = {
  user_id: string
  permissions: string[]
}

type SortField = "name" | "email" | "phone" | "status" | "verified" | "created"
type SortDir = "asc" | "desc"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function exportToCSV(admins: AdminUser[]) {
  const headers = ["Name", "Email", "Phone", "Status", "Verified", "Created"]
  const rows = admins.map((u) => [
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
  link.download = `admins-export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({ title: "CSV exported", description: `${admins.length} admins exported.`, type: "success" })
}

function exportToPDF(admins: AdminUser[]) {
  const win = window.open("", "_blank")
  if (!win) {
    toast.add({ title: "Popup blocked", description: "Please allow popups to export PDF.", type: "error" })
    return
  }
  const rows = admins
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
<title>Admins Export — ${new Date().toLocaleDateString()}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>Admins Export Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} · Total: ${admins.length} admins</div>
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

export default function AdminManagementPage() {
  const { isSuperAdmin } = useAuth()
  const [admins, setAdmins] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [sortField, setSortField] = React.useState<SortField>("created")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [verifiedFilter, setVerifiedFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editAdmin, setEditAdmin] = React.useState<AdminUser | null>(null)
  const [deleteAdmin, setDeleteAdmin] = React.useState<AdminUser | null>(null)
  const [permsAdmin, setPermsAdmin] = React.useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const [allPermissions, setAllPermissions] = React.useState<PermissionItem[]>([])
  const [userPerms, setUserPerms] = React.useState<string[]>([])
  const [permsLoading, setPermsLoading] = React.useState(false)
  const [permsSearch, setPermsSearch] = React.useState("")

  const loadAdmins = React.useCallback(async () => {
    setLoading(true)
    try {
      const allUsers: AdminUser[] = []
      let currentPage = 1
      let totalCount = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const data = await api.get<PaginatedAdmins>(`/admin/users?page=${currentPage}&page_size=100`)
        allUsers.push(...data.results)
        totalCount = data.total
        if (allUsers.length >= totalCount || data.results.length === 0) break
        currentPage++
      }
      setAdmins(allUsers)
    } catch (err) {
      toast.add({ title: "Failed to load admins", description: getApiError(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadAdmins() }, [loadAdmins])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const processedAdmins = React.useMemo(() => {
    let result = [...admins]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((a) =>
        `${a.first_name ?? ""} ${a.last_name ?? ""}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone ?? "").toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter)
    }

    if (verifiedFilter === "verified") {
      result = result.filter((a) => a.is_verified)
    } else if (verifiedFilter === "unverified") {
      result = result.filter((a) => !a.is_verified)
    }

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
  }, [admins, search, statusFilter, verifiedFilter, sortField, sortDir])

  const filteredTotal = processedAdmins.length
  const totalPages = Math.ceil(filteredTotal / pageSize)
  const paginatedAdmins = processedAdmins.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (field: SortField, dir: SortDir) => {
    setSortField(field)
    setSortDir(dir)
  }

  const handleCreate = async (data: { first_name: string; last_name: string; email: string; phone: string; password: string }) => {
    setActionLoading(true)
    try {
      await api.post("/admin/admins", {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
      })
      setCreateOpen(false)
      toast.add({ title: "Admin created!", description: `${data.first_name} ${data.last_name} has been added.`, type: "success" })
      loadAdmins()
    } catch (err) {
      toast.add({ title: "Failed to create admin", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (data: { first_name: string; last_name: string; email: string; phone: string; status: string; is_verified: boolean }) => {
    if (!editAdmin) return
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${editAdmin.id}`, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        status: data.status,
        is_verified: data.is_verified,
      })
      setEditAdmin(null)
      toast.add({ title: "Admin updated!", description: "Admin information has been updated.", type: "success" })
      loadAdmins()
    } catch (err) {
      toast.add({ title: "Failed to update admin", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteAdmin) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/users/${deleteAdmin.id}`)
      setDeleteAdmin(null)
      toast.add({ title: "Admin deleted", description: "Admin has been removed.", type: "success" })
      loadAdmins()
    } catch (err) {
      toast.add({ title: "Failed to delete admin", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenPerms = async (admin: AdminUser) => {
    setPermsAdmin(admin)
    setPermsLoading(true)
    setUserPerms([])
    setPermsSearch("")
    try {
      const [perms, userPermsData] = await Promise.all([
        allPermissions.length > 0 ? Promise.resolve(allPermissions) : api.get<PermissionItem[]>("/admin/permissions"),
        api.get<UserPermissionsResponse>(`/admin/users/${admin.id}/permissions`),
      ])
      if (allPermissions.length === 0) setAllPermissions(perms)
      setUserPerms(userPermsData.permissions)
    } catch (err) {
      toast.add({ title: "Failed to load permissions", description: getApiError(err), type: "error" })
    } finally {
      setPermsLoading(false)
    }
  }

  const handleTogglePerm = async (code: string, checked: boolean) => {
    if (!permsAdmin) return
    try {
      if (checked) {
        await api.post(`/admin/users/${permsAdmin.id}/permissions`, {
          permission_codes: [...userPerms, code],
        })
        setUserPerms((prev) => [...prev, code])
      } else {
        await api.delete(`/admin/users/${permsAdmin.id}/permissions/${code}`)
        setUserPerms((prev) => prev.filter((p) => p !== code))
      }
    } catch (err) {
      toast.add({ title: "Failed to update permission", description: getApiError(err), type: "error" })
    }
  }

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

  if (loading && admins.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage admin accounts ({admins.length} total).</p>
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
              <DropdownMenuLabel>Export {filteredTotal} admins</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportToCSV(processedAdmins)}>
                <FileDown className="size-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(processedAdmins)}>
                <FileText className="size-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" /> Add Admin
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{admins.filter((a) => a.status === "active").length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            <ShieldCheck className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{admins.filter((a) => a.is_verified).length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Verified accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
            <XCircle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{admins.filter((a) => a.status === "suspended").length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Suspended accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4" /> All Users
            </CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className={statusFilter ? "border-primary" : ""}>
                      <Filter className="size-3.5" /> {statusFilter || "Status"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setStatusFilter(""); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">All <Badge variant="secondary" className="text-xs">{admins.length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("active"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Active <Badge variant="default" className="text-xs">{admins.filter((a) => a.status === "active").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("pending_verification"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Pending <Badge variant="secondary" className="text-xs">{admins.filter((a) => a.status === "pending_verification").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("suspended"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Suspended <Badge variant="destructive" className="text-xs">{admins.filter((a) => a.status === "suspended").length}</Badge></span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  <DropdownMenuItem onClick={() => { setVerifiedFilter(""); setPage(1) }}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setVerifiedFilter("verified"); setPage(1) }}>Verified</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setVerifiedFilter("unverified"); setPage(1) }}>Unverified</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
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
              {paginatedAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No admins found.</TableCell>
                </TableRow>
              ) : (
                paginatedAdmins.map((admin) => (
                  <TableRow key={admin.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {(admin.first_name ?? "?").charAt(0).toUpperCase()}{(admin.last_name ?? "").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{admin.first_name ?? ""} {admin.last_name ?? ""}</div>
                          <div className="text-xs text-muted-foreground">{admin.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell className="text-xs">{admin.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={admin.status === "active" ? "default" : admin.status === "suspended" ? "destructive" : "secondary"}>
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_verified ? "default" : "secondary"}>
                        {admin.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Permissions" onClick={() => handleOpenPerms(admin)}>
                          <KeyRound className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Edit" disabled={actionLoading} onClick={() => setEditAdmin(admin)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Delete" disabled={actionLoading} onClick={() => setDeleteAdmin(admin)} className="text-red-500">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filteredTotal} of {admins.length} users
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

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <AdminForm onSubmit={handleCreate} actionLoading={actionLoading} />
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {editAdmin && <AdminForm admin={editAdmin} onSubmit={handleEdit} actionLoading={actionLoading} />}
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={!!deleteAdmin} onOpenChange={(open) => !open && setDeleteAdmin(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete User?</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteAdmin?.first_name} {deleteAdmin?.last_name}</strong> ({deleteAdmin?.email})? This action cannot be undone.
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

      {/* Permissions Dialog */}
      <Dialog open={!!permsAdmin} onOpenChange={(open) => !open && setPermsAdmin(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4" /> Permissions — {permsAdmin?.first_name} {permsAdmin?.last_name}
            </DialogTitle>
            <DialogDescription>Toggle individual permissions for this user. Changes are saved instantly.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={permsSearch}
                onChange={(e) => setPermsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {permsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading permissions...</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border">
                {allPermissions
                  .filter((p) => !permsSearch || p.code.toLowerCase().includes(permsSearch.toLowerCase()) || p.name.toLowerCase().includes(permsSearch.toLowerCase()))
                  .map((perm) => {
                    const enabled = userPerms.includes(perm.code)
                    return (
                      <div
                        key={perm.id}
                        className={cn(
                          "flex items-center justify-between border-b px-4 py-3 transition-colors last:border-0",
                          enabled ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{perm.name}</span>
                            {enabled && <Badge variant="default" className="text-xs">Active</Badge>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground font-mono">{perm.code}</div>
                          {perm.description && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{perm.description}</div>
                          )}
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => handleTogglePerm(perm.code, !enabled)}
                        />
                      </div>
                    )
                  })}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{userPerms.length} of {allPermissions.length} permissions granted</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminForm({
  admin,
  onSubmit,
  actionLoading,
}: {
  admin?: AdminUser
  onSubmit: (data: { first_name: string; last_name: string; email: string; phone: string; password: string; status: string; is_verified: boolean }) => void
  actionLoading: boolean
}) {
  const [firstName, setFirstName] = React.useState(admin?.first_name ?? "")
  const [lastName, setLastName] = React.useState(admin?.last_name ?? "")
  const [email, setEmail] = React.useState(admin?.email ?? "")
  const [phone, setPhone] = React.useState(admin?.phone ?? "")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState(admin?.status ?? "active")
  const [isVerified, setIsVerified] = React.useState(admin?.is_verified ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return
    if (!admin && !password.trim()) return
    onSubmit({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), phone: phone.trim(), password, status, is_verified: isVerified })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{admin ? "Edit User" : "Create New Admin"}</DialogTitle>
        <DialogDescription>{admin ? "Update user information." : "Add a new admin account with platform access."}</DialogDescription>
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
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" type="tel" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255..." />
          </div>
        </Field>
        {!admin && (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} placeholder="Min 10 characters" />
            </div>
            <FieldDescription>At least 10 characters</FieldDescription>
          </Field>
        )}
        {admin && (
          <>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">Active</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Verified</div>
                <div className="text-xs text-muted-foreground">Mark user as email-verified</div>
              </div>
              <Switch checked={isVerified} onCheckedChange={setIsVerified} />
            </div>
          </>
        )}
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? "Saving..." : admin ? "Save Changes" : "Create Admin"}
        </Button>
      </DialogFooter>
    </form>
  )
}
