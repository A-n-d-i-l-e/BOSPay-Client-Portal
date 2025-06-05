"use client";

import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useUser, OrganizationSwitcher, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  Boxes,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
} from "lucide-react";
import Image from "next/image";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { user } = useUser();

  const routes = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Products", icon: ShoppingCart, href: "/dashboard/products" },
    { label: "Transactions", icon: ArrowLeftRight, href: "/dashboard/transactions" },
    { label: "Categories", icon: Boxes, href: "/dashboard/category" },
    { label: "Withdrawals", icon: User, href: "/dashboard/withdraw" },
    { label: "Manage Staff", icon: User, href: "/dashboard/staffmembers" },
    { label: "Wallets", icon: User, href: "/dashboard/wallets" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isSmallScreen);
      if (isSmallScreen) {
        setIsCollapsed(true); // Always collapse on mobile
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col bg-gradient-to-b from-gray-800 via-gray-900 to-black text-gray-100 border-r shadow-lg transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[300px]",
          className
        )}
        style={{ height: "100vh", position: "sticky", top: 0 }}
      >
        {/* Collapse Button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-4 z-10 h-10 w-50 rounded-full bg-gray-800 text-gray-100 shadow-md transition-transform hover:scale-110"
            aria-label="Toggle Sidebar"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}

        {/* Header */}
        <div className={cn("p-4 flex flex-col gap-4", isCollapsed ? "items-center" : "")}>
          {/* Logo and Dashboard Title */}
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "")}>
            <Image
              src="https://utfs.io/f/vjV372zIanAGEJxDKXg2Y7FETPSGKLjvqoNtVp5efcmwya9H"
              alt="BOSPay Logo"
              width={48}
              height={48}
              className={cn("transition-all", isCollapsed ? "w-8 h-8" : "w-12 h-12 mr-3")}
            />
            {!isCollapsed && <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>}
          </div>

          {/* Organization Switcher with Heading */}
          {!isCollapsed ? (
            <div className="w-full">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Change Store</h3>
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger:
                      "w-full bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md flex items-center justify-between",
                    organizationPreview: "flex items-center gap-2",
                    organizationSwitcherPopover: "bg-gray-800 border border-gray-700",
                    organizationSwitcherTriggerIcon: "text-gray-400",
                  },
                }}
              />
            </div>
          ) : (
            // Icon for collapsed state
            <div className="w-full flex justify-center">
              <Button
                variant="ghost"
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-md flex items-center"
              >
                <Building className="h-5 w-5 text-white" />
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="w-full border-t border-gray-700 my-2" />
        </div>

        {/* Scrollable Menu */}
        <ScrollArea className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1 py-2">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-md transition-all hover:bg-gray-700",
                  isCollapsed ? "px-2 py-3" : "px-3 py-2"
                )}
                asChild
              >
                <Link href={route.href}>
                  <route.icon
                    className={cn(
                      "h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-100",
                      pathname === route.href && "text-blue-400"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="ml-3 font-medium group-hover:text-gray-100">
                      {route.label}
                    </span>
                  )}
                </Link>
              </Button>
            ))}

            {/* Logout Button */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-md transition-all hover:bg-gray-700",
                isCollapsed ? "px-2 py-3" : "px-3 py-2"
              )}
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut
                className="h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-100"
              />
              {!isCollapsed && (
                <span className="ml-3 font-medium group-hover:text-gray-100">Logout</span>
              )}
            </Button>
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div
          className={cn(
            "mt-auto border-t border-gray-700 p-4 transition-all",
            isCollapsed ? "px-2 py-3" : "p-4"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-md bg-gray-800/50 p-3 transition-all hover:bg-gray-700",
              isCollapsed && "justify-center p-2"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && user && (
              <div>
                <p className="text-sm font-medium leading-none">{user.fullName || user.firstName}</p>
                <p className="text-xs text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg w-96 text-center z-[10000]">
              <h2 className="text-lg font-medium text-gray-200 mb-4">Are you sure?</h2>
              <p className="text-sm text-gray-200 mb-6">
                You are about to log out. Make sure you’ve saved your work.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </Button>
                <SignOutButton>
                  <Button variant="destructive">Logout</Button>
                </SignOutButton>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}