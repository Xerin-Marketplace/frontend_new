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
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
} from "lucide-react"

type PaymentMethod = {
  id: string
  type: "card" | "mobile_money"
  label: string
  details: string
  is_default: boolean
}

type PaymentTx = {
  id: string
  order_number: string
  amount: number
  method: string
  status: "completed" | "pending" | "failed"
  created_at: string
}

const mockMethods: PaymentMethod[] = [
  { id: "1", type: "card", label: "Visa ending in 4242", details: "Visa · expires 12/27", is_default: true },
  { id: "2", type: "mobile_money", label: "M-Pesa 0712345678", details: "Vodacom M-Pesa", is_default: false },
  { id: "3", type: "mobile_money", label: "Tigo Pesa 0765432109", details: "Tigo Pesa", is_default: false },
]

const mockTx: PaymentTx[] = [
  { id: "1", order_number: "#ORD-3921", amount: 115000, method: "Visa ****4242", status: "completed", created_at: "2025-08-01 14:35" },
  { id: "2", order_number: "#ORD-3918", amount: 120000, method: "M-Pesa", status: "completed", created_at: "2025-07-28 10:20" },
  { id: "3", order_number: "#ORD-3915", amount: 36000, method: "Tigo Pesa", status: "pending", created_at: "2025-08-01 09:05" },
  { id: "4", order_number: "#ORD-3910", amount: 45000, method: "Visa ****4242", status: "failed", created_at: "2025-07-25 16:25" },
  { id: "5", order_number: "#ORD-3905", amount: 65000, method: "M-Pesa", status: "completed", created_at: "2025-07-20 11:05" },
]

const txStatusConfig: Record<PaymentTx["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
}

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

export default function UserPaymentsPage() {
  const [methods, setMethods] = React.useState<PaymentMethod[]>(mockMethods)
  const [txs] = React.useState<PaymentTx[]>(mockTx)
  const [addOpen, setAddOpen] = React.useState(false)
  const [deleteMethod, setDeleteMethod] = React.useState<PaymentMethod | null>(null)
  const [search, setSearch] = React.useState("")

  const filteredTx = React.useMemo(() => {
    if (!search) return txs
    const term = search.toLowerCase()
    return txs.filter((t) => t.order_number.toLowerCase().includes(term) || t.method.toLowerCase().includes(term))
  }, [txs, search])

  const handleAdd = (data: Omit<PaymentMethod, "id">) => {
    setMethods((prev) => [...prev, { ...data, id: crypto.randomUUID() }])
    setAddOpen(false)
    toast.add({ title: "Payment method added!", description: `${data.label} has been saved.`, type: "success" })
  }

  const handleDelete = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id))
    setDeleteMethod(null)
    toast.add({ title: "Method removed", description: "Payment method has been deleted.", type: "success" })
  }

  const handleSetDefault = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, is_default: m.id === id })))
    toast.add({ title: "Default method set", description: "Your default payment method has been updated.", type: "success" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
        <p className="text-sm text-muted-foreground">Manage your saved payment methods and view transaction history.</p>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Saved Methods</CardTitle>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger render={<Button size="sm"><Plus className="size-4" /> Add Method</Button>} />
              <DialogContent className="sm:max-w-[480px]">
                <AddMethodForm onSubmit={handleAdd} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {methods.map((method) => (
              <div key={method.id} className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  {method.type === "card" ? <CreditCard className="size-5 text-muted-foreground" /> : <Smartphone className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{method.label}</span>
                    {method.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{method.details}</div>
                </div>
                {!method.is_default && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>Set Default</Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteMethod(method)} className="text-red-500">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
              ) : (
                filteredTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.order_number}</TableCell>
                    <TableCell>{tx.method}</TableCell>
                    <TableCell className="font-medium">{formatPrice(tx.amount)}</TableCell>
                    <TableCell><Badge variant={txStatusConfig[tx.status].variant}>{txStatusConfig[tx.status].label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tx.created_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteMethod} onOpenChange={(open) => !open && setDeleteMethod(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove Payment Method?</DialogTitle>
            <DialogDescription>Remove <strong>{deleteMethod?.label}</strong>? You won't be able to use it for checkout.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => deleteMethod && handleDelete(deleteMethod.id)}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddMethodForm({
  onSubmit,
}: {
  onSubmit: (data: Omit<PaymentMethod, "id">) => void
}) {
  const [type, setType] = React.useState<"card" | "mobile_money">("card")
  const [label, setLabel] = React.useState("")
  const [details, setDetails] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !details.trim()) return
    onSubmit({ type, label: label.trim(), details: details.trim(), is_default: isDefault })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogDescription>Save a card or mobile money account for faster checkout.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("card")} className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${type === "card" ? "border-primary bg-primary/5" : ""}`}>
              <CreditCard className="size-4" /> Card
            </button>
            <button type="button" onClick={() => setType("mobile_money")} className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${type === "mobile_money" ? "border-primary bg-primary/5" : ""}`}>
              <Smartphone className="size-4" /> Mobile Money
            </button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="label">Label</FieldLabel>
          <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={type === "card" ? "e.g. Visa ending in 4242" : "e.g. M-Pesa 0712345678"} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="details">Details</FieldLabel>
          <Input id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={type === "card" ? "e.g. Visa · expires 12/27" : "e.g. Vodacom M-Pesa"} required />
        </Field>
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded border-input" />
            Set as default payment method
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit"><Plus className="size-4" /> Add</Button>
      </DialogFooter>
    </form>
  )
}
