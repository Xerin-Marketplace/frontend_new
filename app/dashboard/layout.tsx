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
  // Seller
  "/dashboard/seller": "Overview",
  "/dashboard/seller/products": "Products",
  "/dashboard/seller/products/new": "Add Product",
  "/dashboard/seller/products/categories": "Categories",
  "/dashboard/seller/products/brands": "Brands",
  "/dashboard/seller/inventory": "Inventory",
  "/dashboard/seller/inventory/low-stock": "Low Stock Alerts",
  "/dashboard/seller/inventory/restocks": "Restock History",
  "/dashboard/seller/inventory/settings": "Inventory Settings",
  "/dashboard/seller/orders": "Orders",
  "/dashboard/seller/orders/cancellations": "Cancellations",
  "/dashboard/seller/kyc": "KYC Status",
  "/dashboard/seller/kyc/upload": "Upload Documents",
  "/dashboard/seller/kyc/documents": "Document History",
  "/dashboard/seller/wallet": "Wallet",
  "/dashboard/seller/wallet/transactions": "Transactions",
  "/dashboard/seller/wallet/payouts": "Payouts",
  "/dashboard/seller/wallet/payouts/new": "Request Payout",
  "/dashboard/seller/wallet/accounts": "Payout Accounts",
  "/dashboard/seller/store": "Store Profile",
  "/dashboard/seller/store/profile": "Business Profile",
  "/dashboard/seller/store/appearance": "Store Appearance",
  "/dashboard/seller/store/policies": "Policies",
  "/dashboard/seller/store/social": "Social Links",
  "/dashboard/seller/shipping": "Shipping",
  "/dashboard/seller/shipping/zones": "Shipping Zones",
  "/dashboard/seller/shipping/methods": "Shipping Methods",
  "/dashboard/seller/shipping/rates": "Shipping Rates",
  "/dashboard/seller/shipping/shipments": "Shipments",
  "/dashboard/seller/analytics": "Analytics",
  "/dashboard/seller/revenue": "Revenue",
  "/dashboard/seller/promotions": "Promotions",
  "/dashboard/seller/messages": "Messages",
  "/dashboard/seller/settings": "Settings",
  "/dashboard/seller/settings/notifications": "Notifications",
  "/dashboard/seller/settings/security": "Security",
  // User
  "/dashboard/user": "Overview",
  "/dashboard/user/orders": "Orders",
  "/dashboard/user/orders/tracking": "Track Shipment",
  "/dashboard/user/orders/returns": "Returns & Refunds",
  "/dashboard/user/orders/history": "Order History",
  "/dashboard/user/addresses": "Addresses",
  "/dashboard/user/addresses/new": "Add Address",
  "/dashboard/user/payments": "Payments",
  "/dashboard/user/payments/history": "Transaction History",
  "/dashboard/user/wishlist": "Wishlist",
  "/dashboard/user/wallet": "Wallet",
  "/dashboard/user/reviews": "Reviews",
  "/dashboard/user/messages": "Messages",
  "/dashboard/user/settings": "Settings",
  "/dashboard/user/settings/notifications": "Notifications",
  "/dashboard/user/settings/security": "Security",
  "/dashboard/user/settings/privacy": "Privacy",
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
