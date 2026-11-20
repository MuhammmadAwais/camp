/**
 * Idempotent Demo Auth & Auction Seed Script for AutoNexa / CAMP.
 * Run natively on Node 22+: `node --env-file=.env scripts/seed-auth-users.ts`
 *
 * TODO(senior-review): Keep demo user provisioning strictly out of production
 * pipelines unless explicitly running a staging QA environment.
 */
import { createClient } from "@supabase/supabase-js";

type UserRole = "SELLER" | "DEALER_ADMIN" | "DEALER_AGENT" | "ADMIN";
type DealerSeatRole = "DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR";

type DemoAccountConfig = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  postalCode: string;
  province: string;
  city: string;
  role: UserRole;
  kycStatus: "NOT_STARTED" | "PENDING" | "VERIFIED";
  dealershipLicense?: string;
  seatRole?: DealerSeatRole;
};

const DEMO_ACCOUNTS: DemoAccountConfig[] = [
  {
    email: "seller@autonexa.ca",
    password: "password123",
    firstName: "Jordan",
    lastName: "Tremblay",
    phoneE164: "+14165550142",
    postalCode: "M5V 2T6",
    province: "ON",
    city: "Toronto",
    role: "SELLER",
    kycStatus: "VERIFIED",
  },
  {
    email: "dealer@autonexa.ca",
    password: "password123",
    firstName: "Christopher",
    lastName: "Evans",
    phoneE164: "+19055558291",
    postalCode: "L3R 5H6",
    province: "ON",
    city: "Markham",
    role: "DEALER_ADMIN",
    kycStatus: "NOT_STARTED",
    dealershipLicense: "OMVIC-481920",
    seatRole: "DEALER_ADMIN",
  },
  {
    email: "agent@autonexa.ca",
    password: "password123",
    firstName: "Tyler",
    lastName: "Richardson",
    phoneE164: "+19055558299",
    postalCode: "L3R 5H6",
    province: "ON",
    city: "Markham",
    role: "DEALER_AGENT",
    kycStatus: "NOT_STARTED",
    dealershipLicense: "OMVIC-481920",
    seatRole: "DEALER_BUYER",
  },
  {
    email: "dealer2@autonexa.ca",
    password: "password123",
    firstName: "Marcus",
    lastName: "Chen",
    phoneE164: "+19055554410",
    postalCode: "L6L 6M6",
    province: "ON",
    city: "Oakville",
    role: "DEALER_ADMIN",
    kycStatus: "NOT_STARTED",
    dealershipLicense: "OMVIC-391204",
    seatRole: "DEALER_ADMIN",
  },
  {
    email: "admin@autonexa.ca",
    password: "password123",
    firstName: "Sarah",
    lastName: "Tremblay",
    phoneE164: "+14165559981",
    postalCode: "M5J 2Y1",
    province: "ON",
    city: "Toronto",
    role: "ADMIN",
    kycStatus: "VERIFIED",
  },
];

