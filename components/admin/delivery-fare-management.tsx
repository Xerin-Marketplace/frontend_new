"use client"

import * as React from "react"
import {
  MapPin,
  Calculator,
  TrendingUp,
  Plus,
  Search,
  Edit,
  Trash2,
  Bike,
  Car,
  Truck,
  Van,
  Zap,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton } from "@/components/skeletons"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type DeliveryZoneT = {
  id: string
  name: string
  description: string | null
  city: string | null
  region: string | null
  country: string
  center_latitude: number | null
  center_longitude: number | null
  radius_km: string | null
  is_active: boolean
  created_at: string
}

type DeliveryFareT = {
  id: string
  zone_id: string
  fare_type: string
  vehicle_type: string | null
  base_fare: string
  per_km_fare: string
  waiting_fee_per_min: string
  idle_fee_per_min: string
  cancellation_fee_percent: string
  min_cancellation_fee: string
  trip_delay_fee_per_min: string
  penalty_fee_for_cancel: string
  fee_add_to_next: string
  min_fare: string
  max_fare: string | null
  is_active: boolean
}

type SurgePricingT = {
  id: string
  name: string
  zone_id: string | null
  surge_type: string
  surge_percentage: string
  vehicle_type: string | null
  schedule_type: string
  start_time: string | null
  end_time: string | null
  days_of_week: number[] | null
  customer_note: string | null
  is_active: boolean
}

type FareCalcResult = {
  base_fare: string
  distance_km: string
  distance_fare: string
  waiting_fee: string
  idle_fee: string
  delay_fee: string
  cancellation_fee: string
  surge_percentage: string
  surge_fee: string
  subtotal: string
  vat_tax: string
  coupon_discount: string
  total_fare: string
  currency: string
  zone_name: string | null
}

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

const vehicleIcon: Record<string, React.ReactNode> = {
  motorcycle: <Bike className="size-4" />,
  car: <Car className="size-4" />,
  van: <Van className="size-4" />,
  truck: <Truck className="size-4" />,
  bicycle: <Bike className="size-4" />,
  tuk_tuk: <Bike className="size-4" />,
}

