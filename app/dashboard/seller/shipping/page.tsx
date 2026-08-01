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
  DialogTrigger,
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
  Truck,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, StatsCardSkeleton, TableSkeleton } from "@/components/skeletons"

type Zone = {
  id: string
  name: string
  country: string
  regions: string[]
  cities: string[]
  is_active: boolean
  created_at: string
  updated_at: string | null
}

type ShippingMethod = {
  id: string
  name: string
  description: string | null
  carrier_name: string | null
  min_delivery_days: number
  max_delivery_days: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

type Shipment = {
  id: string
  order_id: string
  seller_id: string
  shipping_method_id: string | null
  status: string
  carrier_name: string | null
  tracking_number: string | null
  estimated_delivery_from: string | null
  estimated_delivery_to: string | null
  dispatched_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string | null
}

const shipmentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  ready_for_dispatch: { label: "Ready", variant: "secondary" },
  dispatched: { label: "Dispatched", variant: "secondary" },
  in_transit: { label: "In Transit", variant: "secondary" },
  out_for_delivery: { label: "Out for Delivery", variant: "secondary" },
  delivered: { label: "Delivered", variant: "default" },
  delivery_failed: { label: "Failed", variant: "destructive" },
  returned_to_sender: { label: "Returned", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerShippingPage() {
  const [zones, setZones] = React.useState<Zone[]>([])
  const [methods, setMethods] = React.useState<ShippingMethod[]>([])
  const [shipments, setShipments] = React.useState<Shipment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [zoneOpen, setZoneOpen] = React.useState(false)
  const [editZone, setEditZone] = React.useState<Zone | null>(null)
  const [deleteZone, setDeleteZone] = React.useState<Zone | null>(null)
  const [methodOpen, setMethodOpen] = React.useState(false)
  const [editMethod, setEditMethod] = React.useState<ShippingMethod | null>(null)
  const [deleteMethod, setDeleteMethod] = React.useState<ShippingMethod | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      api.get<Zone[]>("/shipping/zones"),
      api.get<ShippingMethod[]>("/shipping/methods"),
      api.get<Shipment[]>("/shipping/shipments/seller"),
    ])
      .then(([z, m, s]) => {
        setZones(z)
        setMethods(m)
        setShipments(s)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load shipping data",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredShipments = React.useMemo(() => {
    if (!search) return shipments
    const term = search.toLowerCase()
    return shipments.filter(
      (s) => s.order_id.toLowerCase().includes(term) || (s.tracking_number ?? "").toLowerCase().includes(term) || (s.carrier_name ?? "").toLowerCase().includes(term)
    )
  }, [shipments, search])

  const handleSaveZone = async (data: { name: string; regions: string[]; estimated_days: string }, id?: string) => {
    setActionLoading(true)
    try {
      if (id) {
        const updated = await api.patch<Zone>(`/shipping/zones/${id}`, {
          name: data.name,
          regions: data.regions,
        })
        setZones((prev) => prev.map((z) => (z.id === id ? updated : z)))
        setEditZone(null)
        toast.add({ title: "Zone updated!", description: `${data.name} has been updated.`, type: "success" })
      } else {
        const created = await api.post<Zone>("/shipping/zones", {
          name: data.name,
          regions: data.regions,
        })
        setZones((prev) => [...prev, created])
        setZoneOpen(false)
        toast.add({ title: "Zone created!", description: `${data.name} has been added.`, type: "success" })
      }
    } catch (err) {
      toast.add({ title: "Failed to save zone", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteZone = async (id: string) => {
    setActionLoading(true)
    try {
      await api.delete(`/shipping/zones/${id}`)
      setZones((prev) => prev.filter((z) => z.id !== id))
      setDeleteZone(null)
      toast.add({ title: "Zone deleted", description: "Shipping zone has been removed.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to delete zone", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveMethod = async (data: { name: string; carrier: string; estimated_days: string; is_active: boolean }, id?: string) => {
    setActionLoading(true)
    try {
      const [minDays, maxDays] = data.estimated_days.includes("-")
        ? data.estimated_days.split("-").map((d) => parseInt(d.trim()) || 1)
        : [1, parseInt(data.estimated_days) || 7]
      if (id) {
        const updated = await api.patch<ShippingMethod>(`/shipping/methods/${id}`, {
          name: data.name,
          carrier_name: data.carrier,
          min_delivery_days: minDays,
          max_delivery_days: maxDays,
          is_active: data.is_active,
        })
        setMethods((prev) => prev.map((m) => (m.id === id ? updated : m)))
        setEditMethod(null)
        toast.add({ title: "Method updated!", description: `${data.name} has been updated.`, type: "success" })
      } else {
        const created = await api.post<ShippingMethod>("/shipping/methods", {
          name: data.name,
          carrier_name: data.carrier,
          min_delivery_days: minDays,
          max_delivery_days: maxDays,
          is_active: data.is_active,
        })
        setMethods((prev) => [...prev, created])
        setMethodOpen(false)
        toast.add({ title: "Method created!", description: `${data.name} has been added.`, type: "success" })
      }
    } catch (err) {
      toast.add({ title: "Failed to save method", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteMethod = async (id: string) => {
    setActionLoading(true)
    try {
      await api.delete(`/shipping/methods/${id}`)
      setMethods((prev) => prev.filter((m) => m.id !== id))
      setDeleteMethod(null)
      toast.add({ title: "Method deleted", description: "Shipping method has been removed.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to delete method", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <Card><TableSkeleton rows={5} cols={5} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
        <p className="text-sm text-muted-foreground">Configure shipping zones, methods, and track shipments.</p>
      </div>

      {/* Shipping Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4" /> Shipping Zones
            </CardTitle>
            <Dialog open={zoneOpen} onOpenChange={setZoneOpen}>
              <DialogTrigger render={<Button size="sm"><Plus className="size-4" /> Add Zone</Button>} />
              <DialogContent className="sm:max-w-[480px]">
                <ZoneForm onSubmit={(data) => handleSaveZone(data)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{zone.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{zone.is_active ? "Active" : "Inactive"}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setEditZone(zone)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setDeleteZone(zone)} className="text-red-500">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {zone.regions.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="size-4" /> Shipping Methods
            </CardTitle>
            <Dialog open={methodOpen} onOpenChange={setMethodOpen}>
              <DialogTrigger render={<Button size="sm"><Plus className="size-4" /> Add Method</Button>} />
              <DialogContent className="sm:max-w-[480px]">
                <MethodForm onSubmit={(data) => handleSaveMethod(data)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method Name</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Est. Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>{method.carrier_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{method.min_delivery_days}-{method.max_delivery_days} days</TableCell>
                  <TableCell>
                    <Badge variant={method.is_active ? "default" : "outline"}>
                      {method.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setEditMethod(method)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setDeleteMethod(method)} className="text-red-500">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shipments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-4" /> Shipments
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search shipments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No shipments found.</TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((ship) => (
                  <TableRow key={ship.id}>
                    <TableCell className="font-medium font-mono text-xs">{ship.order_id.slice(0, 8)}</TableCell>
                    <TableCell>{ship.carrier_name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{ship.tracking_number ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={shipmentStatusConfig[ship.status]?.variant ?? "outline"}>
                        {shipmentStatusConfig[ship.status]?.label ?? ship.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(ship.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="Track" onClick={() => window.open(`/shipping/shipments/${ship.id}`, "_blank")}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Zone Edit Dialog */}
      <Dialog open={!!editZone} onOpenChange={(open) => !open && setEditZone(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {editZone && <ZoneForm zone={editZone} onSubmit={(data) => handleSaveZone(data, editZone.id)} />}
        </DialogContent>
      </Dialog>

      {/* Zone Delete Dialog */}
      <Dialog open={!!deleteZone} onOpenChange={(open) => !open && setDeleteZone(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Zone?</DialogTitle>
            <DialogDescription>Remove <strong>{deleteZone?.name}</strong>? Shipping methods linked to this zone may be affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteZone && handleDeleteZone(deleteZone.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Method Edit Dialog */}
      <Dialog open={!!editMethod} onOpenChange={(open) => !open && setEditMethod(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {editMethod && <MethodForm method={editMethod} onSubmit={(data) => handleSaveMethod(data, editMethod.id)} />}
        </DialogContent>
      </Dialog>

      {/* Method Delete Dialog */}
      <Dialog open={!!deleteMethod} onOpenChange={(open) => !open && setDeleteMethod(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Method?</DialogTitle>
            <DialogDescription>Remove <strong>{deleteMethod?.name}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteMethod && handleDeleteMethod(deleteMethod.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ZoneForm({
  zone,
  onSubmit,
}: {
  zone?: Zone
  onSubmit: (data: { name: string; regions: string[]; estimated_days: string }, id?: string) => void
}) {
  const [name, setName] = React.useState(zone?.name ?? "")
  const [regions, setRegions] = React.useState(zone?.regions.join(", ") ?? "")
  const [estimatedDays, setEstimatedDays] = React.useState(zone ? `${zone.name}` : "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !estimatedDays.trim()) return
    onSubmit({
      name: name.trim(),
      regions: regions.split(",").map((r) => r.trim()).filter(Boolean),
      estimated_days: estimatedDays.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{zone ? "Edit Zone" : "Add Shipping Zone"}</DialogTitle>
        <DialogDescription>Define regions and delivery estimates for this zone.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="zoneName">Zone Name</FieldLabel>
          <Input id="zoneName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dar es Salaam" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="regions">Regions (comma-separated)</FieldLabel>
          <Input id="regions" value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="e.g. Ilala, Kinondoni, Temeke" />
          <FieldDescription>Separate each region with a comma</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="estimatedDays">Estimated Delivery</FieldLabel>
          <Input id="estimatedDays" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} placeholder="e.g. 1-2 days" required />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{zone ? "Save Changes" : "Add Zone"}</Button>
      </DialogFooter>
    </form>
  )
}

function MethodForm({
  method,
  onSubmit,
}: {
  method?: ShippingMethod
  onSubmit: (data: { name: string; carrier: string; estimated_days: string; is_active: boolean }, id?: string) => void
}) {
  const [name, setName] = React.useState(method?.name ?? "")
  const [carrier, setCarrier] = React.useState(method?.carrier_name ?? "")
  const [estimatedDays, setEstimatedDays] = React.useState(method ? `${method.min_delivery_days}-${method.max_delivery_days} days` : "")
  const [isActive, setIsActive] = React.useState(method?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !carrier.trim() || !estimatedDays.trim()) return
    onSubmit({ name: name.trim(), carrier: carrier.trim(), estimated_days: estimatedDays.trim(), is_active: isActive })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{method ? "Edit Method" : "Add Shipping Method"}</DialogTitle>
        <DialogDescription>Configure a delivery method with carrier and timing.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="methodName">Method Name</FieldLabel>
          <Input id="methodName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Express Delivery" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="carrier">Carrier</FieldLabel>
          <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. G4S, DHL, FastCo" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="methodDays">Estimated Delivery</FieldLabel>
          <Input id="methodDays" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} placeholder="e.g. 1-2 days" required />
        </Field>
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded border-input" />
            Active
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{method ? "Save Changes" : "Add Method"}</Button>
      </DialogFooter>
    </form>
  )
}
