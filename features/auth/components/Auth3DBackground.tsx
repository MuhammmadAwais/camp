'use client';

import React from 'react';
import Image from 'next/image';

export function Auth3DBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Deep Atmospheric Dark Canvas with Brand Green / Emerald Lighting (as in reference) */}
      <div className="absolute inset-0 bg-[#000000]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_32%,rgba(0,180,130,0.26)_0%,rgba(0,110,85,0.12)_45%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_80%,rgba(0,140,110,0.14)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,120,95,0.06)_0%,transparent_80%)]" />

      {/* 2. Floating Textured 3D Sculptures: Balanced 4-Quadrant Framing */}
      {/* Quadrant 1 (Top-Right): Large Frosted Glass Helix Spiral */}
      <div className="absolute -top-10 -right-12 sm:top-0 sm:right-[4%] lg:right-[8%] 2xl:right-[12%] w-[380px] sm:w-[460px] lg:w-[540px] 2xl:w-[620px] aspect-square animate-float-slow transition-transform opacity-90">
        <Image
          src="/auth-3d/glass/helix-glass.png"
          alt="3D Frosted Glass Helix"
          fill
          priority
          sizes="(max-width: 1024px) 460px, (max-width: 1536px) 540px, 620px"
          className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* Quadrant 2 (Bottom-Right): Fluid Frosted Glass Ribbon Loop */}
      <div className="absolute bottom-[2%] right-[3%] sm:right-[6%] lg:right-[10%] 2xl:right-[15%] w-[280px] sm:w-[340px] lg:w-[400px] 2xl:w-[460px] aspect-square animate-float-slow opacity-80 hidden sm:block">
        <Image
          src="/auth-3d/glass/ribbon-glass.png"
          alt="3D Frosted Glass Ribbon"
          fill
          sizes="(max-width: 1024px) 340px, (max-width: 1536px) 400px, 460px"
          className="object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Quadrant 3 (Bottom-Left): Frosted Glass Torus Ring */}
      <div className="absolute -bottom-14 -left-12 sm:bottom-[3%] sm:left-[4%] lg:left-[8%] 2xl:left-[12%] w-[320px] sm:w-[400px] lg:w-[460px] 2xl:w-[520px] aspect-square animate-float-reverse transition-transform opacity-85">
        <Image
          src="/auth-3d/glass/torus-glass.png"
          alt="3D Frosted Glass Torus"
          fill
          priority
          sizes="(max-width: 1024px) 400px, (max-width: 1536px) 460px, 520px"
          className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* Quadrant 4 (Top/Mid-Left): Aerodynamic Frosted Glass Pebble Sculpture (Balances left side) */}
      <div className="absolute top-[20%] -left-8 sm:top-[22%] sm:left-[3%] lg:left-[7%] 2xl:left-[11%] w-[240px] sm:w-[300px] lg:w-[350px] 2xl:w-[400px] aspect-square animate-float-diagonal opacity-85 hidden sm:block">
        <Image
          src="/auth-3d/glass/capsule-glass.png"
          alt="3D Frosted Glass Sculpture"
          fill
          sizes="(max-width: 1024px) 300px, (max-width: 1536px) 350px, 400px"
          className="object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
        />
      </div>
    </div>
  );
}
