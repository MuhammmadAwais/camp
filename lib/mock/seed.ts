// Demo accounts for exercising the login flow against the mock API.
export const MOCK_DEMO_SELLER = {
  email: "seller@autonexa.ca",
  password: "password123",
  firstName: "Jordan",
  lastName: "Tremblay",
  phone: "+14165550142",
  postalCode: "M5V 2T6",
  province: "ON",
} as const;

export const MOCK_DEMO_DEALER = {
  email: "dealer@autonexa.ca",
  password: "password123",
  firstName: "Christopher",
  lastName: "Evans",
  phone: "+19055558291",
  postalCode: "L6M 4W9",
  province: "ON",
  dealershipName: "Pfaff Porsche Markham",
  licenseNumber: "OMVIC-481920",
} as const;

export const MOCK_DEMO_ADMIN = {
  email: "admin@autonexa.ca",
  password: "password123",
  firstName: "Sarah",
  lastName: "Tremblay",
  phone: "+14165559981",
  postalCode: "M5J 2Y1",
  province: "ON",
} as const;

// Every OTP the mock "sends" is this code. The UI shows a hint for it in mock mode.
export const MOCK_OTP_CODE = "000000";

// How long a mock KYC submission stays PENDING before the provider "approves" it.
export const MOCK_KYC_REVIEW_MS = 6000;

// Real VINs with valid check digits that NHTSA vPIC decodes — offered as one-tap demos in mock mode.
export const MOCK_DEMO_VINS = [
  { label: "2022 Honda Civic", vin: "2HGFE2F58NH512345" },
  { label: "2021 Ford F-150", vin: "1FTFW1E84MFA12345" },
  { label: "2023 Tesla Model 3", vin: "5YJ3E1EA8PF412345" },
] as const;
