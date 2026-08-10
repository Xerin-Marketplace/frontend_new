"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

interface QuestionnaireProps {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
}

export function Questionnaire({ children, className, onSubmit }: QuestionnaireProps) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      {children}
    </form>
  )
}

export function QuestionnaireItem({ children, className, isActive }: { children: React.ReactNode, className?: string, isActive?: boolean }) {
  if (!isActive) return null
  return (
    <div className={cn("animate-fade-in-up", className)}>
      {children}
    </div>
  )
}

export function QuestionnaireTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h3 className={cn("text-base font-medium tracking-tight text-foreground", className)}>
      {children}
    </h3>
  )
}

export function QuestionnaireDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function QuestionnaireChoices({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("mt-4 flex flex-col gap-2", className)}>
      {children}
    </div>
  )
}

export function QuestionnaireChoice({ 
  children, 
  className, 
  value, 
  selected, 
  onClick 
}: { 
  children: React.ReactNode
  className?: string
  value: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors outline-none",
        selected 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
      <div className={cn(
        "flex size-5 items-center justify-center rounded-full border transition-colors",
        selected 
          ? "border-primary bg-primary text-primary-foreground" 
          : "border-muted-foreground/30 bg-background"
      )}>
        {selected && <Check className="size-3 stroke-[3]" />}
      </div>
    </button>
  )
}

export function QuestionnaireInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export function QuestionnaireActions({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("mt-4 flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  )
}

export function QuestionnaireNext({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      {children || "Next"}
      <ChevronRight className="size-4" />
    </Button>
  )
}

export function QuestionnairePrevious({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" {...props}>
      <ChevronLeft className="size-4" />
      {children || "Back"}
    </Button>
  )
}

export function QuestionnaireSubmit({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button size="lg" className="w-full" {...props}>
      {children || "Submit"}
    </Button>
  )
}

export function QuestionnaireProgress({ value }: { value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span>Step</span>
        <span>{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  )
}
