export type ModerationPhoto = {
  url: string;
  label: string;
};

export type ModerationItem = {
  id: string;
  submittedAt: string;
  seller: {
    name: string;
    email: string;
    phone: string;
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
    reservePriceCents: number; // Integer CAD cents
    damageGrade: string;
    damageHotspotCount: number;
    photosCount: number;
    thumbnailUrl: string;
    photos: ModerationPhoto[];
    lienDisclosed: boolean;
    lienHolder?: string;
    keysCount: number;
    sellerNotes: string;
    carfaxSummary?: {
      owners: number;
      accidents: number;
      serviceRecords: number;
    };
  };
  checks: {
    vinDecoded: boolean;
    odometerLegible: boolean;
    damageMapped: boolean;
    ownershipVerified: boolean;
  };
  status: "PENDING" | "APPROVED" | "EDITS_REQUESTED" | "REJECTED";
};

export const INITIAL_MODERATION_QUEUE: ModerationItem[] = [
  {
    id: "mod-corvette-z06-2023",
    submittedAt: "24 min ago",
    seller: {
      name: "Jean-Philippe Tremblay",
      email: "jp.tremblay@videotron.ca",
      phone: "+1 (514) 555-8932",
      city: "Laval",
      province: "QC",
    },
    vehicle: {
      vin: "1G1YC2D46P5104921",
      year: 2023,
      make: "Chevrolet",
      model: "Corvette",
      trim: "Z06 3LZ Coupe",
      mileageKm: 8900,
      engineSpec: "5.5L Naturally Aspirated Flat-Plane V8 (670 hp)",
      transmission: "8-Speed Dual Clutch (Tremec)",
      drivetrain: "Rear-Wheel Drive (RWD)",
      reservePriceCents: 12500000, // $125,000.00 CAD
      damageGrade: "A",
      damageHotspotCount: 0,
      photosCount: 22,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
          label: "Front 3/4 Exterior Profile",
        },
        {
          url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80",
          label: "Rear Fascia & Quad Exhausts",
        },
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
          label: "Driver Cockpit & Carbon Trim",
        },
        {
          url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80",
          label: "Digital Instrument Cluster (8,900 km)",
        },
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Single owner vehicle. Equipped with Z07 Carbon Ceramic Brakes package and full frontal SunTek PPF. Clean title in hand.",
      carfaxSummary: {
        owners: 1,
        accidents: 0,
        serviceRecords: 3,
      },
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
  {
    id: "mod-lexus-rx350-2022",
    submittedAt: "1 hour ago",
    seller: {
      name: "David Chen",
      email: "d.chen@gmail.com",
      phone: "+1 (416) 555-4421",
      city: "Markham",
      province: "ON",
    },
    vehicle: {
      vin: "2T2HZMDA3NC129841",
      year: 2022,
      make: "Lexus",
      model: "RX 350",
      trim: "F SPORT Series 3 AWD",
      mileageKm: 42100,
      engineSpec: "3.5L DOHC V6 24V (295 hp)",
      transmission: "8-Speed Automatic",
      drivetrain: "All-Wheel Drive (AWD)",
      reservePriceCents: 4450000, // $44,500.00 CAD
      damageGrade: "B",
      damageHotspotCount: 2,
      photosCount: 15,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80",
          label: "Front 3/4 Exterior Profile",
        },
        {
          url: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1600&q=80",
          label: "Rear Passenger Profile",
        },
        {
          url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80",
          label: "Odometer Cluster (42,100 km)",
        },
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Two small rear bumper paint scuffs fully declared. Serviced exclusively at Lexus of Richmond Hill. Brand new Michelin all-season tires.",
      carfaxSummary: {
        owners: 1,
        accidents: 0,
        serviceRecords: 6,
      },
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
  {
    id: "mod-hyundai-tucson-2021",
    submittedAt: "2 hours ago",
    seller: {
      name: "Kavita Sharma",
      email: "kavita.s@rogers.com",
      phone: "+1 (905) 555-1290",
      city: "Brampton",
      province: "ON",
    },
    vehicle: {
      vin: "KM8JN8W37MU291048",
      year: 2021,
      make: "Hyundai",
      model: "Tucson",
      trim: "Preferred Trend AWD",
      mileageKm: 68400,
      engineSpec: "2.4L 4-Cylinder GDI (181 hp)",
      transmission: "6-Speed Automatic",
      drivetrain: "All-Wheel Drive (AWD)",
      reservePriceCents: 2100000, // $21,000.00 CAD
      damageGrade: "C",
      damageHotspotCount: 3,
      photosCount: 11,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80",
          label: "Front Elevation",
        },
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
          label: "Cabin Overview",
        },
        {
          url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80",
          label: "Odometer Cluster (68,400 km)",
        },
      ],
      lienDisclosed: true,
      lienHolder: "Scotiabank Auto Finance ($4,500 CAD balance)",
      keysCount: 1,
      sellerNotes: "Lien balance of approx $4,500 with Scotiabank. Clean interior with minor passenger rocker panel scratch.",
      carfaxSummary: {
        owners: 2,
        accidents: 1,
        serviceRecords: 4,
      },
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
  {
    id: "mod-porsche-macan-2022",
    submittedAt: "4 hours ago",
    seller: {
      name: "Marcus Vance",
      email: "m.vance@vancemedia.ca",
      phone: "+1 (416) 555-8812",
      city: "Toronto",
      province: "ON",
    },
    vehicle: {
      vin: "WP1AB2AY4NL189421",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      mileageKm: 38459,
      engineSpec: "2.9L Twin-Turbo V6 (434 hp)",
      transmission: "7-Speed Porsche Doppelkupplung (PDK)",
      drivetrain: "All-Wheel Drive (AWD)",
      reservePriceCents: 6800000, // $68,000.00 CAD
      damageGrade: "A",
      damageHotspotCount: 0,
      photosCount: 28,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80",
          label: "Exterior Front Profile",
        },
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
          label: "Leather Interior & Sport Chrono",
        },
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Immaculate condition. Factory Porsche warranty valid through 2026. Ceramic coated.",
      carfaxSummary: {
        owners: 1,
        accidents: 0,
        serviceRecords: 5,
      },
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "APPROVED",
  },
  {
    id: "mod-ford-f150-2021",
    submittedAt: "6 hours ago",
    seller: {
      name: "Tyler Robert",
      email: "tyler.robert@shaw.ca",
      phone: "+1 (403) 555-7193",
      city: "Calgary",
      province: "AB",
    },
    vehicle: {
      vin: "1FTFW1ED6MFC74821",
      year: 2021,
      make: "Ford",
      model: "F-150",
      trim: "Lariat 4x4 SuperCrew",
      mileageKm: 54300,
      engineSpec: "3.5L EcoBoost V6 (400 hp)",
      transmission: "10-Speed Automatic",
      drivetrain: "Four-Wheel Drive (4WD)",
      reservePriceCents: 3950000, // $39,500.00 CAD
      damageGrade: "B",
      damageHotspotCount: 2,
      photosCount: 18,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=80",
          label: "Front Quarter Angle",
        },
        {
          url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80",
          label: "Odometer Cluster (54,300 km)",
        },
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Bedliner installed. Minor tailgate scratch declared in damage map.",
      carfaxSummary: {
        owners: 1,
        accidents: 0,
        serviceRecords: 7,
      },
    },
    checks: {
      vinDecoded: true,
      odometerLegible: false,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "EDITS_REQUESTED",
  },
];
