import { BadgeCheck, PenLine } from "lucide-react";
import type { DecodedVehicle } from "@/lib/schemas/vehicle-schema";

interface Props {
  vehicle: DecodedVehicle;
  onEdit?: () => void;
}

export function DecodedVehicleCard({ vehicle, onEdit }: Props) {
  const isDecoded = vehicle.source === "VPIC";
  const title = isDecoded ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : "Vehicle details needed";
  const specs = [vehicle.engine, vehicle.drivetrain, vehicle.fuelType].filter((spec): spec is string => Boolean(spec));

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-[#008C87]">
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
            {isDecoded ? "Verified vehicle" : "VIN accepted"}
          </p>
          <p className="mt-1.5 font-headline text-xl font-bold text-gray-900 leading-tight">
            {title}
            {isDecoded && vehicle.trim && <span className="ml-2 font-body text-base font-medium text-gray-500">{vehicle.trim}</span>}
          </p>
          <p className="mt-1 font-mono text-sm tracking-wider text-gray-500 break-all">{vehicle.vin}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-body text-xs font-semibold text-[#008C87] hover:bg-[#008C87]/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008C87]"
          >
            <PenLine className="w-3.5 h-3.5" aria-hidden />
            Edit VIN
          </button>
        )}
      </div>

      {isDecoded && specs.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Decoded specifications">
          {specs.map((spec) => (
            <li key={spec} className="rounded-full border border-gray-200 bg-white px-3 py-1 font-body text-xs font-medium text-gray-600">
              {spec}
            </li>
          ))}
        </ul>
      )}

      {!isDecoded && (
        <p className="mt-3 font-body text-sm text-gray-500 leading-relaxed">
          We couldn&apos;t auto-fill this VIN right now. It&apos;s valid, so you can continue — you&apos;ll confirm the year,
          make and model yourself when you create the listing.
        </p>
      )}
    </div>
  );
}
