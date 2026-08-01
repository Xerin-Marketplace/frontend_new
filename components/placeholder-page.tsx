"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Construction } from "lucide-react"
import { useRouter } from "next/navigation"

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const router = useRouter()

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Construction className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            {description ?? "This page is under construction. We're working hard to bring it to life."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
