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
