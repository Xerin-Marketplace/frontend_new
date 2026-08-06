"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  ArrowDownToLine,
  Loader2,
  Wallet,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton } from "@/components/skeletons"
import { useRouter } from "next/navigation"

type PayoutAccount = {
  id: string
  seller_id: string
  account_type: string
  provider: string
  account_name: string
  account_number: string
  currency: string
  is_default: boolean
  created_at: string
}

type PaginatedPayoutAccounts = {
  total: number
  page: number
  page_size: number
  results: PayoutAccount[]
}

type WalletResponse = {
  id: string
  seller_id: string
  currency: string
  pending_balance: number
  available_balance: number
  reserved_balance: number
  paid_out_balance: number
  refunded_balance: number
  debt_balance: number
  is_frozen: boolean
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerNewPayoutPage() {
  const router = useRouter()
  const [accounts, setAccounts] = React.useState<PayoutAccount[]>([])
  const [wallet, setWallet] = React.useState<WalletResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [amount, setAmount] = React.useState("")
  const [accountId, setAccountId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<PaginatedPayoutAccounts>("/sellers/payout-accounts?page=1&page_size=100"),
      api.get<WalletResponse>("/wallet/me"),
    ]).then(([accRes, wRes]) => {
      if (accRes.status === "fulfilled") {
        const val = accRes.value
        const accs = Array.isArray(val?.results) ? val.results : Array.isArray(val) ? val : []
        setAccounts(accs)
        const defaultAcc = accs.find((a) => a.is_default) ?? accs[0]
        if (defaultAcc) setAccountId(defaultAcc.id)
      }
      if (wRes.status === "fulfilled") setWallet(wRes.value)
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!n || n <= 0 || n > (wallet?.available_balance ?? 0) || !accountId) return
    setSubmitting(true)
    try {
      await api.post("/wallet/me/payouts", {
        payout_account_id: accountId,
        amount: n,
        note: note.trim() || undefined,
      })
      toast.add({ title: "Payout requested!", description: `${formatPrice(n)} is being processed.`, type: "success" })
      router.push("/dashboard/seller/wallet/payouts")
    } catch (err) {
      toast.add({ title: "Failed to request payout", description: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="mx-auto max-w-md">
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          <div className="mt-4 h-32 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </PageSkeleton>
    )
  }

  const balance = wallet?.available_balance ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold tracking-tight">Request Payout</h2>
        <p className="text-sm text-muted-foreground">Withdraw funds from your available balance.</p>
      </div>

      {accounts.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-8 text-center">
            <Wallet className="mx-auto size-12 text-amber-600" />
            <p className="mt-4 text-sm text-amber-700">You need a payout account before requesting a payout.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/seller/wallet/accounts")}>
              Add Payout Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(balance)}</span>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="amount">Amount (TSh)</FieldLabel>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 100000"
                      required
                      min="1"
                      max={balance}
                      disabled={submitting}
                    />
                    <FieldDescription>Maximum: {formatPrice(balance)}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="account">Payout Account</FieldLabel>
                    <select
                      id="account"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      disabled={submitting}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.provider} — {a.account_number.slice(-4)}{a.is_default ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="note">Note (Optional)</FieldLabel>
                    <Input
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for reference"
                      disabled={submitting}
                    />
                  </Field>
                </FieldGroup>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" type="button" disabled={submitting} onClick={() => router.push("/dashboard/seller/wallet/payouts")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !amount || !accountId} className="flex-1">
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
                    Request Payout
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
