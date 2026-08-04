"use client"

import * as React from "react"
import { MapPin, PackageSearch, Plus, Search, Truck } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/skeletons"

type Zone = { id: string; name: string; country: string; regions: string[]; cities: string[]; is_active: boolean }
type Method = { id: string; name: string; description: string | null; carrier_name: string | null; min_delivery_days: number; max_delivery_days: number; is_active: boolean }
type Rate = { id: string; zone_id: string; method_id: string; rate_type: string; base_amount: number; amount_per_kg: number | null; free_shipping_threshold: number | null; is_active: boolean }
type Shipment = { id: string; order_id: string; seller_id: string; status: string; carrier_name: string | null; tracking_number: string | null; estimated_delivery_from: string | null; estimated_delivery_to: string | null; created_at: string }
type Tab = "zones" | "methods" | "rates" | "shipments"

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

export function ShippingManagement() {
  const { isSuperAdmin, hasPermission } = useAuth()
  const canWrite = isSuperAdmin || hasPermission("shipping:write")
  const [tab, setTab] = React.useState<Tab>("zones")
  const [zones, setZones] = React.useState<Zone[]>([])
  const [methods, setMethods] = React.useState<Method[]>([])
  const [rates, setRates] = React.useState<Rate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialog, setDialog] = React.useState<Exclude<Tab, "shipments"> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [lookupId, setLookupId] = React.useState("")
  const [shipment, setShipment] = React.useState<Shipment | null>(null)
  const [lookupLoading, setLookupLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [zoneData, methodData, rateData] = await Promise.all([
        api.get<Zone[]>("/shipping/zones"), api.get<Method[]>("/shipping/methods"), api.get<Rate[]>("/shipping/rates"),
      ])
      setZones(zoneData); setMethods(methodData); setRates(rateData)
    } catch (error) {
      toast.add({ title: "Unable to load shipping configuration", description: message(error), type: "error" })
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const lookup = async () => {
    if (!lookupId.trim()) return
    setLookupLoading(true); setShipment(null)
    try { setShipment(await api.get<Shipment>(`/shipping/shipments/${lookupId.trim()}`)) }
    catch (error) { toast.add({ title: "Shipment not found", description: message(error), type: "error" }) }
    finally { setLookupLoading(false) }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "zones", label: "Zones" }, { key: "methods", label: "Methods" }, { key: "rates", label: "Rates" }, { key: "shipments", label: "Shipment lookup" },
  ]

  return <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Shipping Operations</h2><p className="text-sm text-muted-foreground">Configure delivery coverage, methods and rates, or inspect a shipment.</p></div>{canWrite && tab !== "shipments" && <Button onClick={() => setDialog(tab)}><Plus className="size-4" /> Add {tab.slice(0, -1)}</Button>}</div>
    <div className="flex w-fit flex-wrap gap-1 rounded-lg border p-1">{tabs.map((item) => <Button key={item.key} size="sm" variant={tab === item.key ? "default" : "ghost"} onClick={() => setTab(item.key)}>{item.label}</Button>)}</div>
    {tab === "shipments" ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackageSearch className="size-4" /> Shipment lookup</CardTitle><p className="text-sm text-muted-foreground">The Gateway currently provides shipment detail by ID, but no admin-wide shipment list endpoint.</p></CardHeader><CardContent className="space-y-5"><div className="flex max-w-xl gap-2"><Input value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Shipment ID" onKeyDown={(event) => event.key === "Enter" && void lookup()} /><Button onClick={() => void lookup()} disabled={lookupLoading}><Search className="size-4" /> {lookupLoading ? "Looking..." : "Find"}</Button></div>{shipment && <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Shipment" value={shipment.id} /><Detail label="Order" value={shipment.order_id} /><Detail label="Seller" value={shipment.seller_id} /><Detail label="Status" value={shipment.status} /><Detail label="Carrier" value={shipment.carrier_name ?? "—"} /><Detail label="Tracking number" value={shipment.tracking_number ?? "—"} /></div>}</CardContent></Card> : <ShippingTable tab={tab} loading={loading} zones={zones} methods={methods} rates={rates} />}
    <ShippingDialog kind={dialog} open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} zones={zones} methods={methods} saving={saving} onSave={async (payload) => { if (!dialog) return; setSaving(true); try { await api.post(`/shipping/${dialog}`, payload); toast.add({ title: "Shipping configuration created", type: "success" }); setDialog(null); await load() } catch (error) { toast.add({ title: "Unable to save", description: message(error), type: "error" }) } finally { setSaving(false) } }} />
  </div>
}

