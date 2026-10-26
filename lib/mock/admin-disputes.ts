export type DisputeCategory =
  | "UNDERBODY_DAMAGE"
  | "MISSING_KEYS"
  | "MECHANICAL_POWERTRAIN"
  | "ODOMETER_DISCREPANCY"
  | "UNRESOLVED_LIEN";

export type DisputeStatus = "INVESTIGATING" | "ACTION_REQUIRED" | "RESOLVED" | "CLOSED";

export type DisputePhoto = {
  url: string;
  label: string;
  isHoistEvidence?: boolean;
};

export type DisputeItem = {
  id: string;
  docketNumber: string;
  openedAt: string;
  openedDateFormatted: string;
  status: DisputeStatus;
  category: DisputeCategory;
  categoryLabel: string;
  agreedBidCents: number; // Integer CAD cents
  disputedAdjustmentCents: number; // Integer CAD cents requested deduction
  netSettlementCents: number; // agreedBidCents - disputedAdjustmentCents
  allegationSummary: string;
  hoistEvidenceNotes: string;
  complianceDecisionNotes?: string;
  seller: {
    name: string;
    email: string;
    phone: string;
    city: string;
    province: string;
    declaredConditionGrade: string;
  };
  dealership: {
    name: string;
    legalEntity: string;
    regulator: "OMVIC" | "AMVIC" | "VSA" | "OPC";
    licenseNumber: string;
    contactOfficer: string;
    technician: string;
    city: string;
    province: string;
  };
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileageKm: number;
    engineSpec?: string;
    transmission: string;
    drivetrain: string;
    thumbnailUrl: string;
    photos: DisputePhoto[];
  };
  timeline: Array<{
    timestamp: string;
    actor: string;
    action: string;
    note: string;
  }>;
};

