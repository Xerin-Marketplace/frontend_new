import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="h-8 w-48 mb-6 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border p-3">
              <div className="size-24 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-4 rounded-xl border p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
