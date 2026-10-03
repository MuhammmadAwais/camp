import * as React from "react";
import Image from "next/image";

export function BrandCarousel() {
  const brandLogos = [
    { name: "Audi", src: "/car-company-logos/image_09.png" },
    { name: "BMW", src: "/car-company-logos/image_10.png" },
    { name: "Mercedes-Benz", src: "/car-company-logos/image_11.png" },
    { name: "Porsche", src: "/car-company-logos/image_12.png" },
    { name: "Cadillac", src: "/car-company-logos/image_13.png" },
    { name: "Ford", src: "/car-company-logos/image_14.svg" },
    { name: "Jeep", src: "/car-company-logos/image_15.png" },
    { name: "Chevrolet", src: "/car-company-logos/image_16 - Copy.png" },
  ];

  const duplicatedLogos = [...brandLogos, ...brandLogos, ...brandLogos];

  return (
    <section className="relative w-full py-8 bg-[#120F0D] border-y border-white/10 overflow-hidden text-white">
      {/* Subtle marble texture layer for tactile quality */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: "url('/textures/dark-marble.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 mb-4 text-center relative z-10">
        <p className="font-body text-xs font-bold uppercase tracking-widest text-white/60">
          Trusted Wholesale Dealer Network Across All Leading Brands
        </p>
      </div>

      <div className="relative w-full overflow-hidden mask-radial-fade z-10">
        <div className="animate-marquee items-center gap-12 sm:gap-20 py-2">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="relative h-10 w-24 sm:h-11 sm:w-28 shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                fill
                unoptimized={logo.src.endsWith(".svg")}
                className="object-contain brightness-0 invert"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
