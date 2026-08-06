"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderTree,
  ImageIcon,
  LayoutList,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TableSkeleton } from "@/components/skeletons"

export type CatalogManagementView = "product-categories" | "business-categories" | "brands"

type CatalogRecord = {
  id: string
  name: string
  slug: string
  description?: string | null
  active?: boolean
  parent_id?: string | null
  image_url?: string | null
  thumbnail_url?: string | null
  created_at: string
}

type ProductReference = { category_id: string | null }
type CategoryRow = CatalogRecord & { depth: number; childCount: number }

const config = {
  "product-categories": {
    title: "Product Categories",
    description: "Build the category hierarchy used by sellers and storefront filters.",
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

function buildCategoryRows(records: CatalogRecord[], expanded: Set<string>): CategoryRow[] {
  const ids = new Set(records.map((record) => record.id))
  const children = new Map<string | null, CatalogRecord[]>()
  for (const record of records) {
    const parent = record.parent_id && ids.has(record.parent_id) ? record.parent_id : null
    const group = children.get(parent) ?? []
    group.push(record)
    children.set(parent, group)
  }
  for (const group of children.values()) group.sort((a, b) => a.name.localeCompare(b.name))

  const rows: CategoryRow[] = []
  const visit = (record: CatalogRecord, depth: number) => {
    const directChildren = children.get(record.id) ?? []
    rows.push({ ...record, depth, childCount: directChildren.length })
    if (expanded.has(record.id)) directChildren.forEach((child) => visit(child, depth + 1))
  }
  ;(children.get(null) ?? []).forEach((record) => visit(record, 0))
  return rows
}

export function CatalogManagement({ view }: { view: CatalogManagementView }) {
  const settings = config[view]
  const isProductCategories = view === "product-categories"
  const entityLabel = view === "brands" ? "brand" : "category"
  const { hasPermission, isSuperAdmin } = useAuth()
  const canCreate = isSuperAdmin || hasPermission(settings.createPermission)
  const canDelete = isSuperAdmin || hasPermission(settings.deletePermission)
  const canUpdate = settings.canUpdate && (isSuperAdmin || hasPermission("can_update_business_categories"))
  const [records, setRecords] = React.useState<CatalogRecord[]>([])
  const [products, setProducts] = React.useState<ProductReference[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [treeView, setTreeView] = React.useState(true)
  const [editing, setEditing] = React.useState<CatalogRecord | null>(null)
  const [deleting, setDeleting] = React.useState<CatalogRecord | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [parentId, setParentId] = React.useState("")
  const [active, setActive] = React.useState(true)
  const [image, setImage] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingBusy, setDeletingBusy] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    const categoriesRequest = api.get<CatalogRecord[]>(settings.endpoint)
    const productsRequest = isProductCategories
      ? api.get<ProductReference[]>("/products").catch(() => [] as ProductReference[])
      : Promise.resolve([] as ProductReference[])

    Promise.all([categoriesRequest, productsRequest])
      .then(([nextRecords, nextProducts]) => {
        setRecords(nextRecords)
        setProducts(nextProducts)
        if (isProductCategories) setExpanded(new Set(nextRecords.map((record) => record.id)))
      })
      .catch((error) => toast.add({ title: `Unable to load ${settings.title.toLowerCase()}`, description: message(error), type: "error" }))
      .finally(() => setLoading(false))
  }, [isProductCategories, settings.endpoint, settings.title])

  React.useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  React.useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }, [imagePreview])

  const resetImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImage(null)
    setImagePreview(null)
  }

  const openCreate = () => {
    setEditing(null)
    setName("")
    setSlug("")
    setDescription("")
    setParentId("")
    setActive(true)
    resetImage()
    setFormOpen(true)
  }

  const openEdit = (record: CatalogRecord) => {
    setEditing(record)
    setName(record.name)
    setSlug(record.slug)
    setDescription(record.description ?? "")
    setActive(record.active ?? true)
    setFormOpen(true)
  }

  const chooseImage = (file: File | null) => {
    resetImage()
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.add({ title: "Choose an image file", description: "PNG, JPG, WEBP, or another browser-supported image is required.", type: "error" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ title: "Image is too large", description: "Choose an image smaller than 5 MB.", type: "error" })
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const finalSlug = slug || slugify(name)
    if (!name.trim() || !finalSlug) return
    setSaving(true)
    try {
      if (editing && settings.canUpdate) {
        await api.patch(`${settings.endpoint}/${editing.id}`, { name: name.trim(), slug: finalSlug, description: description || null, active })
      } else if (isProductCategories) {
        const formData = new FormData()
        formData.append("name", name.trim())
        formData.append("slug", finalSlug)
        if (parentId) formData.append("parent_id", parentId)
        if (image) formData.append("image", image)
        await api.upload(`${settings.endpoint}/with-image`, formData)
      } else {
        const payload = view === "business-categories"
          ? { name: name.trim(), slug: finalSlug, description: description || null, active }
          : { name: name.trim(), slug: finalSlug }
        await api.post(settings.endpoint, payload)
      }
      toast.add({ title: editing ? "Updated successfully" : `${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} created`, description: isProductCategories ? "The category is now available to sellers and storefront filters." : undefined, type: "success" })
      setFormOpen(false)
      resetImage()
      load()
    } catch (error) {
      toast.add({ title: "Unable to save", description: message(error), type: "error" })
    } finally { setSaving(false) }
  }

  const childCount = React.useCallback((record: CatalogRecord) => records.filter((item) => item.parent_id === record.id).length, [records])
  const productCount = React.useCallback((record: CatalogRecord) => products.filter((product) => product.category_id === record.id).length, [products])
  const deleteBlocked = deleting ? childCount(deleting) > 0 || productCount(deleting) > 0 : false

  const remove = async () => {
    if (!deleting || deleteBlocked) return
    setDeletingBusy(true)
    try {
      await api.delete(`${settings.endpoint}/${deleting.id}`)
      setRecords((items) => items.filter((item) => item.id !== deleting.id))
      toast.add({ title: `${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} deleted`, type: "success" })
      setDeleting(null)
    } catch (error) {
      toast.add({ title: "Unable to delete", description: message(error), type: "error" })
    } finally { setDeletingBusy(false) }
  }

  const parentNames = React.useMemo(() => new Map(records.map((record) => [record.id, record.name])), [records])
  const rows = React.useMemo(() => buildCategoryRows(records, treeView ? expanded : new Set(records.map((record) => record.id))), [expanded, records, treeView])
  const query = search.trim().toLowerCase()
  const filtered = (isProductCategories ? rows : records).filter((record) => !query || [record.name, record.slug, record.description ?? "", record.parent_id ? parentNames.get(record.parent_id) ?? "" : ""].some((value) => value.toLowerCase().includes(query)))
  const rootCount = records.filter((record) => !record.parent_id).length
  const imageCount = records.filter((record) => record.image_url || record.thumbnail_url).length

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">{settings.title}</h2><p className="text-sm text-muted-foreground">{settings.description}</p></div>
        {canCreate && <Button onClick={openCreate}><Plus className="size-4" /> Add {view === "brands" ? "Brand" : "Category"}</Button>}
      </div>

      {isProductCategories && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={<FolderTree className="size-4" />} label="Total categories" value={records.length} />
          <StatCard icon={<FolderOpen className="size-4" />} label="Top-level categories" value={rootCount} />
          <StatCard icon={<ImageIcon className="size-4" />} label="Categories with images" value={imageCount} />
        </div>
      )}

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">{view === "brands" ? <Tags className="size-4" /> : <FolderTree className="size-4" />} {records.length} records</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isProductCategories && (
              <div className="flex rounded-lg border p-1">
                <Button type="button" size="sm" variant={treeView ? "secondary" : "ghost"} onClick={() => setTreeView(true)}><FolderTree className="size-4" /> Tree</Button>
                <Button type="button" size="sm" variant={!treeView ? "secondary" : "ghost"} onClick={() => setTreeView(false)}><LayoutList className="size-4" /> List</Button>
              </div>
            )}
            <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." className="pl-9" /></div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={8} cols={6} /> : filtered.length === 0 && !query ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted"><FolderTree className="size-7 text-muted-foreground" /></div>
              <h3 className="font-semibold">No {settings.title.toLowerCase()} yet</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{isProductCategories ? "Create the first top-level category, then add subcategories to build your marketplace taxonomy." : `Create the first ${entityLabel} to get started.`}</p>
              {canCreate && <Button className="mt-5" onClick={openCreate}><Plus className="size-4" /> Add first {entityLabel}</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead>{view === "business-categories" && <TableHead>Status</TableHead>}{isProductCategories && <><TableHead>Parent</TableHead><TableHead>Products</TableHead></>}<TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No records match “{search}”.</TableCell></TableRow> : filtered.map((record) => {
                  const category = record as CategoryRow
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2" style={isProductCategories && treeView ? { paddingLeft: `${category.depth * 24}px` } : undefined}>
                          {isProductCategories && treeView && (category.childCount > 0 ? <Button type="button" size="icon-sm" variant="ghost" onClick={() => toggleExpanded(record.id)} aria-label={expanded.has(record.id) ? `Collapse ${record.name}` : `Expand ${record.name}`}>{expanded.has(record.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</Button> : <span className="size-8" />)}
                          {isProductCategories && <CategoryImage record={record} />}
                          <div><div className="font-medium">{record.name}</div>{record.description && <div className="max-w-md truncate text-xs text-muted-foreground">{record.description}</div>}{isProductCategories && category.childCount > 0 && <div className="text-xs text-muted-foreground">{category.childCount} subcategor{category.childCount === 1 ? "y" : "ies"}</div>}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{record.slug}</TableCell>
                      {view === "business-categories" && <TableCell><Badge variant={record.active ? "default" : "secondary"}>{record.active ? "Active" : "Inactive"}</Badge></TableCell>}
                      {isProductCategories && <><TableCell className="text-sm">{record.parent_id ? parentNames.get(record.parent_id) ?? "Unknown parent" : <Badge variant="outline">Top level</Badge>}</TableCell><TableCell><span className="inline-flex items-center gap-1.5 text-sm"><Package className="size-3.5 text-muted-foreground" /> {productCount(record)}</span></TableCell></>}
                      <TableCell className="text-xs text-muted-foreground">{new Date(record.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-1">{canUpdate && <Button size="icon-sm" variant="ghost" onClick={() => openEdit(record)}><Pencil className="size-4" /></Button>}{canDelete && <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={() => setDeleting(record)}><Trash2 className="size-4" /></Button>}</div></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetImage() }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={save}>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {view === "brands" ? "Brand" : "Category"}</DialogTitle>{isProductCategories && <DialogDescription>Create a reusable category for sellers and storefront navigation.</DialogDescription>}</DialogHeader>
            <FieldGroup>
              {isProductCategories && (
                <Field><FieldLabel>Category image</FieldLabel><label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed p-3 transition-colors hover:bg-muted/50"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{imagePreview ? <img src={imagePreview} alt="Category preview" className="size-full object-cover" /> : <Upload className="size-5 text-muted-foreground" />}</div><div className="min-w-0"><div className="text-sm font-medium">{image?.name ?? "Upload category image"}</div><div className="text-xs text-muted-foreground">PNG, JPG or WEBP, up to 5 MB</div></div><input className="sr-only" type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} /></label></Field>
              )}
              <Field><FieldLabel>Name</FieldLabel><Input value={name} onChange={(event) => { setName(event.target.value); if (!editing) setSlug(slugify(event.target.value)) }} placeholder="e.g. Electronics" required /></Field>
              <Field><FieldLabel>Slug</FieldLabel><Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="electronics" required /><p className="text-xs text-muted-foreground">Used in URLs and integrations. Lowercase letters, numbers, and hyphens work best.</p></Field>
              {view === "business-categories" && <><Field><FieldLabel>Description</FieldLabel><Input value={description} onChange={(event) => setDescription(event.target.value)} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label></>}
              {isProductCategories && <Field><FieldLabel>Parent category</FieldLabel><select value={parentId} onChange={(event) => setParentId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">None — top-level category</option>{records.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select><p className="text-xs text-muted-foreground">Choose a parent only when creating a subcategory.</p></Field>}
            </FieldGroup>
            <DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? `Save ${entityLabel}` : `Create ${entityLabel}`}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deletingBusy) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle><AlertDialogDescription>{deleteBlocked ? "This category cannot be deleted yet. Reassign the dependencies below first." : `This permanently removes the ${entityLabel}${isProductCategories ? " from the seller catalog and storefront filters" : ""}.`}</AlertDialogDescription></AlertDialogHeader>
          {deleting && <div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Subcategories</div><div className="mt-1 text-lg font-semibold">{childCount(deleting)}</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Products</div><div className="mt-1 text-lg font-semibold">{productCount(deleting)}</div></div></div>}
          <AlertDialogFooter><AlertDialogCancel disabled={deletingBusy}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteBlocked || deletingBusy} onClick={() => void remove()}>{deletingBusy ? "Deleting..." : `Delete ${entityLabel}`}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div><div><div className="text-xl font-semibold leading-none">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div></CardContent></Card>
}

function CategoryImage({ record }: { record: CatalogRecord }) {
  const source = record.thumbnail_url || record.image_url
  return <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">{source ? <img src={source} alt="" className="size-full object-cover" /> : <Folder className="size-4 text-muted-foreground" />}</div>
}
