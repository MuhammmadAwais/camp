import { z } from "zod";
import {
  PROVINCE_CODES,
  isValidPostalCode,
  normalizePostalCode,
  toNationalPhoneDigits,
} from "@/lib/canada";

// ---------- Shared field rules ----------

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"))
  .transform((value) => value.toLowerCase());

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} must be 60 characters or fewer`)
    .regex(/^[\p{L}][\p{L}' .-]*$/u, `${label} can only contain letters, spaces, apostrophes and hyphens`);

// Sent to the API as E.164 (+1XXXXXXXXXX) — Twilio's expected format.
const canadianPhoneField = z
  .string()
  .min(1, "Mobile number is required")
  .refine((value) => toNationalPhoneDigits(value) !== null, "Enter a valid 10-digit Canadian mobile number")
  .transform((value) => `+1${toNationalPhoneDigits(value)}`);

const postalCodeField = z
  .string()
  .min(1, "Postal code is required")
  .refine(isValidPostalCode, "Enter a valid Canadian postal code (e.g. M5V 2T6)")
  .transform(normalizePostalCode);

export const PASSWORD_MIN_LENGTH = 10;

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Password must be 128 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

const otpField = z
  .string()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

// ---------- Registration (FR-EU-01) ----------

export const registerFormSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: emailField,
    phone: canadianPhoneField,
    postalCode: postalCodeField,
    province: z.enum(PROVINCE_CODES, { error: "Select your province or territory" }),
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
    isAdult: z.boolean().refine((v) => v, "You must be 18 or older to sell on AutoNexa"),
    acceptTerms: z.boolean().refine((v) => v, "You must accept the Terms and Privacy Policy"),
    // CASL: commercial messages need express opt-in, so this defaults to false and is optional.
    marketingOptIn: z.boolean(),
    vin: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterFormInput = z.input<typeof registerFormSchema>;
export type RegisterFormOutput = z.output<typeof registerFormSchema>;

// The API contract: the form output minus UI-only fields.
export const registerPayloadSchema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: emailField,
  phone: z.string().regex(/^\+1\d{10}$/, "Invalid phone number"),
  postalCode: postalCodeField,
  province: z.enum(PROVINCE_CODES),
  password: newPasswordField,
  acceptTerms: z.literal(true),
  isAdult: z.literal(true),
  marketingOptIn: z.boolean(),
  vin: z.string().optional(),
});

export type RegisterPayload = z.output<typeof registerPayloadSchema>;

// ---------- Login ----------

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginPayload = z.output<typeof loginSchema>;

// ---------- Contact verification (email + SMS OTP) ----------

export const otpFormSchema = z.object({ code: otpField });
export type OtpFormInput = z.input<typeof otpFormSchema>;

export const verifyPayloadSchema = z.object({
  registrationId: z.string().min(1),
  code: otpField,
});

export const resendPayloadSchema = z.object({
  registrationId: z.string().min(1),
  channel: z.enum(["email", "phone"]),
});

// ---------- Password recovery ----------

export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordFormInput = z.input<typeof resetPasswordFormSchema>;

export const resetPasswordPayloadSchema = z.object({
  token: z.string().min(1),
  password: newPasswordField,
});
