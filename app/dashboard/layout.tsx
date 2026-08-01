"use client"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SellerSidebar } from "@/components/seller-sidebar"
import { UserSidebar } from "@/components/user-sidebar"
import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/toast"

const pageTitles: Record<string, string> = {
  "/dashboard/seller": "Overview",
  "/dashboard/seller/products": "Products",
  "/dashboard/seller/orders": "Orders",
  "/dashboard/seller/analytics": "Analytics",
  "/dashboard/seller/revenue": "Revenue",
  "/dashboard/seller/wallet": "Wallet",
  "/dashboard/seller/promotions": "Promotions",
  "/dashboard/seller/shipping": "Shipping",
  "/dashboard/seller/messages": "Messages",
  "/dashboard/seller/settings": "Settings",
  "/dashboard/user": "Overview",
  "/dashboard/user/orders": "Orders",
  "/dashboard/user/wishlist": "Wishlist",
  "/dashboard/user/addresses": "Addresses",
  "/dashboard/user/wallet": "Wallet",
  "/dashboard/user/reviews": "Reviews",
  "/dashboard/user/messages": "Messages",
  "/dashboard/user/settings": "Settings",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isSeller = pathname.startsWith("/dashboard/seller")
  const section = isSeller ? "Seller Center" : "My Account"
  const pageTitle = pageTitles[pathname] ?? "Dashboard"

  return (
    <SidebarProvider>
      {isSeller ? <SellerSidebar /> : <UserSidebar />}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={isSeller ? "/dashboard/seller" : "/dashboard/user"}>
                    {section}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
