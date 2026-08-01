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
import { toast } from "@/components/ui/toast"
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Home,
  Briefcase,
  Star,
} from "lucide-react"

type Address = {
  id: string
  label: string
  recipient_name: string
  phone: string
  address_line: string
  city: string
  region: string
  postal_code: string
  is_default: boolean
}

const mockAddresses: Address[] = [
  { id: "1", label: "Home", recipient_name: "Asha Mwangi", phone: "+255 712 345 678", address_line: "123 Mlimani Street", city: "Dar es Salaam", region: "Dar es Salaam", postal_code: "14110", is_default: true },
  { id: "2", label: "Office", recipient_name: "Asha Mwangi", phone: "+255 712 345 678", address_line: "45 Ohio Street, 5th Floor", city: "Dar es Salaam", region: "Dar es Salaam", postal_code: "14110", is_default: false },
  { id: "3", label: "Mom's Place", recipient_name: "Grace Mwangi", phone: "+255 722 111 222", address_line: "78 Kijenge Area", city: "Arusha", region: "Arusha", postal_code: "23100", is_default: false },
]

const labelIcons: Record<string, React.ReactNode> = {
  Home: <Home className="size-4" />,
  Office: <Briefcase className="size-4" />,
}

export default function UserAddressesPage() {
  const [addresses, setAddresses] = React.useState<Address[]>(mockAddresses)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editAddr, setEditAddr] = React.useState<Address | null>(null)
  const [deleteAddr, setDeleteAddr] = React.useState<Address | null>(null)

  const handleSave = (data: Omit<Address, "id">, id?: string) => {
    if (id) {
      setAddresses((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a))
      if (data.is_default) {
        setAddresses((prev) => prev.map((a) => a.id !== id ? { ...a, is_default: false } : a))
      }
      setEditAddr(null)
      toast.add({ title: "Address updated!", description: `${data.label} has been updated.`, type: "success" })
    } else {
      const newAddr = { ...data, id: crypto.randomUUID() }
      if (data.is_default) {
        setAddresses((prev) => [...prev.map((a) => ({ ...a, is_default: false })), newAddr])
      } else {
        setAddresses((prev) => [...prev, newAddr])
      }
      setAddOpen(false)
      toast.add({ title: "Address added!", description: `${data.label} has been saved.`, type: "success" })
    }
  }

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    setDeleteAddr(null)
    toast.add({ title: "Address deleted", description: "The address has been removed.", type: "success" })
  }

  const handleSetDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
    toast.add({ title: "Default address set", description: "Your default shipping address has been updated.", type: "success" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Addresses</h2>
          <p className="text-sm text-muted-foreground">Manage shipping addresses for faster checkout.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" /> Add Address</Button>} />
          <DialogContent className="sm:max-w-[480px]">
            <AddressForm onSubmit={(data) => handleSave(data)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Address Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((addr) => (
          <Card key={addr.id} className={addr.is_default ? "border-primary" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    {labelIcons[addr.label] ?? <MapPin className="size-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{addr.label}</span>
                      {addr.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{addr.recipient_name}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditAddr(addr)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteAddr(addr)} className="text-red-500">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div>{addr.address_line}</div>
                <div>{addr.city}, {addr.region} {addr.postal_code}</div>
                <div className="font-medium text-foreground">{addr.phone}</div>
              </div>
              {!addr.is_default && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => handleSetDefault(addr.id)}>
                  <Star className="size-3" /> Set as Default
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editAddr} onOpenChange={(open) => !open && setEditAddr(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {editAddr && <AddressForm address={editAddr} onSubmit={(data) => handleSave(data, editAddr.id)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteAddr} onOpenChange={(open) => !open && setDeleteAddr(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Address?</DialogTitle>
            <DialogDescription>Remove <strong>{deleteAddr?.label}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => deleteAddr && handleDelete(deleteAddr.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddressForm({
  address,
  onSubmit,
}: {
  address?: Address
  onSubmit: (data: Omit<Address, "id">) => void
}) {
  const [label, setLabel] = React.useState(address?.label ?? "")
  const [recipientName, setRecipientName] = React.useState(address?.recipient_name ?? "")
  const [phone, setPhone] = React.useState(address?.phone ?? "")
  const [addressLine, setAddressLine] = React.useState(address?.address_line ?? "")
  const [city, setCity] = React.useState(address?.city ?? "")
  const [region, setRegion] = React.useState(address?.region ?? "")
  const [postalCode, setPostalCode] = React.useState(address?.postal_code ?? "")
  const [isDefault, setIsDefault] = React.useState(address?.is_default ?? false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !recipientName.trim() || !phone.trim() || !addressLine.trim() || !city.trim()) return
    onSubmit({
      label: label.trim(),
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      address_line: addressLine.trim(),
      city: city.trim(),
      region: region.trim(),
      postal_code: postalCode.trim(),
      is_default: isDefault,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
        <DialogDescription>Save a shipping address for faster checkout.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="label">Label</FieldLabel>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Home, Office" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="recipient">Recipient Name</FieldLabel>
            <Input id="recipient" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255..." required />
        </Field>
        <Field>
          <FieldLabel htmlFor="addressLine">Address Line</FieldLabel>
          <Input id="addressLine" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="region">Region</FieldLabel>
            <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="postal">Postal Code</FieldLabel>
            <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </Field>
        </div>
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded border-input" />
            Set as default shipping address
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{address ? "Save Changes" : "Add Address"}</Button>
      </DialogFooter>
    </form>
  )
}
