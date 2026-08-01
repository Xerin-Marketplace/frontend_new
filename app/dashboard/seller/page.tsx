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
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "TSh 2,450,000",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    description: "vs. last month",
  },
  {
    title: "Orders",
    value: "156",
    change: "+8.2%",
    trend: "up" as const,
    icon: ShoppingBag,
    description: "vs. last month",
  },
  {
    title: "Products",
    value: "48",
    change: "+3",
    trend: "up" as const,
    icon: Package,
    description: "2 low stock",
  },
  {
    title: "Customers",
    value: "1,234",
    change: "-2.4%",
    trend: "down" as const,
    icon: Users,
    description: "vs. last month",
  },
]

const recentOrders = [
  { id: "#ORD-7841", customer: "Asha Mwangi", product: "Wireless Headphones", amount: "TSh 85,000", status: "Completed", date: "2 hours ago" },
  { id: "#ORD-7840", customer: "John Kimaro", product: "Phone Case Pro", amount: "TSh 15,000", status: "Processing", date: "5 hours ago" },
  { id: "#ORD-7839", customer: "Fatuma Hassan", product: "Smart Watch", amount: "TSh 120,000", status: "Completed", date: "8 hours ago" },
  { id: "#ORD-7838", customer: "Peter Joseph", product: "USB Cable Set", amount: "TSh 12,000", status: "Pending", date: "12 hours ago" },
  { id: "#ORD-7837", customer: "Grace Mushi", product: "Bluetooth Speaker", amount: "TSh 65,000", status: "Completed", date: "1 day ago" },
]

const topProducts = [
  { name: "Wireless Headphones", sold: 124, revenue: "TSh 10,540,000", stock: 32 },
  { name: "Smart Watch", sold: 89, revenue: "TSh 10,680,000", stock: 15 },
  { name: "Bluetooth Speaker", sold: 67, revenue: "TSh 4,355,000", stock: 8 },
  { name: "Phone Case Pro", sold: 56, revenue: "TSh 840,000", stock: 120 },
  { name: "USB Cable Set", sold: 43, revenue: "TSh 516,000", stock: 3 },
]

const statusColors: Record<string, string> = {
  Completed: "default",
  Processing: "secondary",
  Pending: "outline",
}

export default function SellerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Add Product
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

      {/* Charts placeholder + Top Products */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-end justify-between gap-2">
              {[
                { month: "Feb", value: 45 },
                { month: "Mar", value: 62 },
                { month: "Apr", value: 55 },
                { month: "May", value: 78 },
                { month: "Jun", value: 70 },
                { month: "Jul", value: 92 },
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
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.sold} sold
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{product.revenue}</div>
                    <div className={`text-xs ${product.stock < 10 ? "text-red-500" : "text-muted-foreground"}`}>
                      {product.stock} in stock
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] as "default" | "secondary" | "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
