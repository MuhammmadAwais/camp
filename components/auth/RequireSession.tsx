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

// Client-side half of route protection: proxy.ts enforces cookie/JWT guards on navigation,
// while RequireSession handles expired or cleared client sessions without exposing portal UI.
export function RequireSession({
  children,
  fallbackClassName = "text-on-surface-variant",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();

  useEffect(() => {
    if (!isPending && !isError && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isPending, isError, user, pathname, router]);

  if (isError) {
    return (
      <p role="alert" className={`py-16 text-center font-body text-sm ${fallbackClassName}`}>
        We couldn&apos;t load your account. Refresh the page to try again.
      </p>
    );
  }

  if (isPending || !user) {
    return (
      <div
        className={`flex justify-center py-16 ${fallbackClassName}`}
        role="status"
        aria-label="Loading your account"
      >
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return <>{children(user)}</>;
}
