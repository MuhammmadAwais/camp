import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Carries the vehicle a visitor entered on the landing page through registration,
// verification and KYC, so the listing wizard can start prefilled. Only the VIN and
// postal code are kept; decoded specs are server data and stay in TanStack Query.
type SellIntentState = {
  vin: string | null;
  postalCode: string | null;
  setIntent: (intent: { vin: string | null; postalCode: string | null }) => void;
  clearIntent: () => void;
};

export const useSellIntentStore = create<SellIntentState>()(
  persist(
    (set) => ({
      vin: null,
      postalCode: null,
      setIntent: ({ vin, postalCode }) => set({ vin, postalCode }),
      clearIntent: () => set({ vin: null, postalCode: null }),
    }),
    {
      name: "autonexa-sell-intent",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
