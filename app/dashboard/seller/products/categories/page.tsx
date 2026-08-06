"use client"

import * as React from "react"
import { Folder, FolderTree, ImageIcon, Search } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

type Category = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  thumbnail_url: string | null
  created_at: string
}

function getApiError(error: unknown): string {
  return (error as ApiError)?.detail || "Something went wrong"
}

export default function SellerCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    api.get<Category[]>("/products/categories")
      .then(setCategories)
      .catch((error) => toast.add({ title: "Failed to load categories", description: getApiError(error), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  const names = React.useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const query = search.trim().toLowerCase()
  const filtered = categories.filter((category) => !query || [category.name, category.slug, category.parent_id ? names.get(category.parent_id) ?? "" : ""].some((value) => value.toLowerCase().includes(query)))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Categories</h2>
          <p className="text-sm text-muted-foreground">Browse the marketplace taxonomy managed by Xerin administrators.</p>
        </div>
        <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." className="pl-9" /></div>
      </div>

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Categories are shared across the marketplace. Select them when creating products; contact an administrator if your product does not fit the available taxonomy.
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-14 text-center"><div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">{query ? <Search className="size-5 text-muted-foreground" /> : <FolderTree className="size-5 text-muted-foreground" />}</div><div className="font-medium">{query ? "No matching categories" : "No categories are available yet"}</div><p className="mt-1 text-sm text-muted-foreground">{query ? "Try a different name, slug, or parent category." : "An administrator needs to create the marketplace taxonomy first."}</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category) => {
            const source = category.thumbnail_url || category.image_url
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">{source ? <img src={source} alt="" className="size-full object-cover" /> : <Folder className="size-5 text-muted-foreground" />}</div>
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{category.name}</div><div className="truncate font-mono text-xs text-muted-foreground">{category.slug}</div><div className="mt-2">{category.parent_id ? <Badge variant="outline">{names.get(category.parent_id) ?? "Subcategory"}</Badge> : <Badge variant="secondary"><ImageIcon className="size-3" /> Top level</Badge>}</div></div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
