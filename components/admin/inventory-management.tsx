"use client"

import * as React from "react"
import { Boxes, PackageSearch, Plus } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Inventory = { id: string; product_id: string; variant_id: string | null; quantity: number; reserved_quantity: number; available_quantity: number; warehouse_location: string | null; low_stock_threshold: number; restock_date: string | null; updated_at: string | null }
const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

export function InventoryManagement() {
  const { isSuperAdmin, hasPermission } = useAuth()
  const canManage = isSuperAdmin || hasPermission("inventory:manage")
  const [productId, setProductId] = React.useState("")
  const [record, setRecord] = React.useState<Inventory | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [dialog, setDialog] = React.useState<"create" | "update" | null>(null)

  const lookup = async () => {
    if (!productId.trim()) return
    setLoading(true); setRecord(null)
    try { setRecord(await api.get<Inventory>(`/inventory/product/${productId.trim()}`)) }
    catch (error) { toast.add({ title: "Inventory not found", description: message(error), type: "error" }) }
    finally { setLoading(false) }
  }

  return <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Inventory Operations</h2><p className="text-sm text-muted-foreground">Inspect and maintain inventory using the product inventory endpoints.</p></div>{canManage && <Button onClick={() => setDialog("create")}><Plus className="size-4" /> Create inventory</Button>}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackageSearch className="size-4" /> Product inventory lookup</CardTitle><p className="text-sm text-muted-foreground">The Gateway currently has seller-scoped inventory lists, but no admin-wide inventory list. Enter a product ID to retrieve its inventory safely.</p></CardHeader><CardContent className="space-y-5"><div className="flex max-w-xl gap-2"><Input value={productId} onChange={(event)=>setProductId(event.target.value)} placeholder="Product ID" onKeyDown={(event)=>event.key === "Enter" && void lookup()} /><Button onClick={()=>void lookup()} disabled={loading}>{loading ? "Loading..." : "Find inventory"}</Button></div>{record && <div className="space-y-5 rounded-lg border p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 font-semibold"><Boxes className="size-4" /> Inventory record</div><div className="mt-1 break-all text-xs text-muted-foreground">{record.id}</div></div>{canManage && <Button variant="outline" onClick={()=>setDialog("update")}>Update inventory</Button>}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Quantity" value={record.quantity} /><Detail label="Reserved" value={record.reserved_quantity} /><Detail label="Available" value={record.available_quantity} /><Detail label="Low-stock threshold" value={record.low_stock_threshold} /><Detail label="Warehouse" value={record.warehouse_location ?? "—"} /><Detail label="Variant ID" value={record.variant_id ?? "—"} /></div></div>}</CardContent></Card>
    <InventoryDialog mode={dialog} open={dialog !== null} record={record} productId={productId} onOpenChange={(open)=>!open && setDialog(null)} onSaved={(saved)=>{ setRecord(saved); setProductId(saved.product_id); setDialog(null) }} />
  </div>
}

function Detail({ label, value }: { label:string; value:string|number }) { return <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div> }

function InventoryDialog({ mode, open, record, productId, onOpenChange, onSaved }: { mode:"create"|"update"|null; open:boolean; record:Inventory|null; productId:string; onOpenChange:(open:boolean)=>void; onSaved:(record:Inventory)=>void }) {
  const [form,setForm] = React.useState({ product_id:"", variant_id:"", quantity:"0", reserved_quantity:"0", warehouse_location:"", low_stock_threshold:"5" })
  const [saving,setSaving] = React.useState(false)
  React.useEffect(()=>{ setForm({ product_id: record?.product_id ?? productId, variant_id:record?.variant_id ?? "", quantity:String(record?.quantity ?? 0), reserved_quantity:String(record?.reserved_quantity ?? 0), warehouse_location:record?.warehouse_location ?? "", low_stock_threshold:String(record?.low_stock_threshold ?? 5) }) },[mode,record,productId])
  const set=(name:keyof typeof form,value:string)=>setForm((current)=>({...current,[name]:value}))
  const submit=async(event:React.FormEvent)=>{ event.preventDefault(); if(!mode)return; setSaving(true); const payload={ ...(mode === "create" ? { product_id:form.product_id, variant_id:form.variant_id || null }:{}), quantity:Number(form.quantity), reserved_quantity:Number(form.reserved_quantity), warehouse_location:form.warehouse_location || null, low_stock_threshold:Number(form.low_stock_threshold) }; try { const saved=mode === "create" ? await api.post<Inventory>("/inventory",payload) : await api.put<Inventory>(`/inventory/${record?.id}`,payload); toast.add({title:`Inventory ${mode === "create" ? "created" : "updated"}`,type:"success"}); onSaved(saved) } catch(error){ toast.add({title:"Unable to save inventory",description:message(error),type:"error"}) } finally{setSaving(false)} }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>{mode === "create" ? "Create" : "Update"} inventory</DialogTitle></DialogHeader><FieldGroup>{mode === "create" && <><Field><FieldLabel>Product ID</FieldLabel><Input required value={form.product_id} onChange={(e)=>set("product_id",e.target.value)} /></Field><Field><FieldLabel>Variant ID (optional)</FieldLabel><Input value={form.variant_id} onChange={(e)=>set("variant_id",e.target.value)} /></Field></>}<div className="grid grid-cols-2 gap-4"><Field><FieldLabel>Quantity</FieldLabel><Input type="number" min="0" required value={form.quantity} onChange={(e)=>set("quantity",e.target.value)} /></Field><Field><FieldLabel>Reserved quantity</FieldLabel><Input type="number" min="0" required value={form.reserved_quantity} onChange={(e)=>set("reserved_quantity",e.target.value)} /></Field></div><Field><FieldLabel>Warehouse location</FieldLabel><Input value={form.warehouse_location} onChange={(e)=>set("warehouse_location",e.target.value)} /></Field><Field><FieldLabel>Low-stock threshold</FieldLabel><Input type="number" min="0" required value={form.low_stock_threshold} onChange={(e)=>set("low_stock_threshold",e.target.value)} /></Field></FieldGroup><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter></form></DialogContent></Dialog>
}
