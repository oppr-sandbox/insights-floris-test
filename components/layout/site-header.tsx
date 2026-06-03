'use client';

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "../ui/breadcrumb"
import { usePathname } from "next/navigation"
import { Fragment } from "react";
import Notification from "./notification";

export function SiteHeader() {

  const paths = usePathname()
  const pathNames = paths.split('/').filter(path => path)

  const formatLink = (link: string) => {
    return link
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 z-50 border-b border-border">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {
              pathNames.map((link, index) => {
                const href = `/${pathNames.slice(0, index + 1).join('/')}`
                const itemClasses = paths === href ? '' : 'hidden md:block'
                return (
                  <Fragment key={index}>
                    <BreadcrumbItem className={itemClasses}>
                      <BreadcrumbLink href={href}>
                        {formatLink(link)}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathNames.length !== index + 1 && <BreadcrumbSeparator className="hidden md:block" />}
                  </Fragment>
                )
              })
            }
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Notification />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
