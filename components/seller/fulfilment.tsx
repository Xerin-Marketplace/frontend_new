"use client"

import * as React from "react"
import {
  Warehouse,
  Truck,
  Package,
  PackageCheck,
  Plus,
  Search,
  MapPin,
  Boxes,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  ArrowRightLeft,
  Eye,
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

type WarehouseT = {
  id: string
  name: string
  code: string
  country: string
  region: string
  status: string
}

type InboundShipmentT = {
  id: string
  reference: string
  warehouse_id: string
  warehouse_name: string | null
  status: string
  expected_arrival_at: string | null
  received_at: string | null
  total_items: number
  total_quantity: number
  notes: string | null
  created_at: string
}

type FBXInventoryT = {
  id: string
  product_id: string
  product_name: string | null
  variant_id: string | null
  warehouse_id: string
  warehouse_name: string | null
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  updated_at: string | null
}

type Tab = "overview" | "inbound" | "inventory" | "transfers"

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

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

function StatusBadge({ status, variantMap }: { status: string; variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> }) {
  const variant = variantMap[status] ?? "outline"
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant={variant}>{label}</Badge>
}

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
  tone?: "default" | "warning" | "success"
}) {
  const toneClasses = {
    default: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
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

export function SellerFulfilment({ initialTab = "overview" }: { initialTab?: Tab }) {
  const [tab, setTab] = React.useState<Tab>(initialTab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fulfilment</h2>
        <p className="text-sm text-muted-foreground">
          Send stock to Xerin fulfilment centres and track your FBX inventory.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview">
            <Boxes className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="inbound">
            <Truck className="size-4" /> Inbound Shipments
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="size-4" /> FBX Inventory
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowRightLeft className="size-4" /> Stock Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SellerOverviewTab />
        </TabsContent>
        <TabsContent value="inbound">
          <SellerInboundTab />
        </TabsContent>
        <TabsContent value="inventory">
          <SellerInventoryTab />
        </TabsContent>
        <TabsContent value="transfers">
          <SellerTransfersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SellerOverviewTab() {
  const [stats, setStats] = React.useState({
    totalInbound: 0,
    inTransit: 0,
    received: 0,
    completed: 0,
    totalFbxUnits: 0,
    availableFbxUnits: 0,
    reservedFbxUnits: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.get<{
          inbound: Record<string, number>
          fbx_inventory: Record<string, number>
        }>("/fulfilment/seller/dashboard")
        setStats({
          totalInbound: data.inbound?.total ?? 0,
          inTransit: data.inbound?.in_transit ?? 0,
          received: data.inbound?.received ?? 0,
          completed: data.inbound?.completed ?? 0,
          totalFbxUnits: data.fbx_inventory?.total_units ?? 0,
          availableFbxUnits: data.fbx_inventory?.available_units ?? 0,
          reservedFbxUnits: data.fbx_inventory?.reserved_units ?? 0,
        })
      } catch {
        // API may not be ready
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
        <StatCard title="Total Inbound" value={stats.totalInbound} icon={Truck} hint="All shipments" />
        <StatCard title="In Transit" value={stats.inTransit} icon={Clock} hint="On the way to FC" tone="warning" />
        <StatCard title="Received" value={stats.received} icon={PackageCheck} hint="At fulfilment centre" tone="success" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} hint="Fully processed" tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="FBX Total Units" value={stats.totalFbxUnits} icon={Boxes} hint="In Xerin warehouses" />
        <StatCard title="Available" value={stats.availableFbxUnits} icon={Package} hint="Ready to sell" tone="success" />
        <StatCard title="Reserved" value={stats.reservedFbxUnits} icon={Clock} hint="In customer orders" tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" /> How FBX Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Package className="size-5 text-primary" />
              <span className="text-sm font-medium">1. Create Inbound</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Truck className="size-5 text-primary" />
              <span className="text-sm font-medium">2. Ship Stock</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Warehouse className="size-5 text-primary" />
              <span className="text-sm font-medium">3. Xerin Receives</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <PackageCheck className="size-5 text-primary" />
              <span className="text-sm font-medium">4. Ready to Sell</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SellerInboundTab() {
  const [shipments, setShipments] = React.useState<InboundShipmentT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialog, setDialog] = React.useState(false)

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

  const filtered = shipments.filter((s) =>
    s.reference.toLowerCase().includes(search.toLowerCase()) ||
    (s.warehouse_name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialog(true)}>
          <Plus className="size-4" /> New Inbound Shipment
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Truck}
              title="No inbound shipments"
              description={search ? "Try adjusting your search." : "Create an inbound shipment to send stock to a Xerin fulfilment centre."}
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
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.reference}</TableCell>
                    <TableCell className="text-sm">{s.warehouse_name ?? "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{s.total_items}</span>
                      <span className="text-xs text-muted-foreground"> / {s.total_quantity} units</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} variantMap={inboundStatusVariant} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.expected_arrival_at ? new Date(s.expected_arrival_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SellerInboundDialog
        open={dialog}
        onOpenChange={setDialog}
        onSaved={() => { void load() }}
      />
    </div>
  )
}

function SellerInboundDialog({
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
    warehouse_id: "",
    expected_arrival_at: "",
    notes: "",
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      api.get<WarehouseT[]>("/fulfilment/warehouses")
        .then((data) => setWarehouses(data.filter((w) => w.status === "active")))
        .catch(() => setWarehouses([]))
    }
  }, [open])

  const set = (name: keyof typeof form, value: string) =>
    setForm((c) => ({ ...c, [name]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      warehouse_id: form.warehouse_id,
      expected_arrival_at: form.expected_arrival_at || null,
      notes: form.notes || null,
    }
    try {
      await api.post("/fulfilment/inbound", payload)
      toast.add({ title: "Inbound shipment created", type: "success" })
      onSaved()
      onOpenChange(false)
      setForm({ warehouse_id: "", expected_arrival_at: "", notes: "" })
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
            <DialogDescription>Send your stock to a Xerin fulfilment centre for FBX processing.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Destination Warehouse</FieldLabel>
              <Select value={form.warehouse_id} onValueChange={(v) => set("warehouse_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code}) — {w.country}, {w.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {warehouses.length === 0 && (
                <p className="text-xs text-muted-foreground">No active warehouses available. Please check back later.</p>
              )}
            </Field>
            <Field>
              <FieldLabel>Expected Arrival Date</FieldLabel>
              <Input type="date" value={form.expected_arrival_at} onChange={(e) => set("expected_arrival_at", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Product list, special handling instructions..." rows={3} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button disabled={saving || !form.warehouse_id}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SellerInventoryTab() {
  const [inventory, setInventory] = React.useState<FBXInventoryT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<FBXInventoryT[]>("/fulfilment/inventory")
      setInventory(data)
    } catch (error) {
      toast.add({ title: "Unable to load FBX inventory", description: message(error), type: "error" })
      setInventory([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const filtered = inventory.filter((i) =>
    (i.product_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (i.warehouse_name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FBX inventory..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Boxes}
              title="No FBX inventory"
              description={search ? "Try adjusting your search." : "Your stock at Xerin fulfilment centres will appear here once you create inbound shipments."}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const isLowStock = i.available_quantity <= i.low_stock_threshold
                  const isOutOfStock = i.available_quantity === 0
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="text-sm font-medium">{i.product_name ?? i.product_id}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          {i.warehouse_name ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{i.quantity}</TableCell>
                      <TableCell className="text-sm font-medium">{i.available_quantity}</TableCell>
                      <TableCell className="text-sm">{i.reserved_quantity}</TableCell>
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline">Low Stock</Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
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
    </div>
  )
}

// ─── Stock Transfers Tab ──────────────────────────────────────────────────────

type StockTransferT = {
  id: string
  reference: string
  warehouse_id: string
  warehouse_name: string | null
  status: string
  origin_address: string | null
  expected_arrival_at: string | null
  received_at: string | null
  notes: string | null
  rejection_reason: string | null
  created_at: string
  items: { id: string; product_id: string; expected_quantity: number; received_quantity: number; product_name: string | null }[]
}

const transferStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  requested: "secondary",
  approved: "secondary",
  in_transit: "secondary",
  received: "default",
  rejected: "destructive",
  cancelled: "destructive",
}

function SellerTransfersTab() {
  const [transfers, setTransfers] = React.useState<StockTransferT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [viewTransfer, setViewTransfer] = React.useState<StockTransferT | null>(null)
  const [warehouses, setWarehouses] = React.useState<WarehouseT[]>([])
  const [products, setProducts] = React.useState<{ id: string; name: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const data = await api.get<{ results: StockTransferT[]; total: number }>(`/logistics/stock-transfers?${params}`)
      setTransfers(data.results)
    } catch (err) {
      toast.add({ title: "Failed to load stock transfers", description: message(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    load()
    api.get<WarehouseT[]>("/fulfilment/warehouses").then(setWarehouses).catch(() => {})
    api.get<{ results: { id: string; name: string }[] }>("/products/seller").then((d) => setProducts(d.results)).catch(() => {})
  }, [load])

  const filtered = transfers.filter((t) =>
    !search || t.reference.toLowerCase().includes(search.toLowerCase()) || (t.warehouse_name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search transfers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New Transfer</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ArrowRightLeft className="size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium">No stock transfers found</p>
              <p className="text-xs text-muted-foreground">Request to transfer stock from your store to a Xerin warehouse.</p>
            </div>
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
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.reference}</TableCell>
                    <TableCell className="text-sm">{t.warehouse_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.items.length} item(s)</TableCell>
                    <TableCell><Badge variant={transferStatusVariant[t.status] ?? "outline"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.expected_arrival_at ? new Date(t.expected_arrival_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewTransfer(t)}><Eye className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {dialogOpen && (
        <TransferDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          warehouses={warehouses}
          products={products}
          onSaved={load}
        />
      )}

      {viewTransfer && (
        <Dialog open={!!viewTransfer} onOpenChange={(o) => !o && setViewTransfer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transfer Details</DialogTitle>
              <DialogDescription>{viewTransfer.reference}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-muted-foreground">Warehouse</div><div className="font-medium">{viewTransfer.warehouse_name ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><div className="font-medium"><Badge variant={transferStatusVariant[viewTransfer.status] ?? "outline"}>{viewTransfer.status}</Badge></div></div>
                <div><div className="text-xs text-muted-foreground">Origin Address</div><div className="font-medium">{viewTransfer.origin_address ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">Expected Arrival</div><div className="font-medium">{viewTransfer.expected_arrival_at ? new Date(viewTransfer.expected_arrival_at).toLocaleDateString() : "—"}</div></div>
                {viewTransfer.rejection_reason && <div className="col-span-2"><div className="text-xs text-muted-foreground">Rejection Reason</div><div className="font-medium text-red-600">{viewTransfer.rejection_reason}</div></div>}
                {viewTransfer.notes && <div className="col-span-2"><div className="text-xs text-muted-foreground">Notes</div><div className="font-medium">{viewTransfer.notes}</div></div>}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Items</p>
                <div className="space-y-2">
                  {viewTransfer.items.map((item) => (
                    <div key={item.id} className="flex justify-between rounded-lg border p-2 text-sm">
                      <span>{item.product_name ?? item.product_id.slice(0, 8)}</span>
                      <span className="text-muted-foreground">{item.received_quantity}/{item.expected_quantity} received</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function TransferDialog({
  open,
  onOpenChange,
  warehouses,
  products,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  warehouses: WarehouseT[]
  products: { id: string; name: string }[]
  onSaved: () => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [warehouseId, setWarehouseId] = React.useState("")
  const [originAddress, setOriginAddress] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [lineItems, setLineItems] = React.useState<{ product_id: string; expected_quantity: string }[]>([{ product_id: "", expected_quantity: "1" }])

  const addLine = () => setLineItems((c) => [...c, { product_id: "", expected_quantity: "1" }])
  const removeLine = (i: number) => setLineItems((c) => c.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: "product_id" | "expected_quantity", value: string) =>
    setLineItems((c) => c.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouseId) {
      toast.add({ title: "Please select a warehouse", type: "warning" })
      return
    }
    const validItems = lineItems.filter((i) => i.product_id && parseInt(i.expected_quantity) > 0)
    if (validItems.length === 0) {
      toast.add({ title: "Add at least one product", type: "warning" })
      return
    }
    setSaving(true)
    try {
      await api.post("/logistics/stock-transfers", {
        warehouse_id: warehouseId,
        origin_address: originAddress || null,
        notes: notes || null,
        items: validItems.map((i) => ({
          product_id: i.product_id,
          expected_quantity: parseInt(i.expected_quantity),
        })),
      })
      toast.add({ title: "Stock transfer request created", type: "success" })
      onOpenChange(false)
      onSaved()
      setWarehouseId("")
      setOriginAddress("")
      setNotes("")
      setLineItems([{ product_id: "", expected_quantity: "1" }])
    } catch (err) {
      toast.add({ title: "Failed to create transfer", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>New Stock Transfer</DialogTitle>
            <DialogDescription>Request to transfer stock from your store to a Xerin warehouse.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Warehouse *</FieldLabel>
              <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select warehouse..." /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name} — {w.region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Origin Address</FieldLabel>
              <Input value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="Your store address" />
            </Field>
            <div className="space-y-2">
              <FieldLabel>Items</FieldLabel>
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={item.product_id} onValueChange={(v) => updateLine(i, "product_id", v ?? "")}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={item.expected_quantity}
                    onChange={(e) => updateLine(i, "expected_quantity", e.target.value)}
                    className="w-24"
                  />
                  {lineItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)}>
                      <span className="text-xs text-muted-foreground">Remove</span>
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-4" /> Add Item
              </Button>
            </div>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>Create Transfer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
