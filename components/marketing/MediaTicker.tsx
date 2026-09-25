import * as React from "react";
import Image from "next/image";

export function MediaTicker() {
  const mediaPartners = [
    {
      name: "The Globe and Mail",
      src: "/brands-logo/globe-and-mail-logo.webp",
      width: 170,
      height: 40,
    },
    {
      name: "Toronto Star",
      src: "/brands-logo/tronto-star-logo.webp",
      width: 160,
      height: 38,
    },
    {
      name: "Auto Remarketing Canada",
      src: "/brands-logo/auto-remarketing-logo.png",
      width: 180,
      height: 42,
    },
    {
      name: "Yahoo! Finance",
      src: "/brands-logo/yahoo.png",
      width: 140,
      height: 38,
    },
    {
      name: "News Radio 680",
      src: "/brands-logo/news-radio-logo.png",
      width: 150,
      height: 42,
    },
  ];

  return (
    <section className="w-full bg-surface-container/70 border-y border-border-card/80 py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="shrink-0 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <p className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Recognized Across Canadian Automotive Media
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 sm:gap-12 opacity-85 hover:opacity-100 transition-opacity">
            {mediaPartners.map((item) => (
              <div
                key={item.name}
                className="relative h-8 sm:h-9 grayscale hover:grayscale-0 contrast-125 transition-all duration-300 opacity-75 hover:opacity-100 hover:scale-105"
                style={{ width: `${item.width * 0.75}px` }}
              >
                <Image
                  src={item.src}
                  alt={item.name}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