export const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "dsp-2026-081",
    docketNumber: "DSP-2026-081",
    openedAt: "2026-10-26T15:30:00Z",
    openedDateFormatted: "4 hours ago",
    status: "INVESTIGATING",
    category: "UNDERBODY_DAMAGE",
    categoryLabel: "Undisclosed Hoist Corrosion",
    agreedBidCents: 3250000, // $32,500 CAD
    disputedAdjustmentCents: 150000, // $1,500 CAD
    netSettlementCents: 3100000, // $31,000 CAD
    allegationSummary:
      "Undisclosed underbody corrosion observed during hoist inspection. Dealership requested $1,500 CAD price reduction against original agreed winning bid.",
    hoistEvidenceNotes:
      "Photos submitted by certified red-seal technician at Woodbine Ford Commercial showing structural crossmember surface oxidation not disclosed in seller condition wizard Step 3.",
    seller: {
      name: "Robert Kelly",
      email: "r.kelly@gmail.com",
      phone: "+1 (905) 555-3819",
      city: "Vaughan",
      province: "ON",
      declaredConditionGrade: "Grade B (Normal Wear)",
    },
    dealership: {
      name: "Woodbine Ford Commercial",
      legalEntity: "Woodbine Motors Group Ltd.",
      regulator: "OMVIC",
      licenseNumber: "OMVIC-312984",
      contactOfficer: "Liam Henderson",
      technician: "Dave Kowalski (Red-Seal #310S)",
      city: "Etobicoke",
      province: "ON",
    },
    vehicle: {
      vin: "1FTFW1E84MFA12345",
      year: 2021,
      make: "Ford",
      model: "F-150",
      trim: "Lariat 502A SuperCrew 4x4",
      mileageKm: 68400,
      engineSpec: "3.5L EcoBoost Twin-Turbo V6 (400 hp)",
      transmission: "10-Speed Electronic Automatic",
      drivetrain: "Four-Wheel Drive (4WD)",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
          label: "Dealership Hoist Angle — Frame Rail Inspection",
          isHoistEvidence: true,
        },
        {
          url: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
          label: "Technician Macro Photo — Cab Mount Flange Oxidation",
          isHoistEvidence: true,
        },
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
          label: "Seller Original Front 3/4 Exterior Photo",
          isHoistEvidence: false,
        },
        {
          url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
          label: "Seller Original Underbody Declaration Photo",
          isHoistEvidence: false,
        },
      ],
    },
    timeline: [
      {
        timestamp: "Oct 26, 11:30 AM",
        actor: "Woodbine Ford Commercial",
        action: "HOIST_INSPECTION_FLAGGED",
        note: "Technician logged 1500 CAD adjustment claim during post-auction 48h physical intake.",
      },
      {
        timestamp: "Oct 26, 01:15 PM",
        actor: "Robert Kelly (Seller)",
        action: "SELLER_REBUTTAL_FILED",
        note: "Seller states vehicle was driven through Ontario highway salt and frame is surface-only with no penetration.",
      },
      {
        timestamp: "Oct 26, 03:30 PM",
        actor: "AutoNexa Mediation Officer",
        action: "CASE_UNDER_INVESTIGATION",
        note: "Escrow funds locked. High-resolution technician photos requested for arbitration review.",
      },
    ],
  },
  {
    id: "dsp-2026-085",
    docketNumber: "DSP-2026-085",
    openedAt: "2026-10-26T13:45:00Z",
    openedDateFormatted: "6 hours ago",
    status: "ACTION_REQUIRED",
    category: "MECHANICAL_POWERTRAIN",
    categoryLabel: "Transfer Case Drivetrain Shudder",
    agreedBidCents: 7400000, // $74,000 CAD
    disputedAdjustmentCents: 320000, // $3,200 CAD
    netSettlementCents: 7080000, // $70,800 CAD
    allegationSummary:
      "All-wheel drive transfer case clutch binding and shudder detected during standard dealership road test. Technical diagnostic scan reveals internal friction plate slip.",
    hoistEvidenceNotes:
      "Pfaff Porsche certified diagnostic printout showing fault code 000021 (Transfer Box Mechanical Failure). Replacement actuator quote attached ($3,200 CAD parts + labour).",
    seller: {
      name: "Marcus Sterling",
      email: "m.sterling@sterlingcapital.ca",
      phone: "+1 (416) 555-9014",
      city: "Toronto",
      province: "ON",
      declaredConditionGrade: "Grade A (Clean Certified)",
    },
    dealership: {
      name: "Pfaff Porsche Markham",
      legalEntity: "Pfaff Automotive Partners Inc.",
      regulator: "OMVIC",
      licenseNumber: "OMVIC-481920",
      contactOfficer: "Christopher Evans",
      technician: "Marc Bouchard (Porsche Gold Certified)",
      city: "Markham",
      province: "ON",
    },
    vehicle: {
      vin: "WP1AF2AY5NL128491",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      mileageKm: 34200,
      engineSpec: "2.9L Twin-Turbocharged V6 (434 hp)",
      transmission: "7-Speed Porsche Doppelkupplung (PDK)",
      drivetrain: "All-Wheel Drive (AWD)",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
          label: "Vehicle Stage Photo — Delivery Dropoff",
          isHoistEvidence: false,
        },
        {
          url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
          label: "Porsche PIWIS Diagnostic Scanner Readout",
          isHoistEvidence: true,
        },
      ],
    },
    timeline: [
      {
        timestamp: "Oct 26, 01:45 PM",
        actor: "Pfaff Porsche Markham",
        action: "TRANSFER_CASE_DEFECT_FILED",
        note: "Diagnostic report submitted with repair estimate. Dealership requests seller credit or mutual cancellation.",
      },
    ],
  },
  {
    id: "dsp-2026-074",
    docketNumber: "DSP-2026-074",
    openedAt: "2026-10-24T18:00:00Z",
    openedDateFormatted: "2 days ago",
    status: "RESOLVED",
    category: "MISSING_KEYS",
    categoryLabel: "Missing Smart Key Fob",
    agreedBidCents: 2150000, // $21,500 CAD
    disputedAdjustmentCents: 35000, // $350 CAD
    netSettlementCents: 2115000, // $21,150 CAD
    allegationSummary:
      "Seller arrived with only 1 primary key fob despite declaring 2 smart keys during listing wizard Step 2 equipment checklist.",
    hoistEvidenceNotes:
      "Dealer invoice from Formula Honda parts department for replacement OEM fob and proximity programming ($350.00 CAD).",
    complianceDecisionNotes:
      "Seller agreed to $350.00 key replacement deduction. Adjusted EFT payout of $21,150 CAD released from escrow on Oct 25.",
    seller: {
      name: "Sonia Patel",
      email: "sonia.patel88@rogers.com",
      phone: "+1 (905) 555-7731",
      city: "Brampton",
      province: "ON",
      declaredConditionGrade: "Grade B",
    },
    dealership: {
      name: "Formula Honda Scarborough",
      legalEntity: "Formula Motors Toronto Inc.",
      regulator: "OMVIC",
      licenseNumber: "OMVIC-190284",
      contactOfficer: "Michael Chang",
      technician: "Alex Rivera",
      city: "Scarborough",
      province: "ON",
    },
    vehicle: {
      vin: "2HGFC1F84MH501928",
      year: 2020,
      make: "Honda",
      model: "Civic",
      trim: "Touring Sedan",
      mileageKm: 52100,
      engineSpec: "1.5L Turbo 4-Cylinder (174 hp)",
      transmission: "CVT with Paddle Shifters",
      drivetrain: "Front-Wheel Drive (FWD)",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80",
          label: "Vehicle Front Intake Inspection",
          isHoistEvidence: false,
        },
      ],
    },
    timeline: [
      {
        timestamp: "Oct 24, 06:00 PM",
        actor: "Formula Honda",
        action: "KEY_CLAIM_FILED",
        note: "Missing key credit requested.",
      },
      {
        timestamp: "Oct 25, 10:00 AM",
        actor: "AutoNexa Compliance Officer",
        action: "MUTUAL_SETTLEMENT_APPROVED",
        note: "Deduction accepted by seller. Escrow release authorization executed.",
      },
    ],
  },
  {
    id: "dsp-2026-092",
    docketNumber: "DSP-2026-092",
    openedAt: "2026-10-25T11:20:00Z",
    openedDateFormatted: "Yesterday",
    status: "INVESTIGATING",
    category: "UNRESOLVED_LIEN",
    categoryLabel: "Lien Payout Over-Disclose",
    agreedBidCents: 4450000, // $44,500 CAD
    disputedAdjustmentCents: 250000, // $2,500 CAD
    netSettlementCents: 4200000, // $42,000 CAD
    allegationSummary:
      "Bank lien balance from Scotiabank automotive financing is $2,500 CAD higher than the seller's self-declared payout statement provided during intake.",
    hoistEvidenceNotes:
      "Official 10-day PPSA payout letter from Scotiabank Dealer Finance uploaded by Stampede Toyota Commercial.",
    seller: {
      name: "David Chen",
      email: "david.chen@gmail.com",
      phone: "+1 (905) 555-1239",
      city: "Markham",
      province: "ON",
      declaredConditionGrade: "Grade A",
    },
    dealership: {
      name: "Stampede Toyota Commercial",
      legalEntity: "Stampede Automotive Holdings Inc.",
      regulator: "AMVIC",
      licenseNumber: "AMVIC-849201",
      contactOfficer: "Brett MacLeod",
      technician: "Dan Henderson",
      city: "Calgary",
      province: "AB",
    },
    vehicle: {
      vin: "2T2HZMDA3NC129841",
      year: 2022,
      make: "Lexus",
      model: "RX 350",
      trim: "F SPORT Series 3 AWD",
      mileageKm: 42100,
      engineSpec: "3.5L DOHC V6 24V (295 hp)",
      transmission: "8-Speed Direct-Shift Automatic",
      drivetrain: "All-Wheel Drive (AWD)",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
          label: "Lexus RX 350 Intake Stage",
          isHoistEvidence: false,
        },
      ],
    },
    timeline: [
      {
        timestamp: "Oct 25, 11:20 AM",
        actor: "Stampede Toyota",
        action: "LIEN_BALANCE_VARIANCE",
        note: "PPSA discharge requires $2,500 CAD additional bank wire allocation.",
      },
    ],
  },
];
