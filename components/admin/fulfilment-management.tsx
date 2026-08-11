"use client"

import * as React from "react"
import {
  Warehouse,
  PackageCheck,
  ClipboardList,
  Boxes,
  Plus,
  Search,
  MapPin,
  Building2,
  Truck,
  Package,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableSkeleton } from "@/components/skeletons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ──────────────────────────────────────────────────────────────────

type WarehouseT = {
  id: string
  name: string
  code: string
  country: string
  region: string
  district: string | null
  ward: string | null
  street: string | null
  latitude: number | null
  longitude: number | null
  total_capacity: number | null
  used_capacity: number | null
  status: string
  created_at: string
  updated_at: string | null
}

type InboundShipmentT = {
  id: string
  reference: string
  seller_id: string
  seller_name: string | null
  warehouse_id: string
  warehouse_name: string | null
  status: string
  expected_arrival_at: string | null
  received_at: string | null
  total_items: number
  total_quantity: number
  notes: string | null
  created_at: string
  updated_at: string | null
}

type InboundItemT = {
  id: string
  inbound_shipment_id: string
  product_id: string
  product_name: string | null
  variant_id: string | null
  expected_quantity: number
  received_quantity: number
  putaway_quantity: number
  status: string
}

type PickListT = {
  id: string
  reference: string
  warehouse_id: string
  warehouse_name: string | null
  seller_order_id: string
  status: string
  assigned_to: string | null
  total_items: number
  total_quantity: number
  created_at: string
  completed_at: string | null
}

type Tab = "overview" | "warehouses" | "inbound" | "picklists"

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

// ─── Status Badge Helpers ────────────────────────────────────────────────────

const warehouseStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  maintenance: "outline",
  decommissioned: "destructive",
}

const inboundStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  in_transit: "secondary",
  received: "default",
  putaway_in_progress: "default",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
}

const pickListStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  assigned: "secondary",
  in_progress: "secondary",
  picked: "default",
  packed: "default",
  cancelled: "destructive",
}

