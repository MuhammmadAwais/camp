import React from "react";
import type { Metadata } from "next";
import { ProfileSettingsView } from "@/components/settings/ProfileSettingsView";

export const metadata: Metadata = {
  title: "Profile & Account Settings | AutoNexa Canada",
  description:
    "Manage your personal identity, Canadian regulatory registrar affiliations, security keys, and dispatch alerts.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsView />;
}