export function DeliveryFareManagement() {
  const [tab, setTab] = React.useState<"zones" | "fares" | "surge" | "calculator">("zones")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Delivery Fare Management</h2>
        <p className="text-sm text-muted-foreground">
          Configure delivery zones, fare structures, surge pricing, and calculate delivery costs.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="zones"><MapPin className="size-4" /> Zones</TabsTrigger>
          <TabsTrigger value="fares"><Calculator className="size-4" /> Fares</TabsTrigger>
          <TabsTrigger value="surge"><TrendingUp className="size-4" /> Surge Pricing</TabsTrigger>
          <TabsTrigger value="calculator"><Calculator className="size-4" /> Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="zones"><ZonesTab /></TabsContent>
        <TabsContent value="fares"><FaresTab /></TabsContent>
        <TabsContent value="surge"><SurgeTab /></TabsContent>
        <TabsContent value="calculator"><CalculatorTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function ZonesTab() {
  const [zones, setZones] = React.useState<DeliveryZoneT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState<DeliveryZoneT | null>(null)
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<DeliveryZoneT[]>("/delivery-zones")
      .then(setZones)
      .catch((err) => toast.add({ title: "Failed to load zones", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone? All associated fares will also be deleted.")) return
    try {
      await api.delete(`/delivery-zones/${id}`)
      toast.add({ title: "Zone deleted", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to delete zone", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Add Zone</Button>
      </div>
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : zones.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MapPin className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No delivery zones configured</p>
            <p className="text-xs text-muted-foreground">Create a zone to start configuring delivery fares.</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Radius (km)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{z.city ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{z.region ?? "—"}</TableCell>
                    <TableCell className="text-sm">{z.radius_km ?? "—"}</TableCell>
                    <TableCell><Badge variant={z.is_active ? "default" : "outline"}>{z.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(z)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => handleDelete(z.id)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {(editing || creating) && (
        <ZoneDialog zone={editing} open={!!editing || creating} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false) } }} onSaved={load} />
      )}
    </div>
  )
}

function ZoneDialog({ zone, open, onOpenChange, onSaved }: { zone: DeliveryZoneT | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(zone?.name ?? "")
  const [description, setDescription] = React.useState(zone?.description ?? "")
  const [city, setCity] = React.useState(zone?.city ?? "")
  const [region, setRegion] = React.useState(zone?.region ?? "")
  const [centerLat, setCenterLat] = React.useState(zone?.center_latitude?.toString() ?? "")
  const [centerLng, setCenterLng] = React.useState(zone?.center_longitude?.toString() ?? "")
  const [radiusKm, setRadiusKm] = React.useState(zone?.radius_km ?? "")
  const [isActive, setIsActive] = React.useState(zone?.is_active ?? true)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name, description: description || null, city: city || null, region: region || null,
        center_latitude: centerLat ? parseFloat(centerLat) : null,
        center_longitude: centerLng ? parseFloat(centerLng) : null,
        radius_km: radiusKm || null, is_active: isActive,
      }
      if (zone) {
        await api.put(`/delivery-zones/${zone.id}`, payload)
        toast.add({ title: "Zone updated", type: "success" })
      } else {
        await api.post("/delivery-zones", payload)
        toast.add({ title: "Zone created", type: "success" })
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.add({ title: "Failed to save zone", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{zone ? "Edit Zone" : "New Delivery Zone"}</DialogTitle>
            <DialogDescription>Define a geographic delivery zone with center coordinates and radius.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field><FieldLabel>Name *</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dar es Salaam Central" required /></Field>
            <Field><FieldLabel>Description</FieldLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>City</FieldLabel><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field><FieldLabel>Region</FieldLabel><Input value={region} onChange={(e) => setRegion(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Center Latitude</FieldLabel><Input type="number" step="any" value={centerLat} onChange={(e) => setCenterLat(e.target.value)} placeholder="-6.8234" /></Field>
              <Field><FieldLabel>Center Longitude</FieldLabel><Input type="number" step="any" value={centerLng} onChange={(e) => setCenterLng(e.target.value)} placeholder="39.2695" /></Field>
              <Field><FieldLabel>Radius (km)</FieldLabel><Input type="number" step="any" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} placeholder="15" /></Field>
            </div>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>{zone ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FaresTab() {
  const [fares, setFares] = React.useState<DeliveryFareT[]>([])
  const [zones, setZones] = React.useState<DeliveryZoneT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState<DeliveryFareT | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [zoneFilter, setZoneFilter] = React.useState("all")

  const load = React.useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get<DeliveryFareT[]>("/delivery-fares"),
      api.get<DeliveryZoneT[]>("/delivery-zones"),
    ]).then(([f, z]) => { setFares(f); setZones(z) })
      .catch((err) => toast.add({ title: "Failed to load fares", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? "—"
  const filtered = fares.filter((f) => zoneFilter === "all" || f.zone_id === zoneFilter)

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fare configuration?")) return
    try {
      await api.delete(`/delivery-fares/${id}`)
      toast.add({ title: "Fare deleted", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to delete fare", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by zone" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Add Fare</Button>
      </div>
      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Calculator className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No fare configurations found</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Base Fare</TableHead>
                  <TableHead>Per KM</TableHead>
                  <TableHead>Min Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{zoneName(f.zone_id)}</TableCell>
                    <TableCell className="text-sm capitalize">{f.fare_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {f.vehicle_type ? vehicleIcon[f.vehicle_type] : <span className="text-xs text-muted-foreground">All</span>}
                        <span className="text-sm">{f.vehicle_type ?? "All"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{parseInt(f.base_fare).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{parseInt(f.per_km_fare).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{parseInt(f.min_fare).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={f.is_active ? "default" : "outline"}>{f.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(f)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => handleDelete(f.id)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {(editing || creating) && (
        <FareDialog fare={editing} zones={zones} open={!!editing || creating} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false) } }} onSaved={load} />
      )}
    </div>
  )
}

function FareDialog({ fare, zones, open, onOpenChange, onSaved }: { fare: DeliveryFareT | null; zones: DeliveryZoneT[]; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [zoneId, setZoneId] = React.useState(fare?.zone_id ?? "")
  const [vehicleType, setVehicleType] = React.useState(fare?.vehicle_type ?? "")
  const [baseFare, setBaseFare] = React.useState(fare?.base_fare ?? "2000")
  const [perKm, setPerKm] = React.useState(fare?.per_km_fare ?? "500")
  const [waitingPerMin, setWaitingPerMin] = React.useState(fare?.waiting_fee_per_min ?? "50")
  const [idlePerMin, setIdlePerMin] = React.useState(fare?.idle_fee_per_min ?? "30")
  const [delayPerMin, setDelayPerMin] = React.useState(fare?.trip_delay_fee_per_min ?? "100")
  const [cancelPct, setCancelPct] = React.useState(fare?.cancellation_fee_percent ?? "10")
  const [minCancel, setMinCancel] = React.useState(fare?.min_cancellation_fee ?? "500")
  const [minFare, setMinFare] = React.useState(fare?.min_fare ?? "2000")
  const [maxFare, setMaxFare] = React.useState(fare?.max_fare ?? "")
  const [isActive, setIsActive] = React.useState(fare?.is_active ?? true)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        zone_id: zoneId,
        vehicle_type: vehicleType || null,
        base_fare: baseFare, per_km_fare: perKm,
        waiting_fee_per_min: waitingPerMin, idle_fee_per_min: idlePerMin,
        trip_delay_fee_per_min: delayPerMin,
        cancellation_fee_percent: cancelPct, min_cancellation_fee: minCancel,
        min_fare: minFare, max_fare: maxFare || null, is_active: isActive,
      }
      if (fare) {
        await api.put(`/delivery-fares/${fare.id}`, payload)
        toast.add({ title: "Fare updated", type: "success" })
      } else {
        await api.post("/delivery-fares", payload)
        toast.add({ title: "Fare created", type: "success" })
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.add({ title: "Failed to save fare", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{fare ? "Edit Fare Configuration" : "New Fare Configuration"}</DialogTitle>
            <DialogDescription>Set delivery pricing for a zone and optional vehicle type.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Zone *</FieldLabel>
                <Select value={zoneId} onValueChange={(v) => setZoneId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>{zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Vehicle Type</FieldLabel>
                <Select value={vehicleType || "all"} onValueChange={(v) => setVehicleType(v === "all" ? "" : v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="tuk_tuk">Tuk Tuk</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Base Fare (TZS)</FieldLabel><Input type="number" value={baseFare} onChange={(e) => setBaseFare(e.target.value)} /></Field>
              <Field><FieldLabel>Per KM (TZS)</FieldLabel><Input type="number" value={perKm} onChange={(e) => setPerKm(e.target.value)} /></Field>
              <Field><FieldLabel>Min Fare (TZS)</FieldLabel><Input type="number" value={minFare} onChange={(e) => setMinFare(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Waiting Fee/Min</FieldLabel><Input type="number" value={waitingPerMin} onChange={(e) => setWaitingPerMin(e.target.value)} /></Field>
              <Field><FieldLabel>Idle Fee/Min</FieldLabel><Input type="number" value={idlePerMin} onChange={(e) => setIdlePerMin(e.target.value)} /></Field>
              <Field><FieldLabel>Delay Fee/Min</FieldLabel><Input type="number" value={delayPerMin} onChange={(e) => setDelayPerMin(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel>Cancel Fee %</FieldLabel><Input type="number" value={cancelPct} onChange={(e) => setCancelPct(e.target.value)} /></Field>
              <Field><FieldLabel>Min Cancel Fee</FieldLabel><Input type="number" value={minCancel} onChange={(e) => setMinCancel(e.target.value)} /></Field>
              <Field><FieldLabel>Max Fare (optional)</FieldLabel><Input type="number" value={maxFare} onChange={(e) => setMaxFare(e.target.value)} /></Field>
            </div>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>{fare ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SurgeTab() {
  const [surges, setSurges] = React.useState<SurgePricingT[]>([])
  const [zones, setZones] = React.useState<DeliveryZoneT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState<SurgePricingT | null>(null)
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get<SurgePricingT[]>("/surge-pricings"),
      api.get<DeliveryZoneT[]>("/delivery-zones"),
    ]).then(([s, z]) => { setSurges(s); setZones(z) })
      .catch((err) => toast.add({ title: "Failed to load surge pricing", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const zoneName = (id: string | null) => zones.find((z) => z.id === id)?.name ?? "All Zones"

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this surge pricing rule?")) return
    try {
      await api.delete(`/surge-pricings/${id}`)
      toast.add({ title: "Surge pricing deleted", type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to delete", description: message(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Add Surge Pricing</Button>
      </div>
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : surges.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <TrendingUp className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No surge pricing rules configured</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Surge %</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surges.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm">{zoneName(s.zone_id)}</TableCell>
                    <TableCell className="text-sm capitalize">{s.surge_type.replace(/_/g, " ")}</TableCell>
                    <TableCell><Badge variant="secondary"><Zap className="size-3" /> {s.surge_percentage}%</Badge></TableCell>
                    <TableCell className="text-sm capitalize">{s.schedule_type.replace(/_/g, " ")}</TableCell>
                    <TableCell><Badge variant={s.is_active ? "default" : "outline"}>{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(s)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => handleDelete(s.id)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {(editing || creating) && (
        <SurgeDialog surge={editing} zones={zones} open={!!editing || creating} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false) } }} onSaved={load} />
      )}
    </div>
  )
}

function SurgeDialog({ surge, zones, open, onOpenChange, onSaved }: { surge: SurgePricingT | null; zones: DeliveryZoneT[]; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(surge?.name ?? "")
  const [zoneId, setZoneId] = React.useState(surge?.zone_id ?? "all")
  const [surgeType, setSurgeType] = React.useState(surge?.surge_type ?? "all_vehicles")
  const [surgePct, setSurgePct] = React.useState(surge?.surge_percentage ?? "20")
  const [scheduleType, setScheduleType] = React.useState(surge?.schedule_type ?? "always")
  const [isActive, setIsActive] = React.useState(surge?.is_active ?? true)
  const [customerNote, setCustomerNote] = React.useState(surge?.customer_note ?? "")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name, zone_id: zoneId === "all" ? null : zoneId,
        surge_type: surgeType, surge_percentage: surgePct,
        schedule_type: scheduleType, is_active: isActive,
        customer_note: customerNote || null,
      }
      if (surge) {
        await api.put(`/surge-pricings/${surge.id}`, payload)
        toast.add({ title: "Surge pricing updated", type: "success" })
      } else {
        await api.post("/surge-pricings", payload)
        toast.add({ title: "Surge pricing created", type: "success" })
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.add({ title: "Failed to save", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{surge ? "Edit Surge Pricing" : "New Surge Pricing"}</DialogTitle>
            <DialogDescription>Configure dynamic pricing surge for peak hours or high demand.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field><FieldLabel>Name *</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rush Hour Surge" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Zone</FieldLabel>
                <Select value={zoneId} onValueChange={(v) => setZoneId(v ?? "all")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Applies To</FieldLabel>
                <Select value={surgeType} onValueChange={(v) => setSurgeType(v ?? "all_vehicles")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_vehicles">All Vehicles</SelectItem>
                    <SelectItem value="specific_category">Specific Vehicle</SelectItem>
                    <SelectItem value="all_parcels">All Parcels</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Surge Percentage (%)</FieldLabel><Input type="number" value={surgePct} onChange={(e) => setSurgePct(e.target.value)} /></Field>
              <Field>
                <FieldLabel>Schedule</FieldLabel>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v ?? "always")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always Active</SelectItem>
                    <SelectItem value="time_based">Time Based</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field><FieldLabel>Customer Note</FieldLabel><Textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={2} placeholder="e.g. High demand — fares are increased temporarily" /></Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>{surge ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CalculatorTab() {
  const [pickupLat, setPickupLat] = React.useState("")
  const [pickupLng, setPickupLng] = React.useState("")
  const [destLat, setDestLat] = React.useState("")
  const [destLng, setDestLng] = React.useState("")
  const [vehicleType, setVehicleType] = React.useState("motorcycle")
  const [waitingMin, setWaitingMin] = React.useState("0")
  const [idleMin, setIdleMin] = React.useState("0")
  const [delayMin, setDelayMin] = React.useState("0")
  const [result, setResult] = React.useState<FareCalcResult | null>(null)
  const [calculating, setCalculating] = React.useState(false)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalculating(true)
    try {
      const res = await api.post<FareCalcResult>("/delivery-fares/calculate", {
        pickup_latitude: parseFloat(pickupLat),
        pickup_longitude: parseFloat(pickupLng),
        destination_latitude: parseFloat(destLat),
        destination_longitude: parseFloat(destLng),
        vehicle_type: vehicleType,
        waiting_minutes: parseInt(waitingMin) || 0,
        idle_minutes: parseInt(idleMin) || 0,
        delay_minutes: parseInt(delayMin) || 0,
      })
      setResult(res)
    } catch (err) {
      toast.add({ title: "Failed to calculate fare", description: message(err), type: "error" })
    } finally {
      setCalculating(false)
    }
  }

  const fmt = (v: string) => parseInt(v).toLocaleString()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Fare Calculator</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-4">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field><FieldLabel>Pickup Latitude</FieldLabel><Input type="number" step="any" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} placeholder="-6.8234" required /></Field>
                <Field><FieldLabel>Pickup Longitude</FieldLabel><Input type="number" step="any" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} placeholder="39.2695" required /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field><FieldLabel>Destination Latitude</FieldLabel><Input type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} placeholder="-6.8123" required /></Field>
                <Field><FieldLabel>Destination Longitude</FieldLabel><Input type="number" step="any" value={destLng} onChange={(e) => setDestLng(e.target.value)} placeholder="39.2891" required /></Field>
              </div>
              <Field>
                <FieldLabel>Vehicle Type</FieldLabel>
                <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? "motorcycle")}>
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
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field><FieldLabel>Waiting (min)</FieldLabel><Input type="number" value={waitingMin} onChange={(e) => setWaitingMin(e.target.value)} /></Field>
                <Field><FieldLabel>Idle (min)</FieldLabel><Input type="number" value={idleMin} onChange={(e) => setIdleMin(e.target.value)} /></Field>
                <Field><FieldLabel>Delay (min)</FieldLabel><Input type="number" value={delayMin} onChange={(e) => setDelayMin(e.target.value)} /></Field>
              </div>
            </FieldGroup>
            <Button type="submit" loading={calculating}><Calculator className="size-4" /> Calculate Fare</Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Fare Breakdown {result.zone_name && `— ${result.zone_name}`}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Distance</span><span className="font-medium">{result.distance_km} km</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Fare</span><span className="font-medium">{fmt(result.base_fare)} {result.currency}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Distance Fare</span><span className="font-medium">{fmt(result.distance_fare)} {result.currency}</span></div>
            {parseInt(result.waiting_fee) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Waiting Fee</span><span className="font-medium">{fmt(result.waiting_fee)} {result.currency}</span></div>}
            {parseInt(result.idle_fee) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Idle Fee</span><span className="font-medium">{fmt(result.idle_fee)} {result.currency}</span></div>}
            {parseInt(result.delay_fee) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delay Fee</span><span className="font-medium">{fmt(result.delay_fee)} {result.currency}</span></div>}
            {parseInt(result.surge_fee) > 0 && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Surge ({result.surge_percentage}%)</span><span className="font-medium text-orange-600">+{fmt(result.surge_fee)} {result.currency}</span></div>
            )}
            <Separator />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmt(result.subtotal)} {result.currency}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (18%)</span><span className="font-medium">{fmt(result.vat_tax)} {result.currency}</span></div>
            {parseInt(result.coupon_discount) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-medium text-green-600">-{fmt(result.coupon_discount)} {result.currency}</span></div>}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>Total Fare</span><span>{fmt(result.total_fare)} {result.currency}</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