function StatusBadge({ status, variantMap }: { status: string; variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> }) {
  const variant = variantMap[status] ?? "outline"
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  title: string
  value: string | number
  icon: React.ElementType
  hint?: string
  tone?: "default" | "warning" | "success" | "danger"
}) {
  const toneClasses = {
    default: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-red-600 dark:text-red-400",
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`size-4 ${toneClasses[tone]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FulfilmentManagement() {
  const { isSuperAdmin, hasPermission } = useAuth()
  const canManage = isSuperAdmin || hasPermission("inventory:manage")
  const [tab, setTab] = React.useState<Tab>("overview")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fulfilment Operations</h2>
          <p className="text-sm text-muted-foreground">
            Manage Xerin fulfilment centres, inbound shipments, and pick &amp; pack operations.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview">
            <Boxes className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="size-4" /> Warehouses
          </TabsTrigger>
          <TabsTrigger value="inbound">
            <Truck className="size-4" /> Inbound
          </TabsTrigger>
          <TabsTrigger value="picklists">
            <ClipboardList className="size-4" /> Pick Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="warehouses">
          <WarehousesTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="inbound">
          <InboundTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="picklists">
          <PickListsTab canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = React.useState({
    totalWarehouses: 0,
    activeWarehouses: 0,
    pendingInbound: 0,
    inTransitInbound: 0,
    completedInbound: 0,
    pendingPickLists: 0,
    inProgressPickLists: 0,
    packedPickLists: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [warehouses, inbound, picklists] = await Promise.all([
          api.get<WarehouseT[]>("/fulfilment/warehouses").catch(() => []),
          api.get<InboundShipmentT[]>("/fulfilment/inbound").catch(() => []),
          api.get<PickListT[]>("/fulfilment/picklists").catch(() => []),
        ])
        setStats({
          totalWarehouses: warehouses.length,
          activeWarehouses: warehouses.filter((w) => w.status === "active").length,
          pendingInbound: inbound.filter((i) => i.status === "draft" || i.status === "submitted").length,
          inTransitInbound: inbound.filter((i) => i.status === "in_transit").length,
          completedInbound: inbound.filter((i) => i.status === "completed").length,
          pendingPickLists: picklists.filter((p) => p.status === "pending").length,
          inProgressPickLists: picklists.filter((p) => p.status === "in_progress" || p.status === "assigned").length,
          packedPickLists: picklists.filter((p) => p.status === "picked" || p.status === "packed").length,
        })
      } catch {
        // API may not be ready yet — show zeros
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Warehouses" value={stats.totalWarehouses} icon={Warehouse} hint={`${stats.activeWarehouses} active`} tone="default" />
        <StatCard title="Pending Inbound" value={stats.pendingInbound} icon={Clock} hint="Awaiting processing" tone="warning" />
        <StatCard title="In Transit" value={stats.inTransitInbound} icon={Truck} hint="Shipments on the way" tone="default" />
        <StatCard title="Completed Inbound" value={stats.completedInbound} icon={CheckCircle2} hint="Fully received" tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Pick Lists" value={stats.pendingPickLists} icon={ClipboardList} hint="Not yet assigned" tone="warning" />
        <StatCard title="In Progress Picks" value={stats.inProgressPickLists} icon={Package} hint="Being picked" tone="default" />
        <StatCard title="Packed & Ready" value={stats.packedPickLists} icon={PackageCheck} hint="Ready for dispatch" tone="success" />
        <StatCard title="Active Warehouses" value={stats.activeWarehouses} icon={Building2} hint="Operational" tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" /> Fulfilment Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Package className="size-4" /> Fulfilled by Seller (FBS)
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sellers manage their own stock and fulfilment. Products ship directly from seller locations to customers.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Warehouse className="size-4" /> Fulfilled by Xerin (FBX)
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sellers send stock to Xerin fulfilment centres. Xerin handles storage, pick &amp; pack, delivery, and returns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Warehouses Tab ──────────────────────────────────────────────────────────

function WarehousesTab({ canManage }: { canManage: boolean }) {
  const [warehouses, setWarehouses] = React.useState<WarehouseT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialog, setDialog] = React.useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = React.useState<WarehouseT | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<WarehouseT[]>("/fulfilment/warehouses")
      setWarehouses(data)
    } catch (error) {
      toast.add({ title: "Unable to load warehouses", description: message(error), type: "error" })
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-sm flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search warehouses..."
              className="pl-9"
            />
          </div>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setDialog("create") }}>
            <Plus className="size-4" /> Add Warehouse
          </Button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Warehouse}
              title="No warehouses found"
              description={search ? "Try adjusting your search." : "Create your first fulfilment centre to get started."}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => {
                  const usedPct = w.total_capacity && w.total_capacity > 0
                    ? Math.round(((w.used_capacity ?? 0) / w.total_capacity) * 100)
                    : null
                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="font-semibold">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{w.code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="size-3 text-muted-foreground" />
                          {w.country}, {w.region}
                          {w.district && `, ${w.district}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {usedPct !== null ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{w.used_capacity ?? 0} / {w.total_capacity}</span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={w.status} variantMap={warehouseStatusVariant} />
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(w); setDialog("edit") }}>
                                <Eye className="size-4" /> Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <WarehouseDialog
        mode={dialog}
        open={dialog !== null}
        warehouse={editing}
        onOpenChange={(open) => { if (!open) { setDialog(null); setEditing(null) } }}
        onSaved={() => { void load() }}
      />
    </div>
  )
}

// ─── Warehouse Dialog ────────────────────────────────────────────────────────

