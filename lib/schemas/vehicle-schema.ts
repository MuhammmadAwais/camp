import { z } from "zod";
import { isValidPostalCode, normalizePostalCode } from "@/lib/canada";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";

export const vinField = z
  .string()
  .transform(sanitizeVinInput)
  .refine((vin) => vin.length === 17, "A VIN has exactly 17 characters")
  .refine(isValidVin, "This VIN fails the check-digit test — please re-check each character");

export const vinDecodeFormSchema = z.object({
  vin: vinField,
  postalCode: z
    .string()
    .refine((value) => value.trim() === "" || isValidPostalCode(value), "Enter a valid Canadian postal code")
    .transform((value) => (value.trim() === "" ? "" : normalizePostalCode(value))),
});

export type VinDecodeFormInput = z.input<typeof vinDecodeFormSchema>;
export type VinDecodeFormOutput = z.output<typeof vinDecodeFormSchema>;

export const vinDecodePayloadSchema = z.object({ vin: vinField });

// FR-EU-03 decoded fields. `null` means the provider returned nothing and the seller fills it manually.
export type DecodedVehicle = {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  source: "VPIC" | "MANUAL";
};
