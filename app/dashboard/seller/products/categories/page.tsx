"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { api, type ApiError } from "@/lib/api"
import { Plus, Folder } from "lucide-react"

type Category = {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  created_at: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong"
}

export default function SellerCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const fetchCategories = React.useCallback(() => {
    setLoading(true)
    api.get<Category[]>("/products/categories")
      .then(setCategories)
      .catch((err) => {
        toast.add({ title: "Failed to load categories", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAdd = async (name: string, description: string, parentId: string) => {
    setSaving(true)
    try {
      const created = await api.post<Category>("/products/categories", {
        name,
        description: description || undefined,
        parent_id: parentId || undefined,
      })
      setCategories((prev) => [...prev, created])
      setAddOpen(false)
      toast.add({ title: "Category created!", description: `${name} has been added.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to create category", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">Browse and manage product categories.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4" /> Add Category</Button>} />
          <DialogContent className="sm:max-w-[440px]">
            <CategoryForm categories={categories} onSubmit={handleAdd} saving={saving} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No categories yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Folder className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{cat.name}</div>
                    {cat.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                    )}
                    {cat.parent_id && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Sub-category
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryForm({
  categories,
  onSubmit,
  saving,
}: {
  categories: Category[]
  onSubmit: (name: string, description: string, parentId: string) => void
  saving: boolean
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [parentId, setParentId] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), description.trim(), parentId)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Category</DialogTitle>
        <DialogDescription>Create a new product category.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="catName">Category Name</FieldLabel>
          <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="catDesc">Description</FieldLabel>
          <Input id="catDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </Field>
        <Field>
          <FieldLabel htmlFor="parentCat">Parent Category</FieldLabel>
          <select
            id="parentCat"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">None (top-level)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Category"}</Button>
      </DialogFooter>
    </form>
  )
}
