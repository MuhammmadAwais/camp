import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "AutoNexa | Canada's 24h Wholesale Vehicle Exchange",
  description:
    "Canada's premier 24-hour sealed-bid automotive exchange. Connect verified vehicle sellers directly with licensed wholesale dealerships across Ontario, Alberta, BC, and Quebec.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth antialiased dark" suppressHydrationWarning>
      <head>
        <Script
          id="autonexa-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('autonexa_theme');
                  if (stored === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-white dark:bg-black font-body text-black dark:text-white flex flex-col selection:bg-[#008C87] selection:text-white"
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
