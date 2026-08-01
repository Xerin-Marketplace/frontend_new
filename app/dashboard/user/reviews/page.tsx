"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Star,
  Pencil,
  Trash2,
  Package,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react"

type Review = {
  id: string
  product_name: string
  seller_name: string
  rating: number
  title: string
  comment: string
  created_at: string
  status: "published" | "pending"
}

type PendingReview = {
  id: string
  product_name: string
  seller_name: string
  order_number: string
  image: string | null
}

const mockReviews: Review[] = [
  { id: "1", product_name: "Smart Watch Pro", seller_name: "TechWorld TZ", rating: 5, title: "Excellent product!", comment: "The watch exceeded my expectations. Great battery life and the screen is crystal clear.", created_at: "2025-07-29", status: "published" },
  { id: "2", product_name: "Bluetooth Speaker", seller_name: "TechWorld TZ", rating: 4, title: "Good sound quality", comment: "Sound is great for the size. Wish the battery lasted a bit longer.", created_at: "2025-07-21", status: "published" },
  { id: "3", product_name: "USB Cable Set", seller_name: "Acme Trading Co.", rating: 3, title: "Decent cables", comment: "They work fine but feel a bit thin. Good value for the price though.", created_at: "2025-07-15", status: "published" },
]

const mockPending: PendingReview[] = [
  { id: "1", product_name: "Wireless Headphones", seller_name: "Acme Trading Co.", order_number: "#ORD-3921", image: null },
  { id: "2", product_name: "Phone Case Pro", seller_name: "Acme Trading Co.", order_number: "#ORD-3921", image: null },
]

export default function UserReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>(mockReviews)
  const [pending, setPending] = React.useState<PendingReview[]>(mockPending)
  const [writeOpen, setWriteOpen] = React.useState(false)
  const [writeItem, setWriteItem] = React.useState<PendingReview | null>(null)
  const [editReview, setEditReview] = React.useState<Review | null>(null)
  const [deleteReview, setDeleteReview] = React.useState<Review | null>(null)
  const [rating, setRating] = React.useState(5)
  const [title, setTitle] = React.useState("")
  const [comment, setComment] = React.useState("")

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0"

  const resetForm = () => {
    setRating(5)
    setTitle("")
    setComment("")
  }

  const handleWriteReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !comment.trim() || !writeItem) return
    const newReview: Review = {
      id: crypto.randomUUID(),
      product_name: writeItem.product_name,
      seller_name: writeItem.seller_name,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      created_at: new Date().toISOString().split("T")[0],
      status: "published",
    }
    setReviews((prev) => [newReview, ...prev])
    setPending((prev) => prev.filter((p) => p.id !== writeItem.id))
    setWriteOpen(false)
    setWriteItem(null)
    resetForm()
    toast.add({ title: "Review posted!", description: `Your review for ${writeItem.product_name} is now live.`, type: "success" })
  }

  const handleEditReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !comment.trim() || !editReview) return
    setReviews((prev) => prev.map((r) => r.id === editReview.id ? { ...r, rating, title: title.trim(), comment: comment.trim() } : r))
    setEditReview(null)
    resetForm()
    toast.add({ title: "Review updated!", description: "Your review has been updated.", type: "success" })
  }

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setDeleteReview(null)
    toast.add({ title: "Review deleted", description: "Your review has been removed.", type: "success" })
  }

  const openWrite = (item: PendingReview) => {
    setWriteItem(item)
    setWriteOpen(true)
    resetForm()
  }

  const openEdit = (review: Review) => {
    setEditReview(review)
    setRating(review.rating)
    setTitle(review.title)
    setComment(review.comment)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Reviews</h2>
        <p className="text-sm text-muted-foreground">Share your experience and manage reviews for products you've purchased.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviews Written</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{reviews.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            <Star className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{avgRating}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`size-4 ${s <= Math.round(parseFloat(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{pending.length}</div></CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {pending.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Package className="size-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">{item.seller_name} · {item.order_number}</div>
                  </div>
                  <Button size="sm" onClick={() => openWrite(item)}>
                    <Star className="size-3" /> Write Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet. Write your first review!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.product_name}</span>
                        <Badge variant="outline" className="text-xs">{review.seller_name}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`size-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">{review.created_at}</span>
                      </div>
                      <div className="mt-2 font-medium text-sm">{review.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(review)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteReview(review)} className="text-red-500">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Review Dialog */}
      <Dialog open={writeOpen} onOpenChange={(open) => { if (!open) { setWriteOpen(false); setWriteItem(null); resetForm() } }}>
        <DialogContent className="sm:max-w-[480px]">
          {writeItem && (
            <form onSubmit={handleWriteReview}>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>Share your experience with {writeItem.product_name}</DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel>Rating</FieldLabel>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setRating(s)}>
                        <Star className={`size-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="comment">Review</FieldLabel>
                  <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="What did you like or dislike?" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button type="submit">Post Review</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={!!editReview} onOpenChange={(open) => { if (!open) { setEditReview(null); resetForm() } }}>
        <DialogContent className="sm:max-w-[480px]">
          {editReview && (
            <form onSubmit={handleEditReview}>
              <DialogHeader>
                <DialogTitle>Edit Review</DialogTitle>
                <DialogDescription>Update your review for {editReview.product_name}</DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel>Rating</FieldLabel>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setRating(s)}>
                        <Star className={`size-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-title">Title</FieldLabel>
                  <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-comment">Review</FieldLabel>
                  <textarea id="edit-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button type="submit">Update Review</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Review Dialog */}
      <Dialog open={!!deleteReview} onOpenChange={(open) => !open && setDeleteReview(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Review?</DialogTitle>
            <DialogDescription>Remove your review for <strong>{deleteReview?.product_name}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => deleteReview && handleDeleteReview(deleteReview.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
