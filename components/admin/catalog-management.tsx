"use client"

import * as React from "react"
import { FolderTree, Plus, Search, Tags, Trash2, Pencil, ImageOff } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { TableSkeleton } from "@/components/skeletons"

export type CatalogManagementView = "product-categories" | "business-categories" | "brands"

type CatalogRecord = {
  id: string
  name: string
  slug: string
  description?: string | null
  active?: boolean
  parent_id?: string | null
  created_at: string
}

const config = {
  "product-categories": {
    title: "Product Categories",
    description: "Create the product category hierarchy used by sellers and storefront filters.",
    endpoint: "/admin/product-categories",
    readPermission: "can_view_product_categories",
    createPermission: "can_create_product_categories",
    deletePermission: "can_delete_product_categories",
    canUpdate: false,
  },
  "business-categories": {
    title: "Business Categories",
    description: "Manage business classifications used during seller registration.",
    endpoint: "/admin/business-categories",
    readPermission: "can_view_business_categories",
    createPermission: "can_create_business_categories",
    deletePermission: "can_delete_business_categories",
    canUpdate: true,
  },
  brands: {
    title: "Brands",
    description: "Manage brands available when sellers list products.",
    endpoint: "/admin/brands",
    readPermission: "can_view_brands",
    createPermission: "can_create_brands",
    deletePermission: "can_delete_brands",
    canUpdate: false,
  },
} as const

function message(error: unknown) {
  return (error as ApiError)?.detail || "The request could not be completed."
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function CatalogManagement({ view }: { view: CatalogManagementView }) {
  const settings = config[view]
  const { hasPermission, isSuperAdmin } = useAuth()
  const canCreate = isSuperAdmin || hasPermission(settings.createPermission)
  const canDelete = isSuperAdmin || hasPermission(settings.deletePermission)
  const canUpdate = settings.canUpdate && (isSuperAdmin || hasPermission("can_update_business_categories"))
  const [records, setRecords] = React.useState<CatalogRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [editing, setEditing] = React.useState<CatalogRecord | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [parentId, setParentId] = React.useState("")
  const [active, setActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<CatalogRecord[]>(settings.endpoint)
      .then(setRecords)
      .catch((error) => toast.add({ title: `Unable to load ${settings.title.toLowerCase()}`, description: message(error), type: "error" }))
      .finally(() => setLoading(false))
  }, [settings.endpoint, settings.title])

  React.useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setName(""); setSlug(""); setDescription(""); setParentId(""); setActive(true); setFormOpen(true)
  }
  const openEdit = (record: CatalogRecord) => {
    setEditing(record); setName(record.name); setSlug(record.slug); setDescription(record.description ?? ""); setActive(record.active ?? true); setFormOpen(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const finalSlug = slug || slugify(name)
    if (!name.trim() || !finalSlug) return
    setSaving(true)
    try {
      if (editing && settings.canUpdate) {
        await api.patch(`${settings.endpoint}/${editing.id}`, { name: name.trim(), slug: finalSlug, description: description || null, active })
      } else {
        const payload = view === "business-categories"
          ? { name: name.trim(), slug: finalSlug, description: description || null, active }
          : view === "product-categories"
            ? { name: name.trim(), slug: finalSlug, parent_id: parentId || null }
            : { name: name.trim(), slug: finalSlug }
        await api.post(settings.endpoint, payload)
      }
      toast.add({ title: editing ? "Updated successfully" : "Created successfully", type: "success" })
      setFormOpen(false)
      load()
    } catch (error) {
      toast.add({ title: "Unable to save", description: message(error), type: "error" })
    } finally { setSaving(false) }
  }

  const remove = async (record: CatalogRecord) => {
    if (!window.confirm(`Delete ${record.name}?`)) return
    try {
      await api.delete(`${settings.endpoint}/${record.id}`)
      setRecords((items) => items.filter((item) => item.id !== record.id))
      toast.add({ title: "Deleted successfully", type: "success" })
    } catch (error) { toast.add({ title: "Unable to delete", description: message(error), type: "error" }) }
  }

  const query = search.trim().toLowerCase()
  const filtered = records.filter((record) => !query || [record.name, record.slug, record.description ?? ""].some((value) => value.toLowerCase().includes(query)))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">{settings.title}</h2><p className="text-sm text-muted-foreground">{settings.description}</p></div>
        {canCreate && <Button onClick={openCreate}><Plus className="size-4" /> Add {view === "brands" ? "Brand" : "Category"}</Button>}
      </div>
      {view === "product-categories" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <ImageOff className="mt-0.5 size-4 shrink-0" /><p>Category image upload is not shown because the current Xerin-Gateway category schema has no image field.</p>
        </div>
      )}
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">{view === "brands" ? <Tags className="size-4" /> : <FolderTree className="size-4" />} {records.length} records</CardTitle>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="pl-9" /></div>
        </CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={8} cols={5} /> : (
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead>{view === "business-categories" && <TableHead>Status</TableHead>}{view === "product-categories" && <TableHead>Parent</TableHead>}<TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> : filtered.map((record) => <TableRow key={record.id}><TableCell><div className="font-medium">{record.name}</div>{record.description && <div className="max-w-md truncate text-xs text-muted-foreground">{record.description}</div>}</TableCell><TableCell className="font-mono text-xs">{record.slug}</TableCell>{view === "business-categories" && <TableCell><Badge variant={record.active ? "default" : "secondary"}>{record.active ? "Active" : "Inactive"}</Badge></TableCell>}{view === "product-categories" && <TableCell className="font-mono text-xs">{record.parent_id?.slice(0, 8) ?? "—"}</TableCell>}<TableCell className="text-xs text-muted-foreground">{new Date(record.created_at).toLocaleDateString()}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{canUpdate && <Button size="icon-sm" variant="ghost" onClick={() => openEdit(record)}><Pencil className="size-4" /></Button>}{canDelete && <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={() => void remove(record)}><Trash2 className="size-4" /></Button>}</div></TableCell></TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent><form onSubmit={save}><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {view === "brands" ? "Brand" : "Category"}</DialogTitle></DialogHeader><FieldGroup><Field><FieldLabel>Name</FieldLabel><Input value={name} onChange={(event) => { setName(event.target.value); if (!editing) setSlug(slugify(event.target.value)) }} required /></Field><Field><FieldLabel>Slug</FieldLabel><Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></Field>{view === "business-categories" && <><Field><FieldLabel>Description</FieldLabel><Input value={description} onChange={(event) => setDescription(event.target.value)} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label></>}{view === "product-categories" && <Field><FieldLabel>Parent category</FieldLabel><select value={parentId} onChange={(event) => setParentId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">No parent</option>{records.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></Field>}</FieldGroup><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  )
}
