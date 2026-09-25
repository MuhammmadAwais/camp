"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "#about" },
    { label: "Explore Auctions", href: "#explore" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Valuation", href: "#valuation" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#201B11]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-lg"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Canada Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/" className="relative block h-10 w-36 sm:w-44 transition-transform hover:scale-[1.02]">
              <Image
                src="/logo.png"
                alt="AutoNexa"
                fill
                priority
                className="object-contain object-left drop-shadow"
              />
            </Link>
         
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-body text-sm font-medium transition-colors pb-0.5 ${
                  idx === 0
                    ? "text-white border-b-2 border-secondary font-semibold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#valuation"
              className="text-xs font-semibold uppercase tracking-wider text-white hover:text-white hover:bg-white/10 px-4 py-2 rounded-sm border border-white/30 backdrop-blur-sm transition-all"
            >
              Dealer Sign In
            </a>
            <a
              href="#valuation"
              className="text-xs font-semibold uppercase tracking-wider text-white bg-primary hover:bg-primary-hover px-4.5 py-2 rounded-sm shadow-md transition-all active:scale-[0.98]"
            >
              Get Free Offer
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 mx-4 rounded-xl bg-[#201B11]/95 backdrop-blur-xl border border-white/15 p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-sm font-body text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
            <a
              href="#valuation"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 rounded-sm border border-white/30 text-white font-semibold text-xs uppercase"
            >
              Dealer Sign In
            </a>
            <a
              href="#valuation"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 rounded-sm bg-primary text-white font-semibold text-xs uppercase shadow-sm"
            >
              Get Free Offer
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
