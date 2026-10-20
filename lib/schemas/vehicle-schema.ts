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

export const vehicleSpecsFormSchema = z.object({
  mileageKm: z.coerce
    .number()
    .int("Mileage must be a whole number")
    .min(100, "Mileage must be at least 100 km")
    .max(999999, "Please verify odometer reading (under 1,000,000 km)"),
  transmission: z.string().min(1, "Select transmission type"),
  drivetrain: z.string().min(1, "Select drivetrain configuration"),
  exteriorColor: z.string().min(1, "Select exterior colour"),
  interiorColor: z.string().min(1, "Select interior colour"),
  keysCount: z.coerce.number().int().min(1, "At least 1 key is required").max(5, "Maximum 5 keys"),
  accidentDeclaration: z.boolean().default(false),
  accidentCount: z.coerce.number().int().min(0).default(0),
  accidentDetails: z.string().max(500, "Details must be under 500 characters").optional().default(""),
  hasLien: z.boolean().default(false),
  lienDetails: z.string().max(500, "Lien details must be under 500 characters").optional().default(""),
});

export type VehicleSpecsFormInput = z.input<typeof vehicleSpecsFormSchema>;
export type VehicleSpecsFormOutput = z.output<typeof vehicleSpecsFormSchema>;
