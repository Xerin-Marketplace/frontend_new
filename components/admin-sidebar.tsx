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
  ScrollText,
  Lock,
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
      title: "Audit & Security",
      url: "/dashboard/admin/audit-logs",
      icon: ScrollText,
      items: [
        { title: "Audit Logs", url: "/dashboard/admin/audit-logs" },
        { title: "Security Events", url: "/dashboard/admin/security-events" },
      ],
    },
  ],
  projects: [
    {
      name: "Audit Logs",
      url: "/dashboard/admin/audit-logs",
      icon: ScrollText,
    },
    {
      name: "Security",
      url: "/dashboard/admin/security-events",
      icon: Lock,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSuperAdmin } = useAuth()

  const teams = isSuperAdmin
    ? [{ name: "Xerin Market", logo: ShieldCheck, plan: "Super Admin" }]
    : adminData.teams

  const navMain = isSuperAdmin
    ? [...adminData.navMain, ...superAdminExtras.navMain]
    : adminData.navMain

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
