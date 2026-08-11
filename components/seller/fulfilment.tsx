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

type Tab = "overview" | "inbound" | "inventory"

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

export function SellerFulfilment() {
  const [tab, setTab] = React.useState<Tab>("overview")

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
        const [inbound, inventory] = await Promise.all([
          api.get<InboundShipmentT[]>("/fulfilment/inbound").catch(() => []),
          api.get<FBXInventoryT[]>("/fulfilment/inventory").catch(() => []),
        ])
        setStats({
          totalInbound: inbound.length,
          inTransit: inbound.filter((i) => i.status === "in_transit").length,
          received: inbound.filter((i) => i.status === "received").length,
          completed: inbound.filter((i) => i.status === "completed").length,
          totalFbxUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
          availableFbxUnits: inventory.reduce((sum, i) => sum + i.available_quantity, 0),
          reservedFbxUnits: inventory.reduce((sum, i) => sum + i.reserved_quantity, 0),
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
