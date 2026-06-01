"use client";

import { NavSecondary } from "@/components/layout/nav-secondary";
import { useUserDetails } from "@/providers/UserContextProvider";
import { Building2, CreditCard, Hash, Users } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { allowedPages } = useUserDetails();

  const data = {
    navSecondary: [
      {
        title: "Company",
        url: "/settings/company",
        icon: Building2,
      },
      {
        title: "Users",
        url: "/settings/users",
        icon: Users,
      },
      {
        title: "Naming Conventions",
        url: "/settings/naming-conventions",
        icon: Hash,
      },
      {
        title: "Billing",
        url: "/settings/billing",
        icon: CreditCard,
      },
    ],
  };

  return (
    <div className="flex gap-2 px-4 lg:flex-row flex-col">
      <NavSecondary
        className="w-full md:w-80"
        items={data.navSecondary.filter((nav) =>
          allowedPages.includes(nav.url),
        )}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
