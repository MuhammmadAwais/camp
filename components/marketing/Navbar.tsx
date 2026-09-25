"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Menu, X, ShieldCheck, ArrowRight } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "About", href: "#about" },
    { label: "Discover", href: "#discover" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "FAQs", href: "#faqs" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-surface/95 backdrop-blur-md border-b border-border-card shadow-[0_4px_20px_-4px_rgba(56,20,24,0.06)]"
          : "bg-surface/80 backdrop-blur-sm border-b border-border-card/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-40 sm:w-44 transition-transform group-hover:scale-[1.02]">
              <Image
                src="/logo.png"
                alt="AutoNexa Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-[11px] font-mono font-semibold text-secondary tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              Canada
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const el = document.getElementById("vin-appraisal");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs tracking-wide"
            >
              Dealer Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const el = document.getElementById("vin-appraisal");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group text-xs tracking-wide"
            >
              <span>Get Free Offer</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const el = document.getElementById("vin-appraisal");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs px-3"
            >
              Get Offer
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-on-surface" />
              ) : (
                <Menu className="w-6 h-6 text-on-surface" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border-card bg-surface-container-lowest px-4 pt-3 pb-6 space-y-3 shadow-ambient-warm animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-sm font-body text-base font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-border-card/60 flex flex-col gap-2.5">
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dealer Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById("vin-appraisal");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get Instant Cash Offer
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
