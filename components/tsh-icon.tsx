import { cn } from "@/lib/utils"

export function TShIcon({ className }: { className?: string }) {
  return <span aria-label="Tanzanian shilling" className={cn("inline-flex items-center justify-center font-bold leading-none", className)}>TSh</span>
}
