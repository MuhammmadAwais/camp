"use client";

import { KycFlow } from "@/components/auth/KycFlow";
import { RequireSession } from "@/components/auth/RequireSession";

// Client boundary so the server page can render a session-guarded KYC flow.
export function KycGate() {
  return <RequireSession>{(user) => <KycFlow user={user} />}</RequireSession>;
}
