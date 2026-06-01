"use client"

import * as React from "react"
import {
  AudioWaveform,
  Bell,
  BookOpen,
  ChartBar,
  Frame,
  GalleryVerticalEnd,
  Home,
  Map,
  MessageSquareIcon,
  PieChart,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "../ui/skeleton"
import { NavSecondary } from "./nav-secondary"
import { cn, getAvatarUrl } from "@/lib/utils"
import { useUserDetails } from "@/providers/UserContextProvider"
import Img from "next/image"

const data = {
  teams: [
    {
      name: "UTS Corp.",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "ME-ICT Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true
    },
    {
      title: "Topics",
      url: "/topics",
      icon: BookOpen
    },
    {
      title: "My Feedbacks",
      url: "/feedbacks",
      icon: MessageSquareIcon
    },
    {
      title: "Insights",
      url: "/insights",
      icon: ChartBar,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { state } = useSidebar()
  const { user, allowedPages } = useUserDetails();
  const hasSettingsPage = allowedPages.some(route => route.startsWith('/settings'));

  const renderUserInfo = () => {

    if (!user) {
      return (
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      )
    }

    return (
      <NavUser user={{
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        avatar: getAvatarUrl(user.avatar, 'x32')
      }} />
    )
  }

  const renderCompanyName = () => {
    if (state === "collapsed")
      return

    return (
      <span className="font-semibold text-sidebar-foreground">Oppr Insights</span>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <div className={cn(state === 'collapsed' ? "" : "px-2", "flex items-center gap-3")}>
          <Img
            src="/logo.png"
            alt="Oppr Logo"
            className="size-8"
            width={80}
            height={80}
          />
          {renderCompanyName()}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain.filter(nav => allowedPages.includes(nav.url))} />
        {hasSettingsPage && <NavSecondary items={data.navSecondary} grouplabel="Management" />}
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {renderUserInfo()}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
