import React from "react";
import type { Metadata } from "next";
import { ProfileSettingsView } from "@/components/settings/ProfileSettingsView";

export const metadata: Metadata = {
  title: "Security & Multi-Factor Authentication | AutoNexa Canada",
  description:
    "Configure your Canadian clearing credentials, MFA/2FA, and authorized active sessions.",
};

export default function SecuritySettingsPage() {
  return <ProfileSettingsView defaultTab="SECURITY" />;
}
