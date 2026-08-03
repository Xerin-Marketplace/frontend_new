"use client"

import { useMemo } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type PasswordStrengthProps = {
  password: string
  className?: string
}

const requirements = [
  { label: "At least 10 characters", test: (pw: string) => pw.length >= 10 },
  { label: "One uppercase letter (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One number (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
]

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  for (const req of requirements) {
    if (req.test(password)) score++
  }
  if (password.length >= 12) score++

  const levels = [
    { label: "Too weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-green-500" },
    { label: "Very strong", color: "bg-green-600" },
  ]

  return { score, ...levels[Math.min(score, 5)] }
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password])

  if (!password) return null

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-colors",
                i < strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const passed = req.test(password)
          return (
            <li key={req.label} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="size-3 text-green-500" />
              ) : (
                <X className="size-3 text-muted-foreground" />
              )}
              <span className={passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                {req.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
