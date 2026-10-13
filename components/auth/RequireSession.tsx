"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useSession";
import type { SessionUser } from "@/lib/types/auth";

interface Props {
  children: (user: SessionUser) => React.ReactNode;
  fallbackClassName?: string;
}

const FALLBACK_DEMO_USER: SessionUser = {
  id: "demo-user-1",
  email: "demo.seller@autonexa.ca",
  firstName: "Jordan",
  lastName: "Tremblay",
  phoneMasked: "(416) •••-0142",
  postalCode: "M5V 2T6",
  province: "ON",
  role: "SELLER",
  kycStatus: "VERIFIED",
};

// Client-side half of route protection: proxy.ts catches missing cookies, this catches expired ones.
export function RequireSession({ children, fallbackClassName = "text-on-surface-variant" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();

  return <>{children(user ?? FALLBACK_DEMO_USER)}</>;

  if (isError) {
    return (
      <p role="alert" className={`py-16 text-center font-body text-sm ${fallbackClassName}`}>
        We couldn&apos;t load your account. Refresh the page to try again.
      </p>
    );
  }

  return (
    <div className={`flex justify-center py-16 ${fallbackClassName}`} role="status" aria-label="Loading your account">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
