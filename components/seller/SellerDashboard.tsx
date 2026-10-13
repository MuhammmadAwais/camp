import { Bell, Gavel, Handshake, Timer } from "lucide-react";
import { KycStatusBanner } from "@/components/seller/KycStatusBanner";
import { ListingStartCard } from "@/components/seller/ListingStartCard";
import type { SessionUser } from "@/lib/types/auth";

interface Props {
  user: SessionUser;
}

// FR-EU-11 dashboard shell. Listing data arrives with the listing wizard milestone; until then every panel shows its empty state.
export function SellerDashboard({ user }: Props) {
  const stats = [
    { label: "Active auctions", value: "0", icon: Timer },
    // Sealed-bid invariant: sellers only ever see a bid COUNT while an auction is ACTIVE.
    { label: "Bids received", value: "0", icon: Gavel },
    { label: "Completed sales", value: "0", icon: Handshake },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-portal-text">Welcome, {user.firstName}</h1>
        <p className="mt-1 font-body text-sm text-portal-text-muted">
          Selling from <span className="font-mono">{user.postalCode}</span> · {user.province}
        </p>
      </div>

      <KycStatusBanner initialStatus={user.kycStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ListingStartCard initialKycStatus={user.kycStatus} />

          <dl className="grid grid-cols-3 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-portal-border bg-portal-surface p-4">
                <dt className="flex items-center gap-1.5 font-body text-xs text-portal-text-muted">
                  <Icon className="w-3.5 h-3.5" aria-hidden /> {label}
                </dt>
                <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-portal-text">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6">
            <h2 className="font-headline text-lg font-bold text-portal-text">Your auctions</h2>
            <p className="mt-6 mb-4 text-center font-body text-sm text-portal-text-muted">
              No auctions yet. Once your listing is approved, a 24-hour sealed-bid auction starts and the live bid count appears here.
            </p>
          </section>
        </div>

        <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 h-fit">
          <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-portal-text">
            <Bell className="w-4 h-4" aria-hidden /> Notifications
          </h2>
          <p className="mt-6 mb-2 text-center font-body text-sm text-portal-text-muted">You&apos;re all caught up.</p>
        </aside>
      </div>
    </div>
  );
}
