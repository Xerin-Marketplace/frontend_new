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
  Search,
  Boxes,
  AlertTriangle,
  PackageX,
  Plus,
  Minus,
  Pencil,
  TrendingUp,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"

type InventoryItem = {
  inventory_id: string
  product_id: string
  product_name: string
  product_sku: string
  variant_id: string | null
  variant_name: string | null
  variant_sku: string | null
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  warehouse_location: string | null
  restock_date: string | null
  unit_price: number
  inventory_value: number
  is_low_stock: boolean
  is_out_of_stock: boolean
  updated_at: string | null
}

type InventoryListResponse = {
  total: number
  page: number
  page_size: number
  results: InventoryItem[]
}

type InventorySummary = {
  total_products: number
  total_variants: number
  total_stock_units: number
  reserved_units: number
  available_units: number
  low_stock_variants: number
  out_of_stock_variants: number
  inventory_value: number
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerInventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [summary, setSummary] = React.useState<InventorySummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "low" | "out">("all")
  const [restockItem, setRestockItem] = React.useState<InventoryItem | null>(null)
  const [adjustItem, setAdjustItem] = React.useState<InventoryItem | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      api.get<InventoryListResponse>("/seller/inventory"),
      api.get<InventorySummary>("/seller/inventory/summary"),
    ])
      .then(([listRes, sumRes]) => {
        setItems(listRes.results)
        setSummary(sumRes)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load inventory",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    let result = items
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (i) => i.product_name.toLowerCase().includes(term) || i.product_sku.toLowerCase().includes(term)
      )
    }
    if (filter === "low") {
      result = result.filter((i) => i.is_low_stock)
    } else if (filter === "out") {
      result = result.filter((i) => i.is_out_of_stock)
    }
    return result
  }, [items, search, filter])

  const handleRestock = async (inventoryId: string, qty: number, date: string) => {
    setActionLoading(true)
    try {
      const updated = await api.post<InventoryItem>(`/seller/inventory/${inventoryId}/restock`, {
        quantity: qty,
        restock_date: date || undefined,
      })
      setItems((prev) => prev.map((i) => (i.inventory_id === inventoryId ? updated : i)))
      setRestockItem(null)
      toast.add({
        title: "Stock restocked!",
        description: `${updated.product_name}: +${qty} units added.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to restock",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdjust = async (inventoryId: string, newQty: number, reason: string) => {
    setActionLoading(true)
    try {
      const adjustment = newQty - (items.find((i) => i.inventory_id === inventoryId)?.quantity ?? 0)
      const updated = await api.post<InventoryItem>(`/seller/inventory/${inventoryId}/adjust`, {
        adjustment,
        reason,
      })
      setItems((prev) => prev.map((i) => (i.inventory_id === inventoryId ? updated : i)))
      setAdjustItem(null)
      toast.add({
        title: "Stock adjusted!",
        description: `${updated.product_name}: set to ${newQty} units.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to adjust",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Card>
          <TableSkeleton rows={6} cols={10} />
        </Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-sm text-muted-foreground">
          Track stock levels, restock products, and monitor low stock alerts.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SKUs</CardTitle>
            <Boxes className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_products ?? 0}</div>
            <div className="text-xs text-muted-foreground">{summary?.total_stock_units ?? 0} units total</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary?.inventory_value ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <Badge variant="secondary" className="text-xs">{summary?.low_stock_variants ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.low_stock_variants ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="size-3" /> needs restock
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <Badge variant="destructive" className="text-xs">{summary?.out_of_stock_variants ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary?.out_of_stock_variants ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PackageX className="size-3" /> unavailable
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "low" | "out")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Items</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">{filtered.length} items</div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.inventory_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.product_sku}</TableCell>
                    <TableCell>{item.variant_name || "—"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.reserved_quantity}</TableCell>
                    <TableCell>
                      <span className={
                        item.is_out_of_stock ? "text-red-500 font-medium" :
                        item.is_low_stock ? "text-yellow-600 font-medium" : ""
                      }>
                        {item.available_quantity}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(item.unit_price)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(item.inventory_value)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.warehouse_location || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => setRestockItem(item)}
                        >
                          <Plus className="size-3" />
                          Restock
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading}
                          onClick={() => setAdjustItem(item)}
                          title="Adjust"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={!!restockItem} onOpenChange={(open) => !open && setRestockItem(null)}>
        <DialogContent className="sm:max-w-[440px]">
          {restockItem && (
            <RestockForm
              item={restockItem}
              onSubmit={(qty, date) => handleRestock(restockItem.inventory_id, qty, date)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="sm:max-w-[440px]">
          {adjustItem && (
            <AdjustForm
              item={adjustItem}
              onSubmit={(qty, reason) => handleAdjust(adjustItem.inventory_id, qty, reason)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RestockForm({
  item,
  onSubmit,
}: {
  item: InventoryItem
  onSubmit: (qty: number, date: string) => void
}) {
  const [qty, setQty] = React.useState("")
  const [date, setDate] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(qty)
    if (!n || n <= 0) return
    onSubmit(n, date)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Restock — {item.product_name}</DialogTitle>
        <DialogDescription>
          Current stock: {item.quantity} units. Add more to inventory.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="qty">Quantity to Add</FieldLabel>
          <Input
            id="qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="e.g. 50"
            required
            min="1"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="date">Expected Restock Date</FieldLabel>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <FieldDescription>Optional — when will stock arrive?</FieldDescription>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit"><Plus className="size-4" /> Add Stock</Button>
      </DialogFooter>
    </form>
  )
}

function AdjustForm({
  item,
  onSubmit,
}: {
  item: InventoryItem
  onSubmit: (qty: number, reason: string) => void
}) {
  const [qty, setQty] = React.useState(item.quantity.toString())
  const [reason, setReason] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(qty)
    if (isNaN(n) || n < 0 || !reason.trim()) return
    onSubmit(n, reason.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Adjust Stock — {item.product_name}</DialogTitle>
        <DialogDescription>
          Set exact quantity. Use for corrections, damages, or losses.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="adj-qty">New Quantity</FieldLabel>
          <Input
            id="adj-qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
            min="0"
          />
          <FieldDescription>Current: {item.quantity} units</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="reason">Reason</FieldLabel>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Damaged goods, cycle count, theft"
            required
          />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Save Adjustment</Button>
      </DialogFooter>
    </form>
  )
}
