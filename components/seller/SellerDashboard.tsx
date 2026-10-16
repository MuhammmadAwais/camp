import { Bell, Gavel, Handshake, Timer } from "lucide-react";
import { KycStatusBanner } from "@/components/seller/KycStatusBanner";
import { ListingStartCard } from "@/components/seller/ListingStartCard";
import type { SessionUser } from "@/lib/types/auth";

interface Props {
  user: SessionUser;
}

// FR-EU-11 dashboard shell with Autumn Editorial dual-theme (Terracotta Wine & Honey Amber).
export function SellerDashboard({ user }: Props) {
  const stats = [
    { label: "Active auctions", value: "0", icon: Timer },
    // Sealed-bid invariant: sellers only ever see a bid COUNT while an auction is ACTIVE.
    { label: "Bids received", value: "0", icon: Gavel },
    { label: "Completed sales", value: "0", icon: Handshake },
  ];

  return (
    <div className="mx-auto max-w-6xl w-full py-4 sm:py-6 space-y-6">
      {/* Welcome Title & Location */}
      <div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-portal-text">
          Welcome, {user.firstName}
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-body text-sm text-portal-text-muted">
          <span>Selling from</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#8C383E]/10 text-[#8C383E] border border-[#8C383E]/25 dark:bg-[#E59344]/15 dark:text-[#E59344] dark:border-[#E59344]/30 font-semibold">
            {user.postalCode}
          </span>
          <span>· {user.province}</span>
        </p>
      </div>

      <KycStatusBanner initialStatus={user.kycStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ListingStartCard initialKycStatus={user.kycStatus} />

          <dl className="grid grid-cols-3 gap-2 sm:gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-portal-border bg-portal-surface p-3 sm:p-4 transition-colors hover:border-[#8C383E]/40 dark:hover:border-[#E59344]/40"
              >
                <dt className="flex items-center gap-1 sm:gap-1.5 font-body text-[11px] sm:text-xs text-portal-text-muted">
                  <Icon className="w-3.5 h-3.5 text-[#8C383E] dark:text-[#E59344] shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="mt-1.5 sm:mt-2.5 font-mono text-xl sm:text-3xl font-bold tabular-nums text-portal-text">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <section className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30">
            <h2 className="font-headline text-lg font-bold text-portal-text">Your auctions</h2>
            <p className="mt-6 mb-4 text-center font-body text-sm text-portal-text-muted max-w-md mx-auto">
              No auctions yet. Once your listing is approved, a 24-hour sealed-bid auction starts and the live bid count appears here.
            </p>
          </section>
        </div>

        <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 h-fit transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30">
          <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-portal-text">
            <Bell className="w-4 h-4 text-[#8C383E] dark:text-[#E59344]" aria-hidden /> Notifications
          </h2>
          <p className="mt-6 mb-2 text-center font-body text-sm text-portal-text-muted">You&apos;re all caught up.</p>
        </aside>
      </div>
    </div>
  );
}