const DEMO_LISTING_IDS = {
  porscheMacan: "22222222-2222-4222-8222-222222222201",
  teslaModelY: "22222222-2222-4222-8222-222222222202",
  corvetteZ06: "22222222-2222-4222-8222-222222222203",
  fordF150: "22222222-2222-4222-8222-222222222204",
} as const;

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment."
    );
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Load seeded verified dealerships by license number
  const { data: dealerships, error: dealerFetchErr } = await admin
    .from("dealerships")
    .select("id, license_number");

  if (dealerFetchErr) {
    throw new Error(`Failed loading dealerships: ${dealerFetchErr.message}`);
  }

  const dealershipByLicense = new Map<string, string>();
  for (const row of dealerships ?? []) {
    dealershipByLicense.set(row.license_number, row.id);
  }

  // 2. List existing Auth users once for idempotency
  const { data: listUsersData, error: listUsersErr } =
    await admin.auth.admin.listUsers({ perPage: 200 });
  if (listUsersErr) {
    throw new Error(`Failed listing auth users: ${listUsersErr.message}`);
  }

  const existingByEmail = new Map<string, string>();
  for (const u of listUsersData.users) {
    if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
  }

  const userIdByEmail = new Map<string, string>();

  for (const account of DEMO_ACCOUNTS) {
    const dealershipId = account.dealershipLicense
      ? (dealershipByLicense.get(account.dealershipLicense) ?? null)
      : null;

    const existingId = existingByEmail.get(account.email.toLowerCase());
    let userId: string;

    if (existingId) {
      const { data: updated, error: updateErr } =
        await admin.auth.admin.updateUserById(existingId, {
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.firstName,
            last_name: account.lastName,
            phone_e164: account.phoneE164,
            postal_code: account.postalCode,
            province: account.province,
          },
          app_metadata: {
            role: account.role,
            dealership_id: dealershipId,
          },
        });
      if (updateErr || !updated.user) {
        throw new Error(
          `Failed updating auth user ${account.email}: ${updateErr?.message}`
        );
      }
      userId = updated.user.id;
    } else {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.firstName,
            last_name: account.lastName,
            phone_e164: account.phoneE164,
            postal_code: account.postalCode,
            province: account.province,
          },
          app_metadata: {
            role: account.role,
            dealership_id: dealershipId,
          },
        });
      if (createErr || !created.user) {
        throw new Error(
          `Failed creating auth user ${account.email}: ${createErr?.message}`
        );
      }
      userId = created.user.id;
    }

    userIdByEmail.set(account.email, userId);

    // Upsert canonical profile row
    const { error: profileErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        email: account.email,
        first_name: account.firstName,
        last_name: account.lastName,
        phone_e164: account.phoneE164,
        postal_code: account.postalCode,
        province: account.province,
        city: account.city,
        role: account.role,
        kyc_status: account.kycStatus,
        dealership_id: dealershipId,
        email_verified: true,
        phone_verified: true,
        account_status: "ACTIVE",
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      throw new Error(
        `Failed upserting profile for ${account.email}: ${profileErr.message}`
      );
    }

    if (dealershipId && account.seatRole) {
      const { error: memberErr } = await admin.from("dealership_members").upsert(
        {
          dealership_id: dealershipId,
          user_id: userId,
          seat_role: account.seatRole,
          is_active: true,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "dealership_id,user_id" }
      );
      if (memberErr) {
        throw new Error(
          `Failed upserting dealership member ${account.email}: ${memberErr.message}`
        );
      }
    }
  }

  const sellerId = userIdByEmail.get("seller@autonexa.ca");
  const adminId = userIdByEmail.get("admin@autonexa.ca");
  const dealer1UserId = userIdByEmail.get("dealer@autonexa.ca");
  const dealer2UserId = userIdByEmail.get("dealer2@autonexa.ca");
  const dealer1Id = dealershipByLicense.get("OMVIC-481920");
  const dealer2Id = dealershipByLicense.get("OMVIC-391204");

  if (!sellerId || !adminId || !dealer1UserId || !dealer2UserId || !dealer1Id || !dealer2Id) {
    throw new Error("Missing seeded IDs after account provisioning.");
  }

  // 3. Seed verified KYC submission for demo seller
  const { error: kycErr } = await admin.from("kyc_submissions").upsert(
    {
      user_id: sellerId,
      provider: "sandbox",
      provider_ref: "kyc_demo_seller_001",
      id_doc_type: "DRIVERS_LICENCE",
      status: "VERIFIED",
      reviewed_by: adminId,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (kycErr) {
    throw new Error(`Failed upserting demo KYC: ${kycErr.message}`);
  }

  // 4. Seed 4 Demo Vehicle Listings across statuses
  const now = Date.now();
  const hours = (h: number) => new Date(now + h * 3600 * 1000).toISOString();

  const listingsPayload = [
    {
      id: DEMO_LISTING_IDS.porscheMacan,
      seller_id: sellerId,
      vin: "WP1AF2AY5NL128491",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      body_type: "Compact SUV",
      engine_spec: "2.9L Twin-Turbo V6",
      horsepower: 434,
      fuel_type: "Premium Gasoline (91+)",
      mileage_km: 38450,
      transmission: "7-Speed Dual-Clutch PDK",
      drivetrain: "All-Wheel Drive (AWD)",
      exterior_color: "Volcano Grey Metallic",
      interior_color: "Black Leather",
      keys_count: 2,
      accident_declaration: false,
      has_lien: false,
      damage_grade: "A",
      damage_hotspot_count: 1,
      postal_code: "M5V 2T6",
      city: "Toronto",
      province: "ON",
      reserve_price_cents: 3650000,
      status: "ACTIVE",
      bid_count: 1,
      declaration_owner_attested: true,
      declaration_accurate_condition: true,
      declaration_no_unpaid_fines: true,
      moderated_by: adminId,
      moderated_at: hours(-6),
      auction_started_at: hours(-6),
      auction_ends_at: hours(18),
      seller_notes:
        "Single-owner Toronto vehicle with full Porsche dealer service records.",
    },
    {
      id: DEMO_LISTING_IDS.teslaModelY,
      seller_id: sellerId,
      vin: "5YJ3E1EA8PF412345",
      year: 2023,
      make: "Tesla",
      model: "Model Y",
      trim: "Long Range AWD",
      body_type: "Electric SUV",
      engine_spec: "Dual Permanent Magnet Electric Motors",
      horsepower: 384,
      fuel_type: "Battery Electric (EV)",
      mileage_km: 24100,
      transmission: "1-Speed Direct-Drive",
      drivetrain: "Dual-Motor AWD",
      exterior_color: "Pearl White Multi-Coat",
      interior_color: "All Black",
      keys_count: 2,
      accident_declaration: false,
      has_lien: false,
      damage_grade: "A",
      damage_hotspot_count: 0,
      postal_code: "L5B 2C9",
      city: "Mississauga",
      province: "ON",
      reserve_price_cents: 4200000,
      status: "ACTIVE",
      bid_count: 0,
      declaration_owner_attested: true,
      declaration_accurate_condition: true,
      declaration_no_unpaid_fines: true,
      moderated_by: adminId,
      moderated_at: hours(-19),
      auction_started_at: hours(-19),
      auction_ends_at: hours(5),
      seller_notes:
        "Pristine battery health, includes mobile charger and OEM mats.",
    },
    {
      id: DEMO_LISTING_IDS.corvetteZ06,
      seller_id: sellerId,
      vin: "1G1YC2D46P5104921",
      year: 2023,
      make: "Chevrolet",
      model: "Corvette",
      trim: "Z06 3LZ Coupe",
      body_type: "Coupe",
      engine_spec: "5.5L Naturally Aspirated V8",
      horsepower: 670,
      fuel_type: "Premium Gasoline",
      mileage_km: 8900,
      transmission: "8-Speed Dual Clutch",
      drivetrain: "Rear-Wheel Drive (RWD)",
      exterior_color: "Torch Red",
      interior_color: "Jet Black Carbon",
      keys_count: 2,
      accident_declaration: false,
      has_lien: false,
      damage_grade: "A",
      damage_hotspot_count: 0,
      postal_code: "H7T 1A1",
      city: "Laval",
      province: "QC",
      reserve_price_cents: 12500000,
      status: "PENDING_MODERATION",
      bid_count: 0,
      declaration_owner_attested: true,
      declaration_accurate_condition: true,
      declaration_no_unpaid_fines: true,
      seller_notes: "Z07 package, clean title, stored indoors.",
    },
    {
      id: DEMO_LISTING_IDS.fordF150,
      seller_id: sellerId,
      vin: "1FTFW1E84MFA12345",
      year: 2021,
      make: "Ford",
      model: "F-150",
      trim: "Lariat 502A SuperCrew",
      body_type: "Pickup Truck",
      engine_spec: "3.5L EcoBoost V6",
      horsepower: 400,
      fuel_type: "Regular Unleaded",
      mileage_km: 54300,
      transmission: "10-Speed Automatic",
      drivetrain: "4x4 / Four-Wheel Drive",
      exterior_color: "Agate Black Metallic",
      interior_color: "Black Leather",
      keys_count: 2,
      accident_declaration: false,
      has_lien: false,
      damage_grade: "B",
      damage_hotspot_count: 1,
      postal_code: "L4K 4T9",
      city: "Vaughan",
      province: "ON",
      reserve_price_cents: 3200000,
      status: "UNSEALED",
      bid_count: 2,
      declaration_owner_attested: true,
      declaration_accurate_condition: true,
      declaration_no_unpaid_fines: true,
      moderated_by: adminId,
      moderated_at: hours(-25),
      auction_started_at: hours(-25),
      auction_ends_at: hours(-1),
      closed_at: hours(-1),
      seller_notes: "Spray-in bedliner, panoramic moonroof, fresh oil service.",
    },
  ];

  const { error: listInsertErr } = await admin
    .from("listings")
    .upsert(listingsPayload, { onConflict: "id" });

  if (listInsertErr) {
    throw new Error(`Failed upserting demo listings: ${listInsertErr.message}`);
  }

  // 5. Seed Media & Damage Hotspots idempotently if missing
  for (const [listingId, url] of [
    [DEMO_LISTING_IDS.porscheMacan, "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"],
    [DEMO_LISTING_IDS.teslaModelY, "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80"],
    [DEMO_LISTING_IDS.corvetteZ06, "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"],
    [DEMO_LISTING_IDS.fordF150, "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80"],
  ] as const) {
    const { count } = await admin
      .from("listing_media")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId);

    if ((count ?? 0) === 0) {
      await admin.from("listing_media").insert({
        listing_id: listingId,
        storage_key: `seed/${listingId}/cover.jpg`,
        public_url: url,
        file_name: "cover.jpg",
        file_size_bytes: 250000,
        mime_type: "image/jpeg",
        photo_label: "Front 3/4 Exterior Profile",
        is_cover: true,
        sort_order: 0,
      });
    }
  }

  // 6. Seed 1 active sealed bid (on Macan) & 2 unsealed bids (on F-150)
  const demoBids = [
    {
      listing_id: DEMO_LISTING_IDS.porscheMacan,
      dealership_id: dealer1Id,
      placed_by_user_id: dealer1UserId,
      amount_cents: 3825000,
      status: "ACTIVE",
      idempotency_key: "seed-bid-macan-dealer1",
    },
    {
      listing_id: DEMO_LISTING_IDS.fordF150,
      dealership_id: dealer1Id,
      placed_by_user_id: dealer1UserId,
      amount_cents: 3450000,
      status: "ACTIVE",
      idempotency_key: "seed-bid-f150-dealer1",
    },
    {
      listing_id: DEMO_LISTING_IDS.fordF150,
      dealership_id: dealer2Id,
      placed_by_user_id: dealer2UserId,
      amount_cents: 3390000,
      status: "ACTIVE",
      idempotency_key: "seed-bid-f150-dealer2",
    },
  ];

  const { error: bidErr } = await admin
    .from("bids")
    .upsert(demoBids, { onConflict: "listing_id,dealership_id" });

  if (bidErr) {
    throw new Error(`Failed upserting demo bids: ${bidErr.message}`);
  }

  console.info(
    `[seed-auth-users] Seeded ${DEMO_ACCOUNTS.length} auth users, 4 demo listings, and 3 demo bids successfully.`
  );
}

main().catch((err: unknown) => {
  console.error("[seed-auth-users] Failed:", err);
  process.exit(1);
});
