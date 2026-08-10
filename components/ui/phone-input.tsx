"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string
  onChange: (value: string) => void
}

/**
 * Phone input with a fixed +255 prefix.
 * The user only types the local number (e.g. 712 345 678).
 * The full value stored is always "+255XXXXXXXXX".
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Strip the +255 prefix for display
    const localValue = React.useMemo(() => {
      if (!value) return ""
      if (value.startsWith("+255")) return value.slice(4)
      if (value.startsWith("255")) return value.slice(3)
      return value
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits
      let digits = e.target.value.replace(/\D/g, "")
      
      // Prevent starting with '0' - Tanzanian numbers shouldn't start with 0 after +255
      if (digits.startsWith("0")) {
        digits = digits.replace(/^0+/, "")
      }
      
      // Limit to 9 digits (Tanzanian local numbers)
      const trimmed = digits.slice(0, 9)
      const full = trimmed ? `+255${trimmed}` : ""
      onChange(full)
    }

    return (
      <div className={cn(
        "flex h-9 w-full overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        className
      )}>
        <div className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted px-2.5 text-sm font-medium text-muted-foreground">
          <span>🇹🇿</span>
          <span>+255</span>
        </div>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={localValue}
          onChange={handleChange}
          placeholder="7XX XXX XXX"
          className="h-full w-full min-w-0 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
