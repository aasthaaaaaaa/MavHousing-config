"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Map,
  PieChart,
  Megaphone,
  LogOut,
  FileText,
  Wrench,
  CreditCard,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { ModeToggle } from "./mode-toggle"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

const navItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Birds View", url: "/admin/birds-view", icon: Map },
    { title: "Occupancy", url: "/admin/occupancy", icon: PieChart },
    { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  ],
  staff: [
    { title: "Dashboard", url: "/staff", icon: Home },
    { title: "Applications", url: "/staff/applications", icon: FileText },
    { title: "Leases", url: "/staff/leases", icon: FileText },
    { title: "Maintenance", url: "/staff/maintenance", icon: Wrench },
    { title: "Payments", url: "/staff/payments", icon: CreditCard },
    { title: "Occupancy", url: "/staff/occupancy", icon: Users },
    { title: "Announcements", url: "/staff/announcements", icon: Megaphone },
  ],
  student: [
    { title: "Dashboard", url: "/student", icon: Home },
    { title: "My Applications", url: "/student/my-applications", icon: FileText },
    { title: "My Lease", url: "/student/my-lease", icon: FileText },
    { title: "Maintenance", url: "/student/maintenance/my-requests", icon: Wrench },
    { title: "Payments", url: "/student/payments", icon: CreditCard },
    { title: "Chat", url: "/student/chat", icon: MessageSquare },
  ],
}

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  student: "Student",
}

interface PillNavbarProps {
  role: "admin" | "staff" | "student"
}

export function PillNavbar({ role }: PillNavbarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const navRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})
  const [mounted, setMounted] = React.useState(false)

  const items = navItemsByRole[role] || navItemsByRole.admin
  const roleLabel = roleLabelMap[role] || "Portal"
  const homeUrl = `/${role}`

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Find active index
  const activeIndex = React.useMemo(() => {
    const exact = items.findIndex((item) => item.url === pathname)
    if (exact !== -1) return exact
    const prefix = items.findIndex(
      (item) => item.url !== homeUrl && pathname.startsWith(item.url)
    )
    return prefix !== -1 ? prefix : 0
  }, [pathname, items, homeUrl])

  // Mount flag
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate indicator position
  const updateIndicator = React.useCallback(() => {
    if (!navRef.current || !mounted) return
    const buttons = navRef.current.querySelectorAll<HTMLAnchorElement>(
      "[data-nav-item]"
    )
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      const navRect = navRef.current.getBoundingClientRect()
      const btnRect = activeButton.getBoundingClientRect()
      setIndicatorStyle({
        width: btnRect.width,
        transform: `translateX(${btnRect.left - navRect.left}px)`,
        opacity: 1,
      })
    }
  }, [activeIndex, mounted])

  React.useEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  React.useEffect(() => {
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [updateIndicator])

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-3 border-b border-border/40 backdrop-blur-xl"
      style={{ background: "var(--pill-nav-bg, hsl(var(--background) / 0.72))" }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href={homeUrl} className="flex items-center gap-2.5 group">
          <img
            src="/Main MavHousing Logo.svg"
            alt="MavHousing"
            className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-black/5 dark:hidden transition-transform group-hover:scale-105"
          />
          <img
            src="/Mavhousing Logo.svg"
            alt="MavHousing"
            className="hidden h-9 w-9 rounded-xl shadow-sm ring-1 ring-white/10 dark:block transition-transform group-hover:scale-105"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-semibold text-sm tracking-tight">MavHousing</span>
            <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
          </div>
        </Link>
      </div>

      {/* Center: Pill navigation */}
      <nav
        ref={navRef}
        className="relative flex items-center gap-0.5 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/50 p-1"
      >
        {/* Sliding pill indicator */}
        <div
          className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-full bg-primary pointer-events-none"
          style={{
            ...indicatorStyle,
            transition: mounted
              ? "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
            boxShadow: "0 1px 6px hsl(var(--primary) / 0.3), 0 0 14px hsl(var(--primary) / 0.08)",
          }}
        />

        {items.map((item, index) => {
          const isActive = index === activeIndex
          const Icon = item.icon
          return (
            <Link
              key={item.url}
              href={item.url}
              data-nav-item
              className={`
                relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-2
                text-[13px] font-medium whitespace-nowrap select-none
                transition-colors duration-200
                ${isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right: User menu + theme toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center p-0 border-none bg-transparent cursor-pointer rounded-full transition-transform duration-200 hover:scale-105 active:scale-95">
              <Avatar className="h-8 w-8 rounded-full ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                <AvatarImage src="" alt={user?.username || "User"} />
                <AvatarFallback className="rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {(user?.username || "U").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 py-1">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src="" alt={user?.username || "User"} />
                  <AvatarFallback className="rounded-full text-xs bg-primary/10 text-primary">
                    {(user?.username || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.username || "User"}</span>
                  <span className="text-xs text-muted-foreground">{roleLabel}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
