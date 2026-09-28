"use client";

import * as React from "react";

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export function AutoNexaPhysicsCanvas() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const animFrameRef = React.useRef<number | null>(null);
  const isVisibleRef = React.useRef<boolean>(false);
  const mouseRef = React.useRef<{
    x: number;
    y: number;
    active: boolean;
    radius: number;
  }>({
    x: -9999,
    y: -9999,
    active: false,
    radius: 90,
  });

  const initParticles = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = Math.min(240, Math.max(130, Math.round(width * 0.16)));

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Offscreen canvas for sampling "AUTONEXA" text
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    // Responsive font size
    const fontSize = Math.min(Math.round(width * 0.14), Math.round(height * 0.8));
    offCtx.fillStyle = "#ffffff";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.font = `900 ${fontSize}px "Epilogue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    offCtx.letterSpacing = "0.06em";
    offCtx.fillText("AUTONEXA", width / 2, height / 2 + 4);

    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Step spacing for dot grid density (responsive)
    const step = width < 640 ? 4 : width < 1024 ? 5 : 5;
    const dotRadius = width < 640 ? 1.2 : 1.5;
    const newParticles: Particle[] = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 120) {
          // Add small jitter for organic matrix feel
          newParticles.push({
            originX: x,
            originY: y,
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: 0,
            vy: 0,
            radius: dotRadius,
            alpha: alpha / 255,
          });
        }
      }
    }

    particlesRef.current = newParticles;
  }, []);

  React.useEffect(() => {
    initParticles();

    // Resize listener with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        initParticles();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    // Pause physics when offscreen for maximum battery & 60fps performance
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Main 60fps Physics & Render Loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (isVisibleRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        const mouse = mouseRef.current;
        const particles = particlesRef.current;
        const radius = mouse.radius;
        const radiusSq = radius * radius;

        // Draw cursor interaction circle (matching reference images 4 & 5)
        if (mouse.active) {
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(229, 147, 68, 0.8)";
          ctx.fill();
        }

        // Update & draw particles
        const spring = 0.07;
        const damping = 0.86;
        const repelForce = 16;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Repel from cursor when active
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / radius) * repelForce;
              const angle = Math.atan2(dy, dx);
              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;
            }
          }

          // Elastic spring return to home position
          const homeDx = p.originX - p.x;
          const homeDy = p.originY - p.y;
          p.vx += homeDx * spring;
          p.vy += homeDy * spring;

          // Friction damping
          p.vx *= damping;
          p.vy *= damping;

          p.x += p.vx;
          p.y += p.vy;

          // Velocity displacement glow
          const speedSq = p.vx * p.vx + p.vy * p.vy;
          const isDisturbed = speedSq > 0.4;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

          if (isDisturbed) {
            ctx.fillStyle = "rgba(229, 147, 68, 0.85)"; // Honey amber glow on move
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.32)"; // Subtle silver resting
          }
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [initParticles]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.active = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !e.touches[0]) return;
    mouseRef.current.x = e.touches[0].clientX - rect.left;
    mouseRef.current.y = e.touches[0].clientY - rect.top;
    mouseRef.current.active = true;
  };

  const handleTouchEnd = () => {
    mouseRef.current.active = false;
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden select-none cursor-crosshair flex items-center justify-center py-6 sm:py-8 border-t border-white/10"
      style={{ touchAction: "none" }}
      aria-label="Interactive AutoNexa Physics Particle Display"
    >
      <canvas ref={canvasRef} className="block mx-auto" />
    </div>
  );
}
