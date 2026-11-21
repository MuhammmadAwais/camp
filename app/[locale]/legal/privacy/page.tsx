import React from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalViewLayout, type LegalSection } from "@/components/legal/LegalViewLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoNexa Canada",
  description:
    "AutoNexa Canada PIPEDA and Quebec Law 25 privacy compliance disclosures, client-side EXIF data scrubbing, and identity protection.",
};

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "data-controller",
    number: 1,
    title: "1. Data Controller & Canadian Governance",
    content: (
      <>
        <p>
          The legal data controller responsible for the AutoNexa digital exchange platform, wholesale dealer terminal, and associated mobile services is:
        </p>

        {/* Clean proportional address block matching Lotessa reference image */}
        <div className="py-2 pl-4 border-l-2 border-portal-border/60 space-y-1 text-sm text-portal-text/90 font-body">
          <p className="font-bold text-portal-text">AutoNexa Canada Inc.</p>
          <p>100 King Street West, Suite 5600</p>
          <p>Toronto, Ontario M5X 1C9, Canada</p>
          <p>
            Platform:{" "}
            <a
              href="https://autonexa.ca"
              target="_blank"
              rel="noreferrer"
              className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
            >
              www.autonexa.ca
            </a>
          </p>
          <p>
            Privacy Office:{" "}
            <a
              href="mailto:privacy@autonexa.ca"
              className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
            >
              privacy@autonexa.ca
            </a>
          </p>
          <p>Toll-Free Inquiries: 1 (800) 555-NEXA (6392)</p>
        </div>

        <p>
          AutoNexa operates in strict compliance with the federal{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Personal Information Protection and Electronic Documents Act (PIPEDA)
          </mark>
          , Quebec{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Law 25
          </mark>{" "}
          (An Act to modernize legislative provisions as regards the protection of personal information), and provincial automotive dealer statutes across Ontario (OMVIC), Alberta (AMVIC), and British Columbia (VSA).
        </p>
      </>
    ),
  },
  {
    id: "data-collection",
    number: 2,
    title: "2. Data Collection & Vehicle Information",
    content: (
      <>
        <p>
          We collect personal, vehicular, and transactional information strictly necessary to facilitate wholesale auction discovery, lien clearing, and title transfer:
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Vehicle Specifications:</strong> 17-character VIN, verified odometer reading in kilometers, mechanical condition disclosures, maintenance histories, and 2D damage hotspot mappings.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Identity & Ownership:</strong> Government photo ID (Driver&apos;s License/Passport) used solely for biometric anti-fraud validation and provincial ownership title verification.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Contact Coordinates:</strong> Verified Canadian mobile telephone number, email address, and general municipal vicinity (e.g. &ldquo;Markham, ON&rdquo;).
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "exif-scrubbing",
    number: 3,
    title: "3. Client-Side EXIF Scrubbing & Photo Privacy",
    content: (
      <>
        <p>
          When you capture or upload vehicle showcase photographs, our proprietary{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            client-side privacy engine
          </mark>{" "}
          executes an automated EXIF metadata scrubber directly in your browser prior to any network transmission.
        </p>
        <p>
          All satellite GPS coordinates, device serial numbers, sensor timestamps, and home street location tags embedded by mobile camera sensors are permanently scrubbed. Images are converted into compressed WebP format with randomized cryptographic hashes to prevent location reverse-engineering.
        </p>
      </>
    ),
  },
  {
    id: "sealed-bid-confidentiality",
    number: 4,
    title: "4. Sealed-Bid Secrecy & Contact Confidentiality",
    content: (
      <>
        <p>
          During active 24-hour wholesale auctions, seller identity remains entirely encrypted and confidential under our{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Sealed-Bid Invariant
          </mark>
          :
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Bidding dealerships receive only general municipal vicinity and calculated transit distance.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Competing dealerships are strictly barred from seeing competing bid dollar amounts or seller reserve floors.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Seller contact information is unsealed exclusively to the single winning dealership chosen by the seller to coordinate vehicle hoist check.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    number: 5,
    title: "5. Your Rights Under PIPEDA & Quebec Law 25",
    content: (
      <>
        <p>
          Under Canadian privacy frameworks (PIPEDA &amp; Quebec Law 25), you possess statutory, legally enforceable rights regarding your personal records:
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Right of Access:</strong> Request access to and copies of your computerized personal records.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Data Portability:</strong> Obtain your records in a structured, commonly used technological format.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Right to Erasure:</strong> Request the deletion (&ldquo;right to be forgotten&rdquo;) of obsolete identity records.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Consent Revocation:</strong> Withdraw consent for electronic commercial messaging (CASL) at any time.</span>
          </li>
        </ul>
        <p className="pt-2">
          To exercise any statutory rights, submit an encrypted request to:{" "}
          <a
            href="mailto:privacy@autonexa.ca"
            className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
          >
            privacy@autonexa.ca
          </a>
        </p>
        <p className="text-xs italic text-portal-text-muted/80">
          You also maintain the right to lodge a formal complaint with the{" "}
          <a
            href="https://www.priv.gc.ca"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-portal-border hover:text-portal-text transition-colors"
          >
            Office of the Privacy Commissioner of Canada (OPC)
          </a>{" "}
          or the{" "}
          <a
            href="https://www.cai.gouv.qc.ca"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-portal-border hover:text-portal-text transition-colors"
          >
            Commission d&apos;accès à l&apos;information du Québec (CAI)
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    number: 6,
    title: "6. Data Security & Sovereign Canadian Hosting",
    content: (
      <>
        <p>
          We implement rigorous technical and organizational security measures to protect your vehicle and identity records from unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p>
          All databases and file repositories reside exclusively within Canadian data centers (
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            AWS ca-central-1, Montreal
          </mark>
          ) to guarantee sovereign Canadian jurisdiction. Network transit utilizes{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            TLS 1.3
          </mark>
          , and database volumes are encrypted with AES-256 rest encryption.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    number: 7,
    title: "7. Data Retention & Biometric Purge Limits",
    content: (
      <>
        <p>
          AutoNexa adheres strictly to the principle of limited retention. Raw biometric image scans uploaded during identity verification are permanently deleted within 15 minutes of cryptographic token generation.
        </p>
        <p>
          Completed transaction contracts, bills of sale, and dispute arbitration filings are retained for seven (7) years strictly in accordance with Canada Revenue Agency (CRA) tax audit requirements and provincial motor vehicle dealer council statutes (OMVIC, AMVIC, VSA).
        </p>
      </>
    ),
  },
];

const PRIVACY_SECTIONS_FR: LegalSection[] = [
  {
    id: "data-controller",
    number: 1,
    title: "1. Responsable du traitement & Gouvernance canadienne",
    content: (
      <>
        <p>
          Le responsable légal du traitement des renseignements personnels pour la bourse numérique AutoNexa, le terminal de gros concessionnaire et les services associés est :
        </p>
        <div className="py-2 pl-4 border-l-2 border-portal-border/60 space-y-1 text-sm text-portal-text/90 font-body">
          <p className="font-bold text-portal-text">AutoNexa Canada Inc.</p>
          <p>100 King Street West, Bureau 5600</p>
          <p>Toronto, Ontario M5X 1C9, Canada</p>
          <p>
            Responsable de la protection des renseignements personnels (Loi 25) :{" "}
            <a
              href="mailto:privacy@autonexa.ca"
              className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
            >
              privacy@autonexa.ca
            </a>
          </p>
          <p>Ligne sans frais : 1 (800) 555-NEXA (6392)</p>
        </div>
        <p>
          AutoNexa exerce ses activités en stricte conformité avec la{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE / PIPEDA)
          </mark>
          , la{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Loi 25 du Québec
          </mark>{" "}
          (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) ainsi que les lois provinciales encadrant le commerce automobile (OMVIC, AMVIC, VSA, OPC).
        </p>
      </>
    ),
  },
  {
    id: "data-collection",
    number: 2,
    title: "2. Collecte des données & Renseignements sur le véhicule",
    content: (
      <>
        <p>
          Nous recueillons uniquement les renseignements personnels, techniques et transactionnels strictement nécessaires à la tenue des enchères scellées, à la vérification des privilèges et au transfert de propriété :
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Spécifications du véhicule :</strong> NIV à 17 caractères, kilométrage vérifié, déclarations d&apos;état mécanique, historique d&apos;entretien et cartographie 2D des dommages.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Identité &amp; Propriété (KYC) :</strong> Pièce d&apos;identité officielle avec photo utilisée exclusivement pour la prévention de la fraude et la validation du certificat d&apos;immatriculation.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Coordonnées :</strong> Numéro de téléphone mobile canadien vérifié, adresse courriel et municipalité générale.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "exif-scrubbing",
    number: 3,
    title: "3. Suppression EXIF côté client & Confidentialité photo",
    content: (
      <>
        <p>
          Lorsque vous téléversez des photographies de votre véhicule, notre{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            moteur de confidentialité côté client
          </mark>{" "}
          supprime automatiquement les métadonnées EXIF directement dans votre navigateur avant toute transmission réseau.
        </p>
        <p>
          Toutes les coordonnées GPS, numéros de série d&apos;appareil et balises de localisation résidentielle sont définitivement effacés et les images sont réencodées en format WebP sécurisé.
        </p>
      </>
    ),
  },
  {
    id: "sealed-bid-confidentiality",
    number: 4,
    title: "4. Secret des offres scellées & Cloisonnement des données",
    content: (
      <>
        <p>
          Pendant les enchères de gros de 24 heures, l&apos;identité du vendeur demeure chiffrée et confidentielle en vertu de notre{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Invariant d&apos;offres scellées
          </mark>{" "}
          :
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Les concessionnaires soumissionnaires ne voient que la municipalité générale et la distance calculée.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Aucun concessionnaire ne peut consulter les montants en dollars des offres concurrentes ni le prix de réserve du vendeur.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Les coordonnées du vendeur ne sont dévoilées qu&apos;au seul concessionnaire gagnant sélectionné par le vendeur.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    number: 5,
    title: "5. Vos droits en vertu de la LPRPDE et de la Loi 25 du Québec",
    content: (
      <>
        <p>
          Conformément à la LPRPDE et à la Loi 25 du Québec, vous disposez des droits légaux suivants sur vos renseignements personnels :
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Droit d&apos;accès et de portabilité :</strong> Exporter vos dossiers personnels informatisés en format JSON structuré directement depuis vos paramètres de profil.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Droit à l&apos;effacement (désindexation) :</strong> Demander l&apos;anonymisation et la suppression de votre compte sous 30 jours.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Retrait du consentement LCAP :</strong> Révoquer à tout moment votre consentement aux communications électroniques commerciales en un clic.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-security",
    number: 6,
    title: "6. Sécurité des données & Hébergement souverain au Canada",
    content: (
      <>
        <p>
          Toutes les bases de données et tous les dépôts de fichiers résident exclusivement dans des centres de données canadiens (
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            AWS ca-central-1, Montréal
          </mark>
          ) avec chiffrement TLS 1.3 en transit et AES-256 au repos.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    number: 7,
    title: "7. Conservation des données & Journaux d'audit cryptographiques",
    content: (
      <>
        <p>
          Les contrats de transaction complétés et les registres d&apos;arbitrage sont conservés pendant sept (7) ans conformément aux exigences fiscales de l&apos;Agence du revenu du Canada (ARC) et aux lois provinciales sur le commerce des véhicules routiers.
        </p>
      </>
    ),
  },
];

export default async function PrivacyPolicyPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("legal"),
  ]);
  const sections = locale === "fr" ? PRIVACY_SECTIONS_FR : PRIVACY_SECTIONS;

  return (
    <LegalViewLayout
      activeDocument="privacy"
      title={t("privacyTitle")}
      effectiveDate={t("privacyEffectiveDate")}
      introText={t("privacyIntro")}
      sections={sections}
    />
  );
}
