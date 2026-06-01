"use client";

import { useUserDetails } from "@/providers/UserContextProvider";
import { redirect } from "next/navigation";

export default function SettingsPage() {
  const { tenant, user } = useUserDetails();

  if (user.role.toUpperCase() === "OWNER") {
    redirect(`/${tenant}/settings/company`);
  } else if (user.role.toUpperCase() === "ADMIN") {
    redirect(`/${tenant}/settings/users`);
  }
}
