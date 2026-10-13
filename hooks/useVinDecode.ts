"use client";

import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { vehicleKeys } from "@/lib/query-keys";
import type { DecodedVehicle } from "@/lib/schemas/vehicle-schema";
import { isValidVin } from "@/lib/vin";

// Decoded specs never change for a VIN, so they're cached for the whole session.
export function useVinDecode(vin: string | null) {
  return useQuery({
    queryKey: vehicleKeys.decode(vin ?? ""),
    queryFn: async () => unwrap(await api.post<DecodedVehicle>("/api/vin/decode", { vin })),
    enabled: vin !== null && isValidVin(vin),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
