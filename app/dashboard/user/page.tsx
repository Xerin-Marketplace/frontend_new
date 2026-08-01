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
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ShoppingBag,
  Heart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react"

const stats = [
  {
    title: "Total Orders",
    value: "24",
    change: "+3",
    trend: "up" as const,
    icon: ShoppingBag,
    description: "this month",
  },
  {
    title: "Pending Deliveries",
    value: "2",
    change: "0",
    trend: "up" as const,
    icon: Truck,
    description: "in transit",
  },
  {
    title: "Wishlist Items",
    value: "18",
    change: "+5",
    trend: "up" as const,
    icon: Heart,
    description: "saved items",
  },
  {
    title: "Total Spent",
    value: "TSh 845,000",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    description: "vs. last month",
  },
]

const recentOrders = [
  { id: "#ORD-3921", product: "Wireless Headphones", seller: "TechHub Store", amount: "TSh 85,000", status: "Delivered", date: "2 days ago" },
  { id: "#ORD-3920", product: "Smart Watch", seller: "Gadget World", amount: "TSh 120,000", status: "Shipped", date: "3 days ago" },
  { id: "#ORD-3919", product: "Phone Case Pro", seller: "Accessory Plus", amount: "TSh 15,000", status: "Processing", date: "5 days ago" },
  { id: "#ORD-3918", product: "Bluetooth Speaker", seller: "Audio Zone", amount: "TSh 65,000", status: "Delivered", date: "1 week ago" },
  { id: "#ORD-3917", product: "USB Cable Set", seller: "TechHub Store", amount: "TSh 12,000", status: "Delivered", date: "1 week ago" },
]

const wishlistItems = [
  { name: "Gaming Mouse", price: "TSh 45,000", seller: "TechHub Store", inStock: true },
  { name: "Mechanical Keyboard", price: "TSh 120,000", seller: "Gadget World", inStock: true },
  { name: "HD Monitor 24\"", price: "TSh 350,000", seller: "Display Pro", inStock: false },
  { name: "Webcam HD", price: "TSh 75,000", seller: "Audio Zone", inStock: true },
]

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
  Delivered: { variant: "default", icon: <CheckCircle2 className="size-3" /> },
  Shipped: { variant: "secondary", icon: <Truck className="size-3" /> },
  Processing: { variant: "outline", icon: <Clock className="size-3" /> },
}

export default function UserDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Track your orders, wishlist, and spending activity.
          </p>
        </div>
        <Button>
          <ShoppingBag className="size-4" />
          Continue Shopping
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="size-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="size-3 text-red-500" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Tracking + Spending Chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>Your monthly spending for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-end justify-between gap-2">
              {[
                { month: "Feb", value: 35 },
                { month: "Mar", value: 52 },
                { month: "Apr", value: 40 },
                { month: "May", value: 68 },
                { month: "Jun", value: 55 },
                { month: "Jul", value: 82 },
              ].map((bar) => (
                <div key={bar.month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all hover:from-primary/60 hover:to-primary"
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{bar.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Tracking</CardTitle>
            <CardDescription>Active deliveries and recent status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentOrders.slice(0, 3).map((order) => {
                const config = statusConfig[order.status]
                return (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Package className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{order.product}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.id} - {order.date}
                      </span>
                    </div>
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      {config.icon}
                      {order.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => {
                const config = statusConfig[order.status]
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>{order.seller}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                        {config.icon}
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Wishlist Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>Items you&apos;ve saved for later</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {wishlistItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Heart className="size-5 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.seller}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium">{item.price}</span>
                  {item.inStock ? (
                    <Badge variant="default" className="text-xs">In Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Out of Stock</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
