"use client"

import * as React from "react"
import { BadgePercent, Plus, Pencil, Trash2, Search } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { TableSkeleton } from "@/components/skeletons"

export type CommerceRulesView = "commissions" | "coupons"

type Commission = { id: string; name: string; scope: string; rule_type: string; rate: string; seller_id: string | null; category_id: string | null; product_id: string | null; priority: number; is_active: boolean; starts_at: string | null; ends_at: string | null; created_at: string }
type Coupon = { id: string; code: string; description: string | null; discount_type: string; discount_value: string; minimum_order_amount: string | null; maximum_discount_amount: string | null; usage_limit: number | null; usage_count: number; is_active: boolean; valid_from: string | null; valid_until: string | null; created_at: string }

function errorText(error: unknown) { return (error as ApiError)?.detail || "The request could not be completed." }
function localDate(value: string | null) { return value ? value.slice(0, 16) : "" }

export function CommerceRules({ view }: { view: CommerceRulesView }) {
  const isCommission = view === "commissions"
  const endpoint = isCommission ? "/commissions/rules" : "/coupons"
  const { hasPermission, isSuperAdmin } = useAuth()
  const canWrite = isSuperAdmin || hasPermission(isCommission ? "commissions:write" : "coupons:write")
  const [records, setRecords] = React.useState<(Commission | Coupon)[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Commission | Coupon | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [kind, setKind] = React.useState("percentage")
  const [value, setValue] = React.useState("")
  const [scope, setScope] = React.useState("global")
  const [targetId, setTargetId] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [minimum, setMinimum] = React.useState("")
  const [maximum, setMaximum] = React.useState("")
  const [usageLimit, setUsageLimit] = React.useState("")
  const [startsAt, setStartsAt] = React.useState("")
  const [endsAt, setEndsAt] = React.useState("")
  const [active, setActive] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<(Commission | Coupon)[]>(endpoint)
      .then(setRecords)
      .catch((error) => toast.add({ title: "Unable to load records", description: errorText(error), type: "error" }))
      .finally(() => setLoading(false))
  }, [endpoint])
  React.useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setName(""); setKind("percentage"); setValue(""); setScope("global"); setTargetId(""); setDescription(""); setMinimum(""); setMaximum(""); setUsageLimit(""); setStartsAt(""); setEndsAt(""); setActive(true); setDialogOpen(true) }
  const openEdit = (record: Commission | Coupon) => {
    setEditing(record); setActive(record.is_active)
    if (isCommission) { const item = record as Commission; setName(item.name); setKind(item.rule_type); setValue(item.rate); setScope(item.scope); setTargetId(item.seller_id ?? item.category_id ?? item.product_id ?? ""); setStartsAt(localDate(item.starts_at)); setEndsAt(localDate(item.ends_at)) }
    else { const item = record as Coupon; setName(item.code); setDescription(item.description ?? ""); setKind(item.discount_type); setValue(item.discount_value); setMinimum(item.minimum_order_amount ?? ""); setMaximum(item.maximum_discount_amount ?? ""); setUsageLimit(item.usage_limit?.toString() ?? ""); setStartsAt(localDate(item.valid_from)); setEndsAt(localDate(item.valid_until)) }
    setDialogOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true)
    try {
      if (isCommission) {
        const createPayload = { name, scope, rule_type: kind, rate: Number(value), seller_id: scope === "seller" ? targetId : null, category_id: scope === "category" ? targetId : null, product_id: scope === "product" ? targetId : null, priority: 0, is_active: active, starts_at: startsAt ? new Date(startsAt).toISOString() : null, ends_at: endsAt ? new Date(endsAt).toISOString() : null }
        if (editing) await api.patch(`${endpoint}/${editing.id}`, { name, rate: Number(value), is_active: active, starts_at: createPayload.starts_at, ends_at: createPayload.ends_at })
        else await api.post(endpoint, createPayload)
      } else {
        const payload = { description: description || null, discount_type: kind, discount_value: Number(value), minimum_order_amount: minimum ? Number(minimum) : null, maximum_discount_amount: maximum ? Number(maximum) : null, usage_limit: usageLimit ? Number(usageLimit) : null, valid_from: startsAt ? new Date(startsAt).toISOString() : null, valid_until: endsAt ? new Date(endsAt).toISOString() : null, is_active: active }
        if (editing) await api.put(`${endpoint}/${editing.id}`, payload)
        else await api.post(endpoint, { code: name.toUpperCase(), ...payload })
      }
      toast.add({ title: editing ? "Updated successfully" : "Created successfully", type: "success" }); setDialogOpen(false); load()
    } catch (error) { toast.add({ title: "Unable to save", description: errorText(error), type: "error" }) } finally { setSaving(false) }
  }

  const removeCoupon = async (record: Coupon) => {
    if (!window.confirm(`Delete coupon ${record.code}?`)) return
    try { await api.delete(`${endpoint}/${record.id}`); setRecords((items) => items.filter((item) => item.id !== record.id)); toast.add({ title: "Coupon deleted", type: "success" }) }
    catch (error) { toast.add({ title: "Unable to delete", description: errorText(error), type: "error" }) }
  }

  const query = search.toLowerCase().trim()
  const filtered = records.filter((record) => !query || (isCommission ? (record as Commission).name : (record as Coupon).code).toLowerCase().includes(query))
  const title = isCommission ? "Commission Rules" : "Coupons"

  return <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="text-sm text-muted-foreground">{isCommission ? "Configure platform commission calculation rules." : "Create and manage marketplace discount coupons."}</p></div>{canWrite && <Button onClick={openCreate}><Plus className="size-4" /> Add {isCommission ? "Rule" : "Coupon"}</Button>}</div>
    <Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><BadgePercent className="size-4" /> {records.length} records</CardTitle><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="pl-9" /></div></CardHeader><CardContent>{loading ? <TableSkeleton rows={8} cols={7} /> : <Table><TableHeader><TableRow><TableHead>{isCommission ? "Name" : "Code"}</TableHead><TableHead>Type</TableHead>{isCommission && <TableHead>Scope</TableHead>}<TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>Validity / Usage</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> : filtered.map((record) => { const item = record as Commission & Coupon; return <TableRow key={record.id}><TableCell className="font-medium">{isCommission ? item.name : item.code}</TableCell><TableCell>{isCommission ? item.rule_type : item.discount_type}</TableCell>{isCommission && <TableCell><Badge variant="outline">{item.scope}</Badge></TableCell>}<TableCell>{isCommission ? item.rate : item.discount_value}{(isCommission ? item.rule_type : item.discount_type) === "percentage" ? "%" : ""}</TableCell><TableCell><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{isCommission ? (item.ends_at ? `Ends ${new Date(item.ends_at).toLocaleDateString()}` : "No expiry") : `${item.usage_count ?? 0}/${item.usage_limit ?? "∞"} used`}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{canWrite && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(record)}><Pencil className="size-4" /></Button>}{canWrite && !isCommission && <Button variant="ghost" size="icon-sm" className="text-red-500" onClick={() => void removeCoupon(record as Coupon)}><Trash2 className="size-4" /></Button>}</div></TableCell></TableRow> })}</TableBody></Table>}</CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-xl"><form onSubmit={submit}><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {isCommission ? "Commission Rule" : "Coupon"}</DialogTitle></DialogHeader><FieldGroup><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>{isCommission ? "Name" : "Coupon code"}</FieldLabel><Input value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(editing && !isCommission)} required /></Field><Field><FieldLabel>Type</FieldLabel><select value={kind} onChange={(event) => setKind(event.target.value)} disabled={Boolean(editing && isCommission)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="percentage">Percentage</option><option value={isCommission ? "fixed" : "fixed_amount"}>Fixed amount</option></select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Value</FieldLabel><Input type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required /></Field>{isCommission ? <Field><FieldLabel>Scope</FieldLabel><select value={scope} onChange={(event) => setScope(event.target.value)} disabled={Boolean(editing)} className="h-9 rounded-md border bg-background px-3 text-sm">{["global","category","seller","product"].map((option) => <option key={option}>{option}</option>)}</select></Field> : <Field><FieldLabel>Usage limit</FieldLabel><Input type="number" min="1" value={usageLimit} onChange={(event) => setUsageLimit(event.target.value)} /></Field>}</div>{isCommission && scope !== "global" && <Field><FieldLabel>{scope} ID</FieldLabel><Input value={targetId} onChange={(event) => setTargetId(event.target.value)} required /></Field>}{!isCommission && <><Field><FieldLabel>Description</FieldLabel><Input value={description} onChange={(event) => setDescription(event.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Minimum order amount</FieldLabel><Input type="number" min="0" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></Field><Field><FieldLabel>Maximum discount</FieldLabel><Input type="number" min="0" value={maximum} onChange={(event) => setMaximum(event.target.value)} /></Field></div></>}<div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Starts at</FieldLabel><Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field><Field><FieldLabel>Ends at</FieldLabel><Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label></FieldGroup><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}
