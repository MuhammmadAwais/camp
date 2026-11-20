export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  registration: (registrationId: string) => [...authKeys.all, "registration", registrationId] as const,
};

export const kycKeys = {
  all: ["kyc"] as const,
  status: () => [...kycKeys.all, "status"] as const,
};

export const vehicleKeys = {
  all: ["vehicle"] as const,
  decode: (vin: string) => [...vehicleKeys.all, "decode", vin] as const,
};

export const sellerKeys = {
  all: ["seller"] as const,
  dashboard: () => [...sellerKeys.all, "dashboard"] as const,
  auctions: () => [...sellerKeys.all, "auctions"] as const,
  auction: (id: string) => [...sellerKeys.auctions(), id] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  moderationQueue: () => [...adminKeys.all, "moderation", "queue"] as const,
  moderationDetail: (id: string) =>
    [...adminKeys.all, "moderation", "detail", id] as const,
  auctions: () => [...adminKeys.all, "auctions"] as const,
  dealers: () => [...adminKeys.all, "dealers"] as const,
  dealer: (id: string) => [...adminKeys.dealers(), id] as const,
  disputes: () => [...adminKeys.all, "disputes"] as const,
  dispute: (id: string) => [...adminKeys.disputes(), id] as const,
  analytics: (filters?: { range?: string; province?: string }) =>
    filters
      ? ([...adminKeys.all, "analytics", filters] as const)
      : ([...adminKeys.all, "analytics"] as const),
  auditLog: (filters?: Record<string, string | number | undefined>) =>
    filters
      ? ([...adminKeys.all, "audit-log", filters] as const)
      : ([...adminKeys.all, "audit-log"] as const),
  config: () => [...adminKeys.all, "config"] as const,
  subscriptions: (filters?: Record<string, string | undefined>) =>
    filters
      ? ([...adminKeys.all, "subscriptions", filters] as const)
      : ([...adminKeys.all, "subscriptions"] as const),
};

export const settingsKeys = {
  all: ["settings"] as const,
  profile: () => [...settingsKeys.all, "profile"] as const,
  security: () => [...settingsKeys.all, "security"] as const,
};

export const dealerKeys = {
  all: ["dealer"] as const,
  onboarding: () => [...dealerKeys.all, "onboarding"] as const,
  team: () => [...dealerKeys.all, "team"] as const,
  subscription: () => [...dealerKeys.all, "subscription"] as const,
  invoices: (filters?: Record<string, string | undefined>) =>
    filters
      ? ([...dealerKeys.all, "invoices", filters] as const)
      : ([...dealerKeys.all, "invoices"] as const),
  inventory: (filters?: Record<string, string | number | null | undefined>) =>
    filters
      ? ([...dealerKeys.all, "inventory", filters] as const)
      : ([...dealerKeys.all, "inventory"] as const),
  auction: (id: string) => [...dealerKeys.all, "auction", id] as const,
  activeBids: () => [...dealerKeys.all, "active-bids"] as const,
  wonMatches: () => [...dealerKeys.all, "won-matches"] as const,
};