function WarehouseDialog({
  mode,
  open,
  warehouse,
  onOpenChange,
  onSaved,
}: {
  mode: "create" | "edit" | null
  open: boolean
  warehouse: WarehouseT | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = React.useState({
    name: "",
    code: "",
    country: "Tanzania",
    region: "",
    district: "",
    ward: "",
    street: "",
    latitude: "",
    longitude: "",
    total_capacity: "",
    status: "active",
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (warehouse) {
      setForm({
        name: warehouse.name,
        code: warehouse.code,
        country: warehouse.country,
        region: warehouse.region,
        district: warehouse.district ?? "",
        ward: warehouse.ward ?? "",
        street: warehouse.street ?? "",
        latitude: warehouse.latitude?.toString() ?? "",
        longitude: warehouse.longitude?.toString() ?? "",
        total_capacity: warehouse.total_capacity?.toString() ?? "",
        status: warehouse.status,
      })
    } else {
      setForm({
        name: "",
        code: "",
        country: "Tanzania",
        region: "",
        district: "",
        ward: "",
        street: "",
        latitude: "",
        longitude: "",
        total_capacity: "",
        status: "active",
      })
    }
  }, [mode, warehouse])

  const set = (name: keyof typeof form, value: string) =>
    setForm((c) => ({ ...c, [name]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode) return
    setSaving(true)
    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      country: form.country,
      region: form.region,
      district: form.district || null,
      ward: form.ward || null,
      street: form.street || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      total_capacity: form.total_capacity ? parseInt(form.total_capacity) : null,
      status: form.status,
    }
    try {
      if (mode === "create") {
        await api.post("/fulfilment/warehouses", payload)
        toast.add({ title: "Warehouse created", type: "success" })
      } else {
        await api.put(`/fulfilment/warehouses/${warehouse?.id}`, payload)
        toast.add({ title: "Warehouse updated", type: "success" })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast.add({ title: "Unable to save warehouse", description: message(error), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create Warehouse" : "Edit Warehouse"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new Xerin fulfilment centre."
                : "Update warehouse details."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dar es Salaam FC" />
              </Field>
              <Field>
                <FieldLabel>Code</FieldLabel>
                <Input required value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="DAR-01" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Country</FieldLabel>
                <Input required value={form.country} onChange={(e) => set("country", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Input required value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Dar es Salaam" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>District</FieldLabel>
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Ward</FieldLabel>
                <Input value={form.ward} onChange={(e) => set("ward", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Street Address</FieldLabel>
              <Input value={form.street} onChange={(e) => set("street", e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Latitude</FieldLabel>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="-6.823" />
              </Field>
              <Field>
                <FieldLabel>Longitude</FieldLabel>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="39.269" />
              </Field>
              <Field>
                <FieldLabel>Capacity (units)</FieldLabel>
                <Input type="number" min="0" value={form.total_capacity} onChange={(e) => set("total_capacity", e.target.value)} placeholder="50000" />
              </Field>
            </div>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={form.status} onValueChange={(v) => set("status", v ?? "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inbound Tab ─────────────────────────────────────────────────────────────

function InboundTab({ canManage }: { canManage: boolean }) {
  const [shipments, setShipments] = React.useState<InboundShipmentT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [dialog, setDialog] = React.useState<"create" | null>(null)
  const [detailItem, setDetailItem] = React.useState<InboundShipmentT | null>(null)
  const [detailItems, setDetailItems] = React.useState<InboundItemT[]>([])
  const [detailLoading, setDetailLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<InboundShipmentT[]>("/fulfilment/inbound")
      setShipments(data)
    } catch (error) {
      toast.add({ title: "Unable to load inbound shipments", description: message(error), type: "error" })
      setShipments([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      s.reference.toLowerCase().includes(search.toLowerCase()) ||
      (s.seller_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.warehouse_name ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const viewDetail = async (shipment: InboundShipmentT) => {
    setDetailItem(shipment)
    setDetailLoading(true)
    try {
      const items = await api.get<InboundItemT[]>(`/fulfilment/inbound/${shipment.id}/items`)
      setDetailItems(items)
    } catch (error) {
      toast.add({ title: "Unable to load items", description: message(error), type: "error" })
      setDetailItems([])
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inbound..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button onClick={() => setDialog("create")}>
            <Plus className="size-4" /> New Inbound
          </Button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Truck}
              title="No inbound shipments"
              description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create an inbound shipment to receive seller stock."}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.reference}</TableCell>
                    <TableCell className="text-sm">{s.seller_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{s.warehouse_name ?? "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{s.total_items}</span>
                      <span className="text-xs text-muted-foreground"> items / {s.total_quantity} units</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} variantMap={inboundStatusVariant} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.expected_arrival_at ? new Date(s.expected_arrival_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => void viewDetail(s)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InboundDialog
        open={dialog !== null}
        onOpenChange={(open) => { if (!open) setDialog(null) }}
        onSaved={() => { void load() }}
      />

      {/* Detail Dialog */}
      <Dialog open={detailItem !== null} onOpenChange={(open) => { if (!open) { setDetailItem(null); setDetailItems([]) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inbound Shipment Detail</DialogTitle>
            <DialogDescription>
              {detailItem?.reference} — {detailItem?.seller_name ?? "Unknown seller"}
            </DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">Warehouse</div>
                  <div className="text-sm font-medium">{detailItem.warehouse_name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1"><StatusBadge status={detailItem.status} variantMap={inboundStatusVariant} /></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expected Arrival</div>
                  <div className="text-sm font-medium">{detailItem.expected_arrival_at ? new Date(detailItem.expected_arrival_at).toLocaleDateString() : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Received At</div>
                  <div className="text-sm font-medium">{detailItem.received_at ? new Date(detailItem.received_at).toLocaleDateString() : "—"}</div>
                </div>
              </div>
              {detailLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading items...</div>
              ) : detailItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No items in this shipment.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Put Away</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product_name ?? item.product_id}</TableCell>
                        <TableCell className="text-sm">{item.expected_quantity}</TableCell>
                        <TableCell className="text-sm">{item.received_quantity}</TableCell>
                        <TableCell className="text-sm">{item.putaway_quantity}</TableCell>
                        <TableCell><StatusBadge status={item.status} variantMap={inboundStatusVariant} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Inbound Dialog ──────────────────────────────────────────────────────────

function InboundDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [warehouses, setWarehouses] = React.useState<WarehouseT[]>([])
  const [form, setForm] = React.useState({
    seller_id: "",
    warehouse_id: "",
    expected_arrival_at: "",
    notes: "",
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      api.get<WarehouseT[]>("/fulfilment/warehouses")
        .then(setWarehouses)
        .catch(() => setWarehouses([]))
    }
  }, [open])

  const set = (name: keyof typeof form, value: string) =>
    setForm((c) => ({ ...c, [name]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      seller_id: form.seller_id,
      warehouse_id: form.warehouse_id,
      expected_arrival_at: form.expected_arrival_at || null,
      notes: form.notes || null,
    }
    try {
      await api.post("/fulfilment/inbound", payload)
      toast.add({ title: "Inbound shipment created", type: "success" })
      onSaved()
      onOpenChange(false)
      setForm({ seller_id: "", warehouse_id: "", expected_arrival_at: "", notes: "" })
    } catch (error) {
      toast.add({ title: "Unable to create inbound shipment", description: message(error), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New Inbound Shipment</DialogTitle>
            <DialogDescription>Receive seller stock at a Xerin fulfilment centre.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Seller ID</FieldLabel>
              <Input required value={form.seller_id} onChange={(e) => set("seller_id", e.target.value)} placeholder="Seller UUID" />
            </Field>
            <Field>
              <FieldLabel>Destination Warehouse</FieldLabel>
              <Select value={form.warehouse_id} onValueChange={(v) => set("warehouse_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.filter((w) => w.status === "active").map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Expected Arrival Date</FieldLabel>
              <Input type="date" value={form.expected_arrival_at} onChange={(e) => set("expected_arrival_at", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional instructions..." rows={3} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Pick Lists Tab ──────────────────────────────────────────────────────────

function PickListsTab({ canManage }: { canManage: boolean }) {
  const [pickLists, setPickLists] = React.useState<PickListT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<PickListT[]>("/fulfilment/picklists")
      setPickLists(data)
    } catch (error) {
      toast.add({ title: "Unable to load pick lists", description: message(error), type: "error" })
      setPickLists([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const filtered = pickLists.filter((p) => {
    const matchesSearch =
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      (p.warehouse_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.assigned_to ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const advanceStatus = async (pickList: PickListT, newStatus: string) => {
    try {
      await api.patch(`/fulfilment/picklists/${pickList.id}/status`, { status: newStatus })
      toast.add({ title: `Pick list ${newStatus}`, type: "success" })
      void load()
    } catch (error) {
      toast.add({ title: "Unable to update status", description: message(error), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pick lists..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="picked">Picked</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No pick lists"
              description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Pick lists are generated automatically from FBX orders."}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {canManage && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.reference}</TableCell>
                    <TableCell className="text-sm">{p.warehouse_name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.seller_order_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{p.total_items}</span>
                      <span className="text-xs text-muted-foreground"> / {p.total_quantity} units</span>
                    </TableCell>
                    <TableCell className="text-sm">{p.assigned_to ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} variantMap={pickListStatusVariant} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status === "pending" && (
                              <DropdownMenuItem onClick={() => void advanceStatus(p, "assigned")}>
                                <ArrowUpDown className="size-4" /> Mark Assigned
                              </DropdownMenuItem>
                            )}
                            {p.status === "assigned" && (
                              <DropdownMenuItem onClick={() => void advanceStatus(p, "in_progress")}>
                                <ArrowUpDown className="size-4" /> Start Picking
                              </DropdownMenuItem>
                            )}
                            {p.status === "in_progress" && (
                              <DropdownMenuItem onClick={() => void advanceStatus(p, "picked")}>
                                <CheckCircle2 className="size-4" /> Mark Picked
                              </DropdownMenuItem>
                            )}
                            {p.status === "picked" && (
                              <DropdownMenuItem onClick={() => void advanceStatus(p, "packed")}>
                                <PackageCheck className="size-4" /> Mark Packed
                              </DropdownMenuItem>
                            )}
                            {(p.status === "pending" || p.status === "assigned") && (
                              <DropdownMenuItem onClick={() => void advanceStatus(p, "cancelled")}>
                                <XCircle className="size-4" /> Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
