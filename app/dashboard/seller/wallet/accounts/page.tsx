"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
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
  Loader2,
  Shield,
  Smartphone,
  CheckCircle2,
  Star,
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

type PaginatedPayoutAccounts = {
  total: number
  page: number
  page_size: number
  results: PayoutAccount[]
}

const MOBILE_MONEY_PROVIDERS = [
  { value: "M-Pesa", label: "M-Pesa (Vodacom)", prefix: "07", color: "bg-red-500" },
  { value: "Airtel Money", label: "Airtel Money", prefix: "068", color: "bg-red-600" },
  { value: "Tigo Pesa", label: "Tigo Pesa (Halotel)", prefix: "065", color: "bg-blue-500" },
  { value: "Halopesa", label: "Halopesa", prefix: "062", color: "bg-green-500" },
  { value: "TTCL Pesa", label: "TTCL Pesa", prefix: "073", color: "bg-purple-500" },
  { value: "Zantel EzyPesa", label: "EzyPesa (Zantel)", prefix: "077", color: "bg-amber-500" },
] as const

const BANK_PROVIDERS = [
  "CRDB Bank",
  "NMB Bank",
  "NBC (National Bank of Commerce)",
  "Stanbic Bank",
  "Standard Chartered Bank",
  "Barclays Bank",
  "Exim Bank",
  "Bank of Africa (BOA)",
  "KCB Bank Tanzania",
  "Equity Bank Tanzania",
  "TPB Bank",
  "Akiba Commercial Bank",
  "Mufin Bank",
  "DCB Commercial Bank",
  "Maendeleo Bank",
  "Stanbic Bank Tanzania",
] as const

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num
  return `•••• •••• ${num.slice(-4)}`
}

function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "")
  return /^(\+?255|0)[67]\d{8}$/.test(cleaned)
}

function getProviderColor(provider: string): string {
  const found = MOBILE_MONEY_PROVIDERS.find((p) => p.value === provider)
  return found?.color ?? "bg-muted"
}

function getProviderIcon(accountType: string) {
  return accountType === "mobile" ? Smartphone : CreditCard
}

function getProviderLabel(accountType: string, provider: string): string {
  if (accountType === "mobile") {
    const found = MOBILE_MONEY_PROVIDERS.find((p) => p.value === provider)
    return found?.label ?? provider
  }
  return provider
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
    api.get<PaginatedPayoutAccounts>("/sellers/payout-accounts?page=1&page_size=100")
      .then((val) => {
        setAccounts(Array.isArray(val?.results) ? val.results : Array.isArray(val) ? val : [])
      })
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
      toast.add({ title: "Account added!", description: `${data.provider} account has been added successfully.`, type: "success" })
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

  const handleSetDefault = async (id: string) => {
    setActionLoading(true)
    try {
      await api.post(`/sellers/payout-accounts/${id}/default`, {})
      setAccounts((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
      toast.add({ title: "Default account updated", description: "Your default payout account has been changed.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to update default", description: getApiError(err), type: "error" })
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
          <DialogContent className="sm:max-w-[520px]">
            <AccountForm onSubmit={handleAddAccount} actionLoading={actionLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
        <Shield className="size-5 shrink-0 text-green-600" />
        <div className="text-sm">
          <p className="font-medium text-green-700">Secured with bank-level encryption</p>
          <p className="text-xs text-green-600/80">Your account details are encrypted and never shared with third parties.</p>
        </div>
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
          {accounts.map((account) => {
            const ProviderIcon = getProviderIcon(account.account_type)
            const providerColor = account.account_type === "mobile" ? getProviderColor(account.provider) : "bg-blue-600"
            return (
              <Card key={account.id} className={`relative overflow-hidden ${account.is_default ? "border-primary/50" : ""}`}>
                {account.is_default && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Default
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${providerColor} text-white`}>
                        <ProviderIcon className="size-5" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{getProviderLabel(account.account_type, account.provider)}</span>
                        <div className="mt-0.5 text-xs text-muted-foreground">
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
                      <span className="text-muted-foreground">{account.account_type === "mobile" ? "Phone Number" : "Account Number"}</span>
                      <span className="font-mono font-medium">{maskAccountNumber(account.account_number)}</span>
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
                  {!account.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      disabled={actionLoading}
                      onClick={() => handleSetDefault(account.id)}
                    >
                      <Star className="size-3" />
                      Set as Default
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
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
  const [accountType, setAccountType] = React.useState("mobile")
  const [provider, setProvider] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  const phoneValid = accountType === "mobile" ? validatePhoneNumber(accountNumber) : accountNumber.trim().length >= 5
  const formValid = provider.trim() && accountName.trim() && accountNumber.trim() && phoneValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return
    const cleanedNumber = accountType === "mobile"
      ? accountNumber.replace(/[\s-]/g, "")
      : accountNumber.trim()
    onSubmit({ account_type: accountType, provider: provider.trim(), account_name: accountName.trim(), account_number: cleanedNumber, is_default: isDefault })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Payout Account</DialogTitle>
        <DialogDescription>Enter your bank or mobile money details for receiving payouts.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        {/* Account Type Toggle */}
        <Field>
          <FieldLabel>Account Type</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setAccountType("mobile"); setProvider(""); setAccountNumber("") }}
              disabled={actionLoading}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                accountType === "mobile"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              <Smartphone className="size-4" />
              Mobile Money
            </button>
            <button
              type="button"
              onClick={() => { setAccountType("bank"); setProvider(""); setAccountNumber("") }}
              disabled={actionLoading}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                accountType === "bank"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              <CreditCard className="size-4" />
              Bank Account
            </button>
          </div>
        </Field>

        {/* Provider */}
        <Field>
          <FieldLabel htmlFor="provider">
            {accountType === "mobile" ? "Mobile Money Provider" : "Bank Name"}
          </FieldLabel>
          {accountType === "mobile" ? (
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={actionLoading}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>Select provider...</option>
              {MOBILE_MONEY_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={actionLoading}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>Select bank...</option>
              {BANK_PROVIDERS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </Field>

        {/* Account Holder Name */}
        <Field>
          <FieldLabel htmlFor="accountName">Account Holder Name</FieldLabel>
          <Input
            id="accountName"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, accountName: true }))}
            placeholder="e.g. Acme Trading Co."
            required
            disabled={actionLoading}
          />
        </Field>

        {/* Account Number / Phone */}
        <Field>
          <FieldLabel htmlFor="accountNumber">
            {accountType === "mobile" ? "Phone Number" : "Account Number"}
          </FieldLabel>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, accountNumber: true }))}
            placeholder={accountType === "mobile" ? "e.g. 0712 345 678" : "e.g. 0150-1234-5678"}
            required
            className="font-mono"
            disabled={actionLoading}
          />
          {accountType === "mobile" && touched.accountNumber && accountNumber && !phoneValid && (
            <FieldDescription className="text-red-500">
              Enter a valid Tanzanian phone number (e.g. 0712345678 or +255712345678)
            </FieldDescription>
          )}
          {accountType === "mobile" && phoneValid && accountNumber && (
            <FieldDescription className="text-green-600">
              <CheckCircle2 className="inline size-3 mr-1" />
              Valid phone number
            </FieldDescription>
          )}
        </Field>

        {/* Default Checkbox */}
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} disabled={actionLoading} className="size-4 rounded border-input" />
            Set as default payout account
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading || !formValid}>
          {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add Account
        </Button>
      </DialogFooter>
    </form>
  )
}
