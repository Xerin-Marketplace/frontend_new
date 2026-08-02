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
import { Plus, Tag } from "lucide-react"

type Brand = {
  id: string
  name: string
  description: string | null
  created_at: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong"
}

export default function SellerBrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const fetchBrands = React.useCallback(() => {
    setLoading(true)
    api.get<Brand[]>("/products/brands")
      .then(setBrands)
      .catch((err) => {
        toast.add({ title: "Failed to load brands", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleAdd = async (name: string, description: string) => {
    setSaving(true)
    try {
      const created = await api.post<Brand>("/products/brands", { name, description: description || undefined })
      setBrands((prev) => [...prev, created])
      setAddOpen(false)
      toast.add({ title: "Brand created!", description: `${name} has been added.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to create brand", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brands</h2>
          <p className="text-sm text-muted-foreground">Browse and manage product brands.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4" /> Add Brand</Button>} />
          <DialogContent className="sm:max-w-[440px]">
            <BrandForm onSubmit={handleAdd} saving={saving} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No brands yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Tag className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{brand.name}</div>
                    {brand.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{brand.description}</p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs">
                      {new Date(brand.created_at).toLocaleDateString()}
                    </Badge>
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

function BrandForm({ onSubmit, saving }: { onSubmit: (name: string, description: string) => void; saving: boolean }) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), description.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Brand</DialogTitle>
        <DialogDescription>Create a new product brand.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="brandName">Brand Name</FieldLabel>
          <Input id="brandName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samsung" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="brandDesc">Description</FieldLabel>
          <Input id="brandDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Brand"}</Button>
      </DialogFooter>
    </form>
  )
}
