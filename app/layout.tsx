import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="scroll-smooth antialiased">
      <body className="min-h-screen bg-surface font-body text-on-surface flex flex-col selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
