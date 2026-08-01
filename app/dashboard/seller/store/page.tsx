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
  Store,
  Save,
  Globe,
  FileText,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

type SellerResponse = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  business_location: string | null
  business_country: string | null
  business_region: string | null
  business_city: string | null
  business_address: string | null
  product_description: string | null
  years_in_business: string | null
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  agreement_accepted: boolean
  created_at: string
}

type StoreData = {
  business_name: string
  business_email: string
  business_phone: string
  description: string
  website: string
  address_line: string
  city: string
  region: string
  country: string
  product_description: string
  years_in_business: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

const emptyData: StoreData = {
  business_name: "",
  business_email: "",
  business_phone: "",
  description: "",
  website: "",
  address_line: "",
  city: "",
  region: "",
  country: "",
  product_description: "",
  years_in_business: "",
}

export default function SellerStorePage() {
  const [data, setData] = React.useState<StoreData>(emptyData)
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.get<SellerResponse>("/sellers/me")
      .then((seller) => {
        setData({
          business_name: seller.business_name ?? "",
          business_email: seller.contact_email ?? "",
          business_phone: seller.contact_phone ?? "",
          description: seller.business_description ?? "",
          website: seller.website_url ?? "",
          address_line: seller.business_address ?? "",
          city: seller.business_city ?? "",
          region: seller.business_region ?? "",
          country: seller.business_country ?? "",
          product_description: seller.product_description ?? "",
          years_in_business: seller.years_in_business ?? "",
        })
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load store profile",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof StoreData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch("/sellers/me", {
        business_name: data.business_name,
        business_description: data.description,
        business_country: data.country,
        business_region: data.region,
        business_city: data.city,
        business_address: data.address_line,
        product_description: data.product_description,
        years_in_business: data.years_in_business,
        website_url: data.website,
        contact_email: data.business_email,
        contact_phone: data.business_phone,
      })
      toast.add({
        title: "Store profile saved!",
        description: "Your business information has been updated successfully.",
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to save",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Store Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your business information, store appearance, and policies.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="size-4" /> Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="business_name">Business Name</FieldLabel>
                <Input id="business_name" value={data.business_name} onChange={(e) => update("business_name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="years_in_business">Years in Business</FieldLabel>
                <Input id="years_in_business" value={data.years_in_business} onChange={(e) => update("years_in_business", e.target.value)} placeholder="e.g. 5 years" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="business_email">Business Email</FieldLabel>
                <Input id="business_email" type="email" value={data.business_email} onChange={(e) => update("business_email", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="business_phone">Business Phone</FieldLabel>
                <Input id="business_phone" value={data.business_phone} onChange={(e) => update("business_phone", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <FieldDescription>Shown on your public store page</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input id="website" value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Product Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" /> Product Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product_description">What do you sell?</FieldLabel>
              <textarea
                id="product_description"
                value={data.product_description}
                onChange={(e) => update("product_description", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <FieldDescription>Describe the types of products you sell</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4" /> Business Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address_line">Address Line</FieldLabel>
              <Input id="address_line" value={data.address_line} onChange={(e) => update("address_line", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" value={data.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="region">Region</FieldLabel>
                <Input id="region" value={data.region} onChange={(e) => update("region", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Input id="country" value={data.country} onChange={(e) => update("country", e.target.value)} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Save Button at bottom */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="size-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  )
}
