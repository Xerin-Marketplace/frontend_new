"use client"

import * as React from "react"
import {
  User,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  Wallet,
  Settings,
  MessageSquare,
  Star,
  Package,
  TrendingUp,
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

const userData = {
  user: {
    name: "Asha Mwangi",
    email: "asha@example.com",
    avatar: "/panda.png",
  },
  teams: [
    {
      name: "My Account",
      logo: User,
      plan: "Personal",
    },
    {
      name: "Business",
      logo: Package,
      plan: "Premium",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/user",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard/user" },
        { title: "Spending", url: "/dashboard/user/spending" },
        { title: "Activity", url: "/dashboard/user/activity" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/user/orders",
      icon: ShoppingBag,
      items: [
        { title: "All Orders", url: "/dashboard/user/orders" },
        { title: "Track Order", url: "/dashboard/user/orders/track" },
        { title: "Returns", url: "/dashboard/user/orders/returns" },
      ],
    },
    {
      title: "Account",
      url: "/dashboard/user/settings",
      icon: Settings,
      items: [
        { title: "Profile", url: "/dashboard/user/settings" },
        { title: "Addresses", url: "/dashboard/user/addresses" },
        { title: "Notifications", url: "/dashboard/user/settings/notifications" },
        { title: "Security", url: "/dashboard/user/settings/security" },
      ],
    },
  ],
  projects: [
    {
      name: "Wishlist",
      url: "/dashboard/user/wishlist",
      icon: Heart,
    },
    {
      name: "Wallet",
      url: "/dashboard/user/wallet",
      icon: Wallet,
    },
    {
      name: "Reviews",
      url: "/dashboard/user/reviews",
      icon: Star,
    },
    {
      name: "Messages",
      url: "/dashboard/user/messages",
      icon: MessageSquare,
    },
  ],
}

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={userData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={userData.navMain} />
        <NavProjects projects={userData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