function Detail({ label, value }: { label: string; value: string }) { return <div><div className="text-xs text-muted-foreground">{label}</div><div className="break-all font-medium">{value}</div></div> }

function ShippingTable({ tab, loading, zones, methods, rates }: { tab: Exclude<Tab,"shipments">; loading: boolean; zones: Zone[]; methods: Method[]; rates: Rate[] }) {
  const records = tab === "zones" ? zones : tab === "methods" ? methods : rates
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">{tab === "zones" ? <MapPin className="size-4" /> : <Truck className="size-4" />} {records.length} {tab}</CardTitle></CardHeader><CardContent>{loading ? <TableSkeleton rows={6} cols={5} /> : <Table><TableHeader><TableRow>{tab === "zones" ? <><TableHead>Name</TableHead><TableHead>Country</TableHead><TableHead>Regions</TableHead></> : tab === "methods" ? <><TableHead>Name</TableHead><TableHead>Carrier</TableHead><TableHead>Delivery</TableHead></> : <><TableHead>Zone</TableHead><TableHead>Method</TableHead><TableHead>Type</TableHead><TableHead>Base amount</TableHead></>}<TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{records.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No {tab} configured.</TableCell></TableRow> : records.map((record) => <TableRow key={record.id}>{tab === "zones" ? <><TableCell className="font-medium">{(record as Zone).name}</TableCell><TableCell>{(record as Zone).country}</TableCell><TableCell>{(record as Zone).regions.join(", ") || "—"}</TableCell></> : tab === "methods" ? <><TableCell className="font-medium">{(record as Method).name}</TableCell><TableCell>{(record as Method).carrier_name ?? "—"}</TableCell><TableCell>{(record as Method).min_delivery_days}–{(record as Method).max_delivery_days} days</TableCell></> : <><TableCell>{(record as Rate).zone_id}</TableCell><TableCell>{(record as Rate).method_id}</TableCell><TableCell>{(record as Rate).rate_type}</TableCell><TableCell>{Number((record as Rate).base_amount).toLocaleString()}</TableCell></>}<TableCell><Badge variant={record.is_active ? "default" : "secondary"}>{record.is_active ? "Active" : "Inactive"}</Badge></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
}

