"use client"

import * as React from "react"
import { KeyRound, Search } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Permission = {
  id: string
  code: string
  name: string
  description: string | null
}

export default function PermissionsPage() {
  const { isSuperAdmin } = useAuth()
  const [permissions, setPermissions] = React.useState<Permission[]>([])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isSuperAdmin) {
      return
    }
    api.get<Permission[]>("/admin/permissions")
      .then(setPermissions)
      .catch((error: ApiError) => toast.add({
        title: "Unable to load permissions",
        description: error.detail || "Please try again.",
        type: "error",
      }))
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h2 className="font-semibold">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only a Super Admin can view platform permissions.</p>
        </CardContent>
      </Card>
    )
  }

  const query = search.trim().toLowerCase()
  const filtered = permissions.filter((permission) =>
    !query || [permission.code, permission.name, permission.description ?? ""]
      .some((value) => value.toLowerCase().includes(query))
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Permissions</h2>
        <p className="text-sm text-muted-foreground">Review permission codes exposed by Xerin-Gateway.</p>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> {permissions.length} permissions
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-28" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No permissions found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((permission) => (
                <article key={permission.id} className="rounded-xl border p-4">
                  <Badge variant="secondary" className="font-mono text-[11px]">{permission.code}</Badge>
                  <h3 className="mt-3 font-medium">{permission.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{permission.description || "No description provided."}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
