"use client"

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useUserDetails } from "@/providers/UserContextProvider"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[], grouplabel?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  
  const pathname = usePathname();
  const { tenant } = useUserDetails();

  const isActive = (url: string) => {
    const full = `/${tenant}${url}`
    return pathname === full || pathname.startsWith(`${full}/`)
  }

  return (
    <SidebarGroup {...props}>
      {props.grouplabel && <SidebarGroupLabel>{props.grouplabel}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link href={`/${tenant}${item.url}`}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
