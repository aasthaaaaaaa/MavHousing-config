"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  User,
  Users,
  FileText,
  Home,
  Wrench,
  CreditCard,
  LogOut,
  House,
  MessageSquare,
  Megaphone
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "./mode-toggle"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = {
    student: [
      { title: "Dashboard", url: "/student", icon: Home },
      { title: "My Applications", url: "/student/my-applications", icon: FileText },
      { title: "My Lease", url: "/student/my-lease", icon: FileText },
      { title: "Maintenance", url: "/student/maintenance/my-requests", icon: Wrench },
      { title: "Payments", url: "/student/payments", icon: CreditCard },
      { title: "Lease Chat", url: "/student/chat", icon: MessageSquare },
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
    admin: [
      { title: "Dashboard", url: "/admin", icon: Home },
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "Birds View", url: "/admin/birds-view", icon: Map },
      { title: "Occupancy Dashboard", url: "/admin/occupancy", icon: PieChart },
      { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
    ]


  };

  const role = user?.role as keyof typeof navItems || 'student';
  const items = navItems[role] || navItems.student;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 w-full">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <a href="#">
                  <img src="/mavhousing.PNG" alt="MavHousing" className="size-8 rounded-lg" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">MavHousing</span>
                    <span className="truncate text-xs">{role.charAt(0).toUpperCase() + role.slice(1)} Portal</span>
                  </div>
                </a>
              </SidebarMenuButton>
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={user?.username || "User"} />
                    <AvatarFallback className="rounded-lg">{(user?.username || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.username || "User"}</span>
                    <span className="truncate text-xs">{role}</span>
                  </div>
                  <LogOut className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={user?.username || "User"} />
                      <AvatarFallback className="rounded-lg">{(user?.username || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.username || "User"}</span>
                      <span className="truncate text-xs">{role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
