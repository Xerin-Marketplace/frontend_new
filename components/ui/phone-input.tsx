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
      const digits = e.target.value.replace(/\D/g, "")
      // Limit to 9 digits (Tanzanian local numbers)
      const trimmed = digits.slice(0, 9)
      const full = trimmed ? `+255${trimmed}` : ""
      onChange(full)
    }

    return (
      <div className="flex h-9 w-full overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <span className="inline-flex shrink-0 items-center border-r border-input bg-muted px-2.5 text-sm font-medium text-muted-foreground">
          🇹🇿&nbsp;+255
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={localValue}
          onChange={handleChange}
          placeholder="7XX XXX XXX"
          className={cn(
            "h-full w-full min-w-0 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
