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
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Loader2,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton } from "@/components/skeletons"

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

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerPayoutAccountsPage() {
  const [accounts, setAccounts] = React.useState<PayoutAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [deleteAccount, setDeleteAccount] = React.useState<PayoutAccount | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    api.get<PayoutAccount[]>("/sellers/payout-accounts")
      .then(setAccounts)
      .finally(() => setLoading(false))
  }, [])

  const handleAddAccount = async (data: { account_type: string; provider: string; account_name: string; account_number: string; is_default: boolean }) => {
    setActionLoading(true)
    try {
      const newAccount = await api.post<PayoutAccount>("/sellers/payout-accounts", {
        account_type: data.account_type,
        provider: data.provider,
        account_name: data.account_name,
        account_number: data.account_number,
        currency: "TZS",
        is_default: data.is_default,
      })
      setAccounts((prev) => [...prev, newAccount])
      setAccountOpen(false)
      toast.add({ title: "Account added!", description: `${data.provider} account has been added.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to add account", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    setActionLoading(true)
    try {
      await api.delete(`/sellers/payout-accounts/${id}`)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      setDeleteAccount(null)
      toast.add({ title: "Account deleted", description: "Payout account has been removed.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to delete account", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-muted/20 animate-pulse" />
          ))}
        </div>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Payout Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage your bank and mobile money accounts for receiving payouts.</p>
        </div>
        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" /> Add Account</Button>} />
          <DialogContent className="sm:max-w-[480px]">
            <AccountForm onSubmit={handleAddAccount} actionLoading={actionLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <CreditCard className="size-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No payout accounts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add a bank account or mobile money account to start receiving payouts.</p>
              <Button className="mt-4" onClick={() => setAccountOpen(true)}>
                <Plus className="size-4" /> Add Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      {account.account_type === "mobile" ? (
                        <Banknote className="size-5 text-muted-foreground" />
                      ) : (
                        <CreditCard className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{account.provider}</span>
                        {account.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                        {account.account_type === "mobile" ? "Mobile Money" : "Bank Account"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={actionLoading}
                    onClick={() => setDeleteAccount(account)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Holder</span>
                    <span className="font-medium">{account.account_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono font-medium">{account.account_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">{account.currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Added</span>
                    <span className="font-medium">{new Date(account.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Account Dialog */}
      <Dialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccount(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteAccount?.provider}</strong> ({deleteAccount?.account_number})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteAccount && handleDeleteAccount(deleteAccount.id)}>
              {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AccountForm({
  onSubmit,
  actionLoading,
}: {
  onSubmit: (data: { account_type: string; provider: string; account_name: string; account_number: string; is_default: boolean }) => void
  actionLoading: boolean
}) {
  const [accountType, setAccountType] = React.useState("bank")
  const [provider, setProvider] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider.trim() || !accountName.trim() || !accountNumber.trim()) return
    onSubmit({ account_type: accountType, provider: provider.trim(), account_name: accountName.trim(), account_number: accountNumber.trim(), is_default: isDefault })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Payout Account</DialogTitle>
        <DialogDescription>Enter your bank or mobile money details for receiving payouts.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="accountType">Account Type</FieldLabel>
          <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)} disabled={actionLoading} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
            <option value="bank">Bank Account</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="provider">{accountType === "mobile" ? "Mobile Money Provider" : "Bank Name"}</FieldLabel>
          <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder={accountType === "mobile" ? "e.g. M-Pesa, Airtel Money" : "e.g. CRDB Bank"} required disabled={actionLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="accountName">Account Holder Name</FieldLabel>
          <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Acme Trading Co." required disabled={actionLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="accountNumber">{accountType === "mobile" ? "Phone Number" : "Account Number"}</FieldLabel>
          <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={accountType === "mobile" ? "e.g. 0712 345 678" : "0150-1234-5678"} required className="font-mono" disabled={actionLoading} />
        </Field>
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} disabled={actionLoading} className="size-4 rounded border-input" />
            Set as default payout account
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add Account
        </Button>
      </DialogFooter>
    </form>
  )
}
