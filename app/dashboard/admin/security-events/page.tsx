"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Lock,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react"

type SecurityEvent = {
  id: string
  event_type: string
  severity: string
  user_id: string | null
  ip_address: string | null
  description: string | null
  resolved: boolean
  created_at: string
}

type PaginatedSecurityEvents = {
  total: number
  page: number
  page_size: number
  results: SecurityEvent[]
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SecurityEventsPage() {
  const { isSuperAdmin } = useAuth()
  const [events, setEvents] = React.useState<SecurityEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [resolving, setResolving] = React.useState<string | null>(null)
  const pageSize = 20

  React.useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    loadEvents()
  }, [page, isSuperAdmin])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await api.get<PaginatedSecurityEvents>(`/audit-logs/security/events?page=${page}&page_size=${pageSize}`)
      setEvents(res.results)
      setTotal(res.total)
    } catch (err) {
      toast.add({
        title: "Failed to load security events",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (eventId: string) => {
    setResolving(eventId)
    try {
      await api.patch(`/audit-logs/security/events/${eventId}/resolve`)
      toast.add({
        title: "Event resolved",
        description: "Security event has been marked as resolved.",
        type: "success",
      })
      loadEvents()
    } catch (err) {
      toast.add({
        title: "Failed to resolve",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setResolving(null)
    }
  }

  const filteredEvents = React.useMemo(() => {
    if (!search) return events
    const q = search.toLowerCase()
    return events.filter(
      (e) =>
        e.event_type.toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.ip_address || "").toLowerCase().includes(q)
    )
  }, [events, search])

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <AlertCircle className="size-10 text-amber-500" />
        <h2 className="text-lg font-semibold">Super Admin Only</h2>
        <p className="text-sm text-muted-foreground">
          You need super admin privileges to access this page.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security Events</h2>
        <p className="text-sm text-muted-foreground">
          Monitor and resolve security-related events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="size-4" />
                All Security Events
              </CardTitle>
              <CardDescription>{total} total events</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{event.event_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        event.severity === "critical" || event.severity === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : event.severity === "medium"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }
                    >
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{event.description || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{event.ip_address || "—"}</TableCell>
                  <TableCell>
                    {event.resolved ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="size-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Open</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {!event.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={resolving === event.id}
                        onClick={() => handleResolve(event.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No security events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
