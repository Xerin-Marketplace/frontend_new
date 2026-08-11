"use client"

import * as React from "react"
import {
  Truck,
  Bike,
  Car,
  Plus,
  Search,
  Eye,
  UserCheck,
  Ban,
  MapPin,
  Package,
  ClipboardList,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Tab = "overview" | "drivers" | "vehicles" | "trips" | "transfers"

type Driver = {
  id: string
  user_id: string
  license_number: string | null
  national_id: string | null
  phone: string | null
  status: string
  verification_status: string
  is_online: boolean
  rating: number
  total_deliveries: number
  current_latitude: number | null
  current_longitude: number | null
  service_zones: string[]
  vehicle_id: string | null
  approved_at: string | null
  suspended_at: string | null
  suspend_reason: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
  vehicle_plate: string | null
}

type Vehicle = {
  id: string
  plate_number: string
  vehicle_type: string
  brand: string | null
  model: string | null
  year: number | null
  color: string | null
  capacity_kg: number | null
  is_active: boolean
  created_at: string
}

type DeliveryTrip = {
  id: string
  ref_code: string
  shipment_id: string
  seller_order_id: string
  driver_id: string | null
  vehicle_id: string | null
  status: string
  pickup_address: string | null
  delivery_address: string | null
  delivery_fee: number | null
  otp: string | null
  pickup_at: string | null
  delivered_at: string | null
  created_at: string
  driver_name: string | null
  driver_phone: string | null
  vehicle_plate: string | null
  order_number: string | null
}

type StockTransfer = {
  id: string
  reference: string
  seller_id: string
  warehouse_id: string
  status: string
  origin_address: string | null
  expected_arrival_at: string | null
  dispatched_at: string | null
  received_at: string | null
  transport_cost: number | null
  notes: string | null
  rejection_reason: string | null
  created_at: string
  warehouse_name: string | null
  seller_name: string | null
  items: { id: string; product_id: string; expected_quantity: number; received_quantity: number; product_name: string | null }[]
}

type Dashboard = {
  drivers: { total: number; online: number; on_delivery: number; pending_verification: number }
  vehicles: { total: number; active: number }
  trips: Record<string, number>
  stock_transfers: Record<string, number>
}

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

const driverStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  offline: { label: "Offline", variant: "secondary" },
  online: { label: "Online", variant: "default" },
  on_delivery: { label: "On Delivery", variant: "default" },
  suspended: { label: "Suspended", variant: "destructive" },
  terminated: { label: "Terminated", variant: "destructive" },
}

const verificationConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
}

const tripStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  assigned: { label: "Assigned", variant: "secondary" },
  out_for_pickup: { label: "Out for Pickup", variant: "default" },
  picked_up: { label: "Picked Up", variant: "default" },
  in_transit: { label: "In Transit", variant: "default" },
  out_for_delivery: { label: "Out for Delivery", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  returned: { label: "Returned", variant: "secondary" },
}

const transferStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  requested: { label: "Requested", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  in_transit: { label: "In Transit", variant: "default" },
  received: { label: "Received", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function LogisticsManagement({ initialTab = "overview" }: { initialTab?: Tab }) {
  const { isSuperAdmin, hasPermission } = useAuth()
  const canManage = isSuperAdmin || hasPermission("logistics:manage")
  const canManageDrivers = isSuperAdmin || hasPermission("logistics:driver_manage")
  const canManageVehicles = isSuperAdmin || hasPermission("logistics:vehicle_manage")
  const canAssignTrips = isSuperAdmin || hasPermission("logistics:trip_assign")
  const [tab, setTab] = React.useState<Tab>(initialTab)

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: ClipboardList },
    { key: "drivers", label: "Drivers", icon: Truck },
    { key: "vehicles", label: "Vehicles", icon: Car },
    { key: "trips", label: "Delivery Trips", icon: Package },
    { key: "transfers", label: "Stock Transfers", icon: ArrowRightLeft },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xerin Logistics</h2>
          <p className="text-sm text-muted-foreground">
            Manage drivers, vehicles, delivery trips, and seller stock transfers to warehouses.
          </p>
        </div>
      </div>
      <div className="flex w-fit flex-wrap gap-1 rounded-lg border p-1">
        {tabs.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={tab === item.key ? "default" : "ghost"}
            onClick={() => setTab(item.key)}
          >
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "drivers" && <DriversTab canManage={canManageDrivers} />}
      {tab === "vehicles" && <VehiclesTab canManage={canManageVehicles} />}
      {tab === "trips" && <TripsTab canAssign={canAssignTrips} />}
      {tab === "transfers" && <TransfersTab canManage={canManage} />}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.get<Dashboard>("/logistics/dashboard")
      .then(setDashboard)
      .catch((err) => toast.add({ title: "Failed to load dashboard", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
  if (!dashboard) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Truck className="size-4" /> Drivers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-medium">{dashboard.drivers.total}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Online</span><span className="font-medium text-green-600">{dashboard.drivers.online}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">On Delivery</span><span className="font-medium">{dashboard.drivers.on_delivery}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending Verification</span><span className="font-medium text-orange-600">{dashboard.drivers.pending_verification}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Car className="size-4" /> Vehicles</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-medium">{dashboard.vehicles.total}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active</span><span className="font-medium text-green-600">{dashboard.vehicles.active}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Package className="size-4" /> Delivery Trips</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(dashboard.trips).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tripStatusConfig[k]?.label ?? k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          {Object.values(dashboard.trips).every((v) => v === 0) && <p className="text-sm text-muted-foreground">No trips yet</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ArrowRightLeft className="size-4" /> Stock Transfers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(dashboard.stock_transfers).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{transferStatusConfig[k]?.label ?? k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          {Object.values(dashboard.stock_transfers).every((v) => v === 0) && <p className="text-sm text-muted-foreground">No transfers yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Drivers Tab ──────────────────────────────────────────────────────────────

function DriversTab({ canManage }: { canManage: boolean }) {
  const [drivers, setDrivers] = React.useState<Driver[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [viewDriver, setViewDriver] = React.useState<Driver | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const data = await api.get<{ results: Driver[]; total: number }>(`/logistics/drivers?${params}`)
      setDrivers(data.results)
    } catch (err) {
      toast.add({ title: "Failed to load drivers", description: message(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => { load() }, [load])

  const approveDriver = async (id: string) => {
    try {
      await api.post(`/logistics/drivers/${id}/approve`)
      toast.add({ title: "Driver approved", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to approve driver", description: message(err), type: "error" })
    }
  }

  const suspendDriver = async (id: string) => {
    try {
      await api.post(`/logistics/drivers/${id}/suspend?reason=Suspended by admin`)
      toast.add({ title: "Driver suspended", type: "warning" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to suspend driver", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="on_delivery">On Delivery</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : drivers.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Truck className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No drivers found</p>
          <p className="text-xs text-muted-foreground">{search || statusFilter !== "all" ? "Try adjusting your filters." : "Add a driver to get started."}</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.user_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{d.user_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{d.phone ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${d.is_online ? "bg-green-500" : "bg-gray-400"}`} />
                        <Badge variant={driverStatusConfig[d.status]?.variant ?? "outline"}>{driverStatusConfig[d.status]?.label ?? d.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={verificationConfig[d.verification_status]?.variant ?? "outline"}>{verificationConfig[d.verification_status]?.label ?? d.verification_status}</Badge></TableCell>
                    <TableCell className="text-sm">{d.total_deliveries}</TableCell>
                    <TableCell className="text-sm">
                      {Number(d.rating) > 0 ? (
                        <span className="flex items-center gap-1"><Star className="size-3 fill-yellow-400 text-yellow-400" />{Number(d.rating).toFixed(2)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{d.vehicle_plate ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewDriver(d)}><Eye className="size-4" /></Button>
                        {canManage && d.verification_status === "pending" && (
                          <Button variant="ghost" size="icon-sm" title="Approve" onClick={() => approveDriver(d.id)}><UserCheck className="size-4 text-green-600" /></Button>
                        )}
                        {canManage && d.status !== "suspended" && (
                          <Button variant="ghost" size="icon-sm" title="Suspend" onClick={() => suspendDriver(d.id)}><Ban className="size-4 text-red-600" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewDriver && <DriverDetailDialog driver={viewDriver} open={!!viewDriver} onOpenChange={(o) => !o && setViewDriver(null)} />}
    </div>
  )
}

function DriverDetailDialog({ driver, open, onOpenChange }: { driver: Driver; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Driver Details</DialogTitle>
          <DialogDescription>{driver.user_name ?? "Unknown Driver"}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Detail label="Email" value={driver.user_email ?? "—"} />
          <Detail label="Phone" value={driver.phone ?? "—"} />
          <Detail label="License No." value={driver.license_number ?? "—"} />
          <Detail label="National ID" value={driver.national_id ?? "—"} />
          <Detail label="Status" value={driverStatusConfig[driver.status]?.label ?? driver.status} />
          <Detail label="Verification" value={verificationConfig[driver.verification_status]?.label ?? driver.verification_status} />
          <Detail label="Total Deliveries" value={String(driver.total_deliveries)} />
          <Detail label="Rating" value={Number(driver.rating).toFixed(2)} />
          <Detail label="Vehicle" value={driver.vehicle_plate ?? "—"} />
          <Detail label="Online" value={driver.is_online ? "Yes" : "No"} />
          <Detail label="Service Zones" value={driver.service_zones.join(", ") || "—"} />
          <Detail label="Approved At" value={driver.approved_at ? new Date(driver.approved_at).toLocaleString() : "—"} />
          {driver.suspended_at && <Detail label="Suspended At" value={new Date(driver.suspended_at).toLocaleString()} />}
          {driver.suspend_reason && <Detail label="Suspend Reason" value={driver.suspend_reason} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Vehicles Tab ─────────────────────────────────────────────────────────────

function VehiclesTab({ canManage }: { canManage: boolean }) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const data = await api.get<{ results: Vehicle[]; total: number }>(`/logistics/vehicles?${params}`)
      setVehicles(data.results)
    } catch (err) {
      toast.add({ title: "Failed to load vehicles", description: message(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => { load() }, [load])

  const vehicleIcon = (type: string) => {
    if (type === "motorcycle" || type === "bicycle" || type === "tuk_tuk") return Bike
    return Car
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {canManage && <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Add Vehicle</Button>}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : vehicles.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Car className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No vehicles found</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Capacity (kg)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => {
                  const Icon = vehicleIcon(v.vehicle_type)
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.plate_number}</TableCell>
                      <TableCell><span className="flex items-center gap-2"><Icon className="size-4" />{v.vehicle_type}</span></TableCell>
                      <TableCell className="text-sm">{[v.brand, v.model].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell className="text-sm">{v.year ?? "—"}</TableCell>
                      <TableCell className="text-sm">{v.color ?? "—"}</TableCell>
                      <TableCell className="text-sm">{v.capacity_kg ?? "—"}</TableCell>
                      <TableCell><Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {dialogOpen && <VehicleDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />}
    </div>
  )
}

function VehicleDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    plate_number: "", vehicle_type: "motorcycle", brand: "", model: "", year: "", color: "", capacity_kg: "",
  })
  const set = (k: string, v: string) => setForm((c) => ({ ...c, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post("/logistics/vehicles", {
        plate_number: form.plate_number,
        vehicle_type: form.vehicle_type,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        color: form.color || null,
        capacity_kg: form.capacity_kg ? parseFloat(form.capacity_kg) : null,
      })
      toast.add({ title: "Vehicle created", type: "success" })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.add({ title: "Failed to create vehicle", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>Register a new delivery vehicle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Plate Number *</Label><Input value={form.plate_number} onChange={(e) => set("plate_number", e.target.value)} required placeholder="T 123 ABC" /></div>
            <div>
              <Label>Vehicle Type</Label>
              <Select value={form.vehicle_type} onValueChange={(v) => set("vehicle_type", v ?? "motorcycle")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="tuk_tuk">Tuk Tuk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Honda" /></div>
              <div><Label>Model</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="CG 125" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2024" /></div>
              <div><Label>Color</Label><Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Red" /></div>
            </div>
            <div><Label>Capacity (kg)</Label><Input type="number" value={form.capacity_kg} onChange={(e) => set("capacity_kg", e.target.value)} placeholder="50" /></div>
          </div>
          <DialogFooter>
            <Button type="submit" loading={saving}>Create Vehicle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Trips Tab ────────────────────────────────────────────────────────────────

function TripsTab({ canAssign }: { canAssign: boolean }) {
  const [trips, setTrips] = React.useState<DeliveryTrip[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [drivers, setDrivers] = React.useState<Driver[]>([])
  const [assignTrip, setAssignTrip] = React.useState<DeliveryTrip | null>(null)
  const [selectedDriverId, setSelectedDriverId] = React.useState<string>("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const data = await api.get<{ results: DeliveryTrip[]; total: number }>(`/logistics/trips?${params}`)
      setTrips(data.results)
    } catch (err) {
      toast.add({ title: "Failed to load trips", description: message(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const loadDrivers = React.useCallback(async () => {
    try {
      const data = await api.get<{ results: Driver[] }>("/logistics/drivers?status=online")
      setDrivers(data.results)
    } catch {}
  }, [])

  React.useEffect(() => { loadDrivers() }, [loadDrivers])

  const handleAssign = async () => {
    if (!assignTrip || !selectedDriverId) return
    try {
      await api.post(`/logistics/trips/shipment/${assignTrip.shipment_id}/assign`, { driver_id: selectedDriverId })
      toast.add({ title: "Driver assigned", type: "success" })
      setAssignTrip(null)
      setSelectedDriverId("")
      load()
    } catch (err) {
      toast.add({ title: "Failed to assign driver", description: message(err), type: "error" })
    }
  }

  const updateStatus = async (tripId: string, status: string) => {
    try {
      await api.put(`/logistics/trips/${tripId}/status`, { status })
      toast.add({ title: "Trip status updated", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to update status", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="out_for_pickup">Out for Pickup</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : trips.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No delivery trips found</p>
          <p className="text-xs text-muted-foreground">Delivery trips are created when a driver is assigned to a shipment.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.ref_code}</TableCell>
                    <TableCell className="text-sm">{t.order_number ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {t.driver_name ?? <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-sm">{t.vehicle_plate ?? "—"}</TableCell>
                    <TableCell><Badge variant={tripStatusConfig[t.status]?.variant ?? "outline"}>{tripStatusConfig[t.status]?.label ?? t.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{t.delivery_address ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canAssign && !t.driver_id && (
                          <Button size="sm" variant="outline" onClick={() => { setAssignTrip(t); setSelectedDriverId("") }}>Assign Driver</Button>
                        )}
                        {canAssign && t.status === "assigned" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "out_for_pickup")}>Start Pickup</Button>
                        )}
                        {canAssign && t.status === "out_for_pickup" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "picked_up")}>Picked Up</Button>
                        )}
                        {canAssign && t.status === "picked_up" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "in_transit")}>In Transit</Button>
                        )}
                        {canAssign && t.status === "in_transit" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "out_for_delivery")}>Out for Delivery</Button>
                        )}
                        {canAssign && t.status === "out_for_delivery" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "delivered")}>
                            <CheckCircle2 className="size-4 text-green-600" /> Delivered
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {assignTrip && (
        <Dialog open={!!assignTrip} onOpenChange={(o) => !o && setAssignTrip(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
              <DialogDescription>Trip {assignTrip.ref_code} — Order {assignTrip.order_number ?? "—"}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Select Driver</Label>
                <Select value={selectedDriverId} onValueChange={(v) => setSelectedDriverId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Choose an online driver..." /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.user_name} — {d.phone ?? "No phone"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {drivers.length === 0 && <p className="text-sm text-muted-foreground">No online drivers available. Drivers must be online and verified.</p>}
            </div>
            <DialogFooter>
              <Button onClick={handleAssign} disabled={!selectedDriverId}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Stock Transfers Tab ──────────────────────────────────────────────────────

function TransfersTab({ canManage }: { canManage: boolean }) {
  const [transfers, setTransfers] = React.useState<StockTransfer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [viewTransfer, setViewTransfer] = React.useState<StockTransfer | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const data = await api.get<{ results: StockTransfer[]; total: number }>(`/logistics/stock-transfers?${params}`)
      setTransfers(data.results)
    } catch (err) {
      toast.add({ title: "Failed to load stock transfers", description: message(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    try {
      await api.put(`/logistics/stock-transfers/${id}/status`, { status, rejection_reason: rejectionReason })
      toast.add({ title: "Transfer status updated", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to update status", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
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

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : transfers.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <ArrowRightLeft className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No stock transfers found</p>
          <p className="text-xs text-muted-foreground">Sellers can request to transfer stock to Xerin warehouses.</p>
        </CardContent></Card>
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
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                    <TableCell className="text-sm">{t.seller_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.warehouse_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.items.length} item(s)</TableCell>
                    <TableCell><Badge variant={transferStatusConfig[t.status]?.variant ?? "outline"}>{transferStatusConfig[t.status]?.label ?? t.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.expected_arrival_at ? new Date(t.expected_arrival_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewTransfer(t)}><Eye className="size-4" /></Button>
                        {canManage && t.status === "requested" && (
                          <>
                            <Button size="sm" variant="ghost" title="Approve" onClick={() => updateStatus(t.id, "approved")}><CheckCircle2 className="size-4 text-green-600" /></Button>
                            <Button size="sm" variant="ghost" title="Reject" onClick={() => updateStatus(t.id, "rejected", "Rejected by admin")}><XCircle className="size-4 text-red-600" /></Button>
                          </>
                        )}
                        {canManage && t.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "in_transit")}>Dispatch</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewTransfer && (
        <Dialog open={!!viewTransfer} onOpenChange={(o) => !o && setViewTransfer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Stock Transfer Details</DialogTitle>
              <DialogDescription>{viewTransfer.reference}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Seller" value={viewTransfer.seller_name ?? "—"} />
                <Detail label="Warehouse" value={viewTransfer.warehouse_name ?? "—"} />
                <Detail label="Status" value={transferStatusConfig[viewTransfer.status]?.label ?? viewTransfer.status} />
                <Detail label="Origin Address" value={viewTransfer.origin_address ?? "—"} />
                <Detail label="Transport Cost" value={viewTransfer.transport_cost ? `TZS ${viewTransfer.transport_cost}` : "—"} />
                <Detail label="Notes" value={viewTransfer.notes ?? "—"} />
              </div>
              <Separator />
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

// ─── Shared ───────────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="break-all font-medium">{value}</div></div>
}
