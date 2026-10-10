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

// Client-side half of route protection: proxy.ts catches missing cookies, this catches expired ones.
export function RequireSession({ children, fallbackClassName = "text-on-surface-variant" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();

  const signedOut = !isPending && !isError && user === null;

  useEffect(() => {
    if (signedOut) router.replace(`/login?notice=session-expired&next=${encodeURIComponent(pathname)}`);
  }, [signedOut, router, pathname]);

  if (user) return <>{children(user)}</>;

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
