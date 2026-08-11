"use client"

import * as React from "react"
import {
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  Wallet,
  RefreshCw,
  BarChart3,
  Settings,
  KeyRound,
  Tags,
  BadgePercent,
  TicketPercent,
  Truck,
  Boxes,
  Warehouse,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

const adminData = {
  user: {
    name: "Admin",
    email: "admin@xerinmarket.com",
    avatar: "/panda.png",
  },
  teams: [
    {
      name: "Xerin Market",
      logo: Shield,
      plan: "Admin Panel",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard/admin" },
        { title: "Analytics", url: "/dashboard/admin/analytics" },
      ],
    },
    {
      title: "Users",
      url: "/dashboard/admin/users",
      icon: Users,
      items: [
        { title: "All Users", url: "/dashboard/admin/users" },
      ],
    },
    {
      title: "Sellers",
      url: "/dashboard/admin/sellers",
      icon: Store,
      items: [
        { title: "All Sellers", url: "/dashboard/admin/sellers" },
        { title: "Pending Approval", url: "/dashboard/admin/sellers?status=pending" },
      ],
    },
    {
      title: "Products",
      url: "/dashboard/admin/products",
      icon: Package,
      items: [
        { title: "All Products", url: "/dashboard/admin/products" },
        { title: "Pending Review", url: "/dashboard/admin/products?status=pending" },
      ],
    },
    {
      title: "Catalog",
      url: "/dashboard/admin/catalog/product-categories",
      icon: Tags,
      items: [
        { title: "Product Categories", url: "/dashboard/admin/catalog/product-categories" },
        { title: "Business Categories", url: "/dashboard/admin/catalog/business-categories" },
        { title: "Brands", url: "/dashboard/admin/catalog/brands" },
      ],
    },
    {
      title: "Inventory",
      url: "/dashboard/admin/inventory",
      icon: Boxes,
      items: [{ title: "Inventory Operations", url: "/dashboard/admin/inventory" }],
    },
    {
      title: "Orders",
      url: "/dashboard/admin/orders",
      icon: ShoppingBag,
      items: [
        { title: "All Orders", url: "/dashboard/admin/orders" },
      ],
    },
    {
      title: "Payments",
      url: "/dashboard/admin/payments",
      icon: CreditCard,
      items: [
        { title: "All Payments", url: "/dashboard/admin/payments" },
      ],
    },
    {
      title: "Commissions",
      url: "/dashboard/admin/commissions",
      icon: BadgePercent,
      items: [{ title: "Commission Rules", url: "/dashboard/admin/commissions" }],
    },
    {
      title: "Coupons",
      url: "/dashboard/admin/coupons",
      icon: TicketPercent,
      items: [{ title: "Coupon Management", url: "/dashboard/admin/coupons" }],
    },
    {
      title: "Shipping",
      url: "/dashboard/admin/shipping",
      icon: Truck,
      items: [{ title: "Shipping Operations", url: "/dashboard/admin/shipping" }],
    },
    {
      title: "Fulfilment",
      url: "/dashboard/admin/fulfilment",
      icon: Warehouse,
      items: [
        { title: "Overview", url: "/dashboard/admin/fulfilment" },
        { title: "Warehouses", url: "/dashboard/admin/fulfilment/warehouses" },
        { title: "Inbound Shipments", url: "/dashboard/admin/fulfilment/inbound" },
        { title: "Pick Lists", url: "/dashboard/admin/fulfilment/picklists" },
      ],
    },
    {
      title: "Wallets",
      url: "/dashboard/admin/wallets",
      icon: Wallet,
      items: [
        { title: "Seller Wallets", url: "/dashboard/admin/wallets" },
        { title: "Payout Requests", url: "/dashboard/admin/wallets/payouts" },
      ],
    },
    {
      title: "Refunds",
      url: "/dashboard/admin/refunds",
      icon: RefreshCw,
      items: [
        { title: "All Refunds", url: "/dashboard/admin/refunds" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/admin/settings",
      icon: Settings,
      items: [
        { title: "Platform Settings", url: "/dashboard/admin/settings" },
      ],
    },
  ],
  projects: [
    {
      name: "Analytics",
      url: "/dashboard/admin/analytics",
      icon: BarChart3,
    },
  ],
}

const superAdminExtras = {
  navMain: [
    {
      title: "Roles & Permissions",
      url: "/dashboard/admin/roles",
      icon: KeyRound,
      items: [
        { title: "All Roles", url: "/dashboard/admin/roles" },
        { title: "All Permissions", url: "/dashboard/admin/permissions" },
      ],
    },
    {
      title: "Admin Management",
      url: "/dashboard/admin/admins",
      icon: ShieldCheck,
      items: [
        { title: "All Admins", url: "/dashboard/admin/admins" },
      ],
    },
    {
      title: "Security Events",
      url: "/dashboard/admin/security-events",
      icon: ShieldAlert,
      items: [{ title: "Login & Session Events", url: "/dashboard/admin/security-events" }],
    },
  ],
  projects: [],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSuperAdmin, hasPermission } = useAuth()

  const teams = isSuperAdmin
    ? [{ name: "Xerin Market", logo: ShieldCheck, plan: "Super Admin" }]
    : adminData.teams

  const requiredPermission: Record<string, string | null> = {
    Dashboard: "analytics:admin_read",
    Users: "can_view_users",
    Sellers: "can_view_sellers",
    Products: "can_view_products",
    Catalog: "can_view_product_categories",
    Inventory: "inventory:manage",
    Orders: "orders:read",
    Payments: "payments:read",
    Commissions: "commissions:read",
    Coupons: "coupons:read",
    Shipping: "shipping:read",
    Fulfilment: "inventory:manage",
    Wallets: "wallet:read",
    Refunds: "refunds:read",
    Settings: null,
  }
  const visibleAdminNavigation = adminData.navMain.filter((item) => {
    const permission = requiredPermission[item.title]
    return permission === null || hasPermission(permission)
  })

  const navMain = isSuperAdmin
    ? [...adminData.navMain, ...superAdminExtras.navMain]
    : visibleAdminNavigation

  const projects = isSuperAdmin
    ? [...adminData.projects, ...superAdminExtras.projects]
    : adminData.projects

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={adminData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
