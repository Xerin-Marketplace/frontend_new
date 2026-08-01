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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { api, type ApiError } from "@/lib/api"
import {
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Clock,
  Search,
  Loader2,
} from "lucide-react"

type PaymentMethod = {
  id: string
  type: string
  provider: string
  account_name: string
  account_number: string
  is_default: boolean
  expiry_date: string | null
}

type PaymentTx = {
  id: string
  order_id: string
  amount: number
  method: string
  status: string
  created_at: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong"
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

const txStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

const methodIcon: Record<string, React.ReactNode> = {
  mobile_money: <Smartphone className="size-5 text-green-600" />,
  card: <CreditCard className="size-5 text-amber-600" />,
  bank: <CreditCard className="size-5 text-blue-600" />,
  cash_on_delivery: <Clock className="size-5 text-blue-600" />,
}

export default function UserPaymentsPage() {
  const [methods, setMethods] = React.useState<PaymentMethod[]>([])
  const [txs, setTxs] = React.useState<PaymentTx[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [deleteMethod, setDeleteMethod] = React.useState<PaymentMethod | null>(null)
  const [search, setSearch] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const fetchMethods = React.useCallback(async () => {
    try {
      const data = await api.get<PaymentMethod[] | { items: PaymentMethod[] } | { data: PaymentMethod[] }>("/payment-methods")
      const list = Array.isArray(data) ? data : (data as { items: PaymentMethod[] }).items ?? (data as { data: PaymentMethod[] }).data ?? []
      setMethods(list)
    } catch {
      setMethods([])
    }
  }, [])

  const fetchTransactions = React.useCallback(async () => {
    try {
      const data = await api.get<PaymentTx[] | { items: PaymentTx[] } | { data: PaymentTx[] }>("/payments")
      const list = Array.isArray(data) ? data : (data as { items: PaymentTx[] }).items ?? (data as { data: PaymentTx[] }).data ?? []
      setTxs(list)
    } catch {
      setTxs([])
    }
  }, [])

  React.useEffect(() => {
    Promise.all([fetchMethods(), fetchTransactions()])
      .finally(() => setLoading(false))
  }, [fetchMethods, fetchTransactions])

  const filteredTx = React.useMemo(() => {
    if (!search) return txs
    const term = search.toLowerCase()
    return txs.filter((t) => t.order_id.toLowerCase().includes(term) || t.method.toLowerCase().includes(term))
  }, [txs, search])

  const handleAdd = async (data: {
    type: string
    provider: string
    account_name: string
    account_number: string
    expiry_date?: string
    is_default: boolean
  }) => {
    setAdding(true)
    try {
      await api.post("/payment-methods", data)
      toast.add({ title: "Payment method added!", description: `${data.provider} has been saved.`, type: "success" })
      setAddOpen(false)
      fetchMethods()
    } catch (err) {
      toast.add({ title: "Failed to add method", description: getApiError(err), type: "error" })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await api.delete(`/payment-methods/${id}`)
      toast.add({ title: "Method removed", description: "Payment method has been deleted.", type: "success" })
      setDeleteMethod(null)
      fetchMethods()
    } catch (err) {
      toast.add({ title: "Failed to remove", description: getApiError(err), type: "error" })
    } finally {
      setDeleting(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/payment-methods/${id}`, { is_default: true })
      toast.add({ title: "Default method set", description: "Your default payment method has been updated.", type: "success" })
      fetchMethods()
    } catch (err) {
      toast.add({ title: "Failed to set default", description: getApiError(err), type: "error" })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-12 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
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
                <AddMethodForm onSubmit={handleAdd} loading={adding} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {methods.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
              <CreditCard className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No payment methods saved</p>
                <p className="text-xs text-muted-foreground">Add a card or mobile money account for faster checkout</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    {methodIcon[method.type] ?? <CreditCard className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{method.provider}</span>
                      {method.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {method.account_name} • {method.account_number.replace(/\d(?=\d{4})/g, "*")}
                      {method.expiry_date ? ` • Exp: ${method.expiry_date}` : ""}
                    </div>
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
          )}
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
                <TableHead>Order ID</TableHead>
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
                filteredTx.map((tx) => {
                  const statusCfg = txStatusConfig[tx.status] ?? { label: tx.status, variant: "secondary" as const }
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.order_id.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize">{tx.method.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium">{formatPrice(Number(tx.amount))}</TableCell>
                      <TableCell><Badge variant={statusCfg.variant}>{statusCfg.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  )
                })
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
            <DialogDescription>Remove <strong>{deleteMethod?.provider}</strong>? You won&apos;t be able to use it for checkout.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" loading={deleting} onClick={() => deleteMethod && handleDelete(deleteMethod.id)}>
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
  loading,
}: {
  onSubmit: (data: {
    type: string
    provider: string
    account_name: string
    account_number: string
    expiry_date?: string
    is_default: boolean
  }) => void
  loading: boolean
}) {
  const [type, setType] = React.useState("mobile_money")
  const [provider, setProvider] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [expiryDate, setExpiryDate] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider.trim() || !accountName.trim() || !accountNumber.trim()) return
    onSubmit({
      type,
      provider: provider.trim(),
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      expiry_date: type === "card" ? expiryDate.trim() || undefined : undefined,
      is_default: isDefault,
    })
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
            <button type="button" onClick={() => setType("mobile_money")} className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${type === "mobile_money" ? "border-primary bg-primary/5" : ""}`}>
              <Smartphone className="size-4" /> Mobile Money
            </button>
            <button type="button" onClick={() => setType("card")} className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${type === "card" ? "border-primary bg-primary/5" : ""}`}>
              <CreditCard className="size-4" /> Card
            </button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="provider">Provider</FieldLabel>
          <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder={type === "card" ? "e.g. Visa" : "e.g. M-Pesa"} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="account_name">Account Name</FieldLabel>
          <Input id="account_name" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={type === "card" ? "Name on card" : "Account holder name"} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="account_number">Account Number</FieldLabel>
          <Input id="account_number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={type === "card" ? "Card number" : "Phone number"} required />
        </Field>
        {type === "card" && (
          <Field>
            <FieldLabel htmlFor="expiry_date">Expiry Date</FieldLabel>
            <Input id="expiry_date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="MM/YY" />
          </Field>
        )}
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded border-input" />
            Set as default payment method
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" loading={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
        </Button>
      </DialogFooter>
    </form>
  )
}
