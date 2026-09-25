"use client";

import * as React from "react";
import Image from "next/image";

interface BodyType {
  id: string;
  name: string;
  src: string;
}

const bodyTypes: BodyType[] = [
  { id: "suv", name: "SUVs", src: "/plain-cars-images/image_30.png" },
  { id: "truck", name: "Trucks", src: "/plain-cars-images/image_31.png" },
  { id: "sedan", name: "Sedans", src: "/plain-cars-images/image_32.png" },
  { id: "coupe", name: "Coupes", src: "/plain-cars-images/image_33.png" },
  { id: "minivan", name: "Minivans", src: "/plain-cars-images/image_34.png" },
  { id: "hatchback", name: "Hatchbacks", src: "/plain-cars-images/image_35.png" },
  { id: "convertible", name: "Convertibles", src: "/plain-cars-images/image_36.png" },
  { id: "wagon", name: "Station Wagons", src: "/plain-cars-images/image_37.webp" },
];

interface BodyTypeSelectorProps {
  selected?: string;
  onSelect?: (id: string) => void;
}

export function BodyTypeSelector({
  selected = "suv",
  onSelect,
}: BodyTypeSelectorProps) {
  const [active, setActive] = React.useState(selected);

  const handleClick = (id: string) => {
    setActive(id);
    onSelect?.(id);
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <span className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Browse by Body Type
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
        {bodyTypes.map((type) => {
          const isSelected = active === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleClick(type.id)}
              className="group flex flex-col items-center justify-center p-1 transition-all duration-200 cursor-pointer text-center bg-transparent border-0 outline-none focus:outline-none"
            >
              <div
                className={`relative h-11 w-full min-w-[50px] mb-1.5 transition-all duration-200 ${
                  isSelected
                    ? "scale-110 drop-shadow-sm"
                    : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                }`}
              >
                <Image
                  src={type.src}
                  alt={type.name}
                  fill
                  className="object-contain"
                  sizes="120px"
                />
              </div>
              <span
                className={`font-body text-[11px] tracking-tight truncate w-full transition-colors ${
                  isSelected
                    ? "text-primary font-bold"
                    : "text-on-surface-variant font-medium group-hover:text-primary"
                }`}
              >
                {type.name}
              </span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
