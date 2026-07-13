"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Logo from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  LayoutDashboard,
  Archive,
  BrainCircuit,
  ShieldCheck,
  Settings,
  LogOut,
  Map,
  Hospital,
  LifeBuoy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/user-context";

const publicNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/map", icon: Map, label: "Map" },
];

const staffNavItems = [
    { href: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/inventory", icon: Archive, label: "Inventory" },
    { href: "/predict", icon: BrainCircuit, label: "Demand Prediction" },
    { href: "/admin", icon: ShieldCheck, label: "Admin" },
];

const commonNavItems = [
    { href: "/help", icon: LifeBuoy, label: "Help & Support" },
]

export default function AppSidebar() {
  const pathname = usePathname();
  const { userType } = useUser();
  const navItems = userType === 'staff' ? staffNavItems : publicNavItems;
  const user = userType === 'staff' ? {
      name: "Admin User",
      email: "admin@bloodaid.io",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      hospitalName: "Apollo Hospital Blood Bank"
  } : {
      name: "Guest User",
      email: "guest@example.com",
      avatar: "https://i.pravatar.cc/150?u=public"
  }


  return (
    <Sidebar>
      <SidebarHeader>
        <Link href={userType === 'staff' ? '/staff/dashboard' : '/dashboard'} className="flex items-center gap-2.5">
          <Logo />
          <span className="font-headline text-xl font-semibold text-primary">
            BloodAid
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href) && (item.href !== '/staff/dashboard' || pathname === item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-2" />
           {commonNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-semibold truncate text-sm">{user.name}</p>
                {user.hospitalName ? (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Hospital className="h-3 w-3" />
                        {user.hospitalName}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                    </p>
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