function ShippingDialog({ kind, open, onOpenChange, zones, methods, saving, onSave }: { kind: Exclude<Tab,"shipments"> | null; open: boolean; onOpenChange: (open:boolean)=>void; zones: Zone[]; methods: Method[]; saving:boolean; onSave:(payload:Record<string,unknown>)=>Promise<void> }) {
  const [form, setForm] = React.useState<Record<string,string | boolean>>({ is_active: true, country: "Tanzania", min_delivery_days: "1", max_delivery_days: "7", rate_type: "flat", base_amount: "0" })
  React.useEffect(() => { setForm({ is_active: true, country: "Tanzania", min_delivery_days: "1", max_delivery_days: "7", rate_type: "flat", base_amount: "0" }) }, [kind])
  const field = (name:string) => String(form[name] ?? "")
  const set = (name:string, value:string|boolean) => setForm((current) => ({ ...current, [name]: value }))
  const submit = async (event:React.FormEvent) => { event.preventDefault(); if (!kind) return; const payload:Record<string,unknown> = { ...form }; if (kind === "zones") { payload.regions = field("regions").split(",").map((v)=>v.trim()).filter(Boolean); payload.cities = field("cities").split(",").map((v)=>v.trim()).filter(Boolean) } if (kind === "methods") { payload.min_delivery_days=Number(field("min_delivery_days")); payload.max_delivery_days=Number(field("max_delivery_days")) } if (kind === "rates") { payload.base_amount=Number(field("base_amount")); payload.amount_per_kg=field("amount_per_kg") ? Number(field("amount_per_kg")) : null; payload.free_shipping_threshold=field("free_shipping_threshold") ? Number(field("free_shipping_threshold")) : null } await onSave(payload) }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Add shipping {kind?.slice(0,-1)}</DialogTitle></DialogHeader><FieldGroup>{kind === "zones" && <><Field><FieldLabel>Name</FieldLabel><Input required value={field("name")} onChange={(e)=>set("name",e.target.value)} /></Field><Field><FieldLabel>Country</FieldLabel><Input required value={field("country")} onChange={(e)=>set("country",e.target.value)} /></Field><Field><FieldLabel>Regions (comma-separated)</FieldLabel><Input value={field("regions")} onChange={(e)=>set("regions",e.target.value)} /></Field><Field><FieldLabel>Cities (comma-separated)</FieldLabel><Input value={field("cities")} onChange={(e)=>set("cities",e.target.value)} /></Field></>}{kind === "methods" && <><Field><FieldLabel>Name</FieldLabel><Input required value={field("name")} onChange={(e)=>set("name",e.target.value)} /></Field><Field><FieldLabel>Carrier</FieldLabel><Input value={field("carrier_name")} onChange={(e)=>set("carrier_name",e.target.value)} /></Field><Field><FieldLabel>Description</FieldLabel><Input value={field("description")} onChange={(e)=>set("description",e.target.value)} /></Field><div className="grid grid-cols-2 gap-4"><Field><FieldLabel>Minimum days</FieldLabel><Input type="number" min="0" required value={field("min_delivery_days")} onChange={(e)=>set("min_delivery_days",e.target.value)} /></Field><Field><FieldLabel>Maximum days</FieldLabel><Input type="number" min="0" required value={field("max_delivery_days")} onChange={(e)=>set("max_delivery_days",e.target.value)} /></Field></div></>}{kind === "rates" && <><Field><FieldLabel>Zone</FieldLabel><select required value={field("zone_id")} onChange={(e)=>set("zone_id",e.target.value)} className="h-9 rounded-md border bg-background px-3"><option value="">Select zone</option>{zones.map((z)=><option key={z.id} value={z.id}>{z.name}</option>)}</select></Field><Field><FieldLabel>Method</FieldLabel><select required value={field("method_id")} onChange={(e)=>set("method_id",e.target.value)} className="h-9 rounded-md border bg-background px-3"><option value="">Select method</option>{methods.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Field><Field><FieldLabel>Rate type</FieldLabel><select value={field("rate_type")} onChange={(e)=>set("rate_type",e.target.value)} className="h-9 rounded-md border bg-background px-3"><option value="flat">Flat</option><option value="weight_based">Weight based</option><option value="free">Free</option></select></Field><Field><FieldLabel>Base amount</FieldLabel><Input type="number" min="0" step="0.01" required value={field("base_amount")} onChange={(e)=>set("base_amount",e.target.value)} /></Field><Field><FieldLabel>Amount per kg</FieldLabel><Input type="number" min="0" step="0.01" value={field("amount_per_kg")} onChange={(e)=>set("amount_per_kg",e.target.value)} /></Field><Field><FieldLabel>Free shipping threshold</FieldLabel><Input type="number" min="0" step="0.01" value={field("free_shipping_threshold")} onChange={(e)=>set("free_shipping_threshold",e.target.value)} /></Field></>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e)=>set("is_active",e.target.checked)} /> Active</label></FieldGroup><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter></form></DialogContent></Dialog>
}
