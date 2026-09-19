import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { InstallHint } from "@/components/InstallHint";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Reel Radar — where can I watch that film?",
  description:
    "Search any film and see instantly which streaming services have it in your country — subscription, free, rent or buy.",
  applicationName: "Reel Radar",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Reel Radar",
    description: "Search any film, see where it's streaming in your country.",
    type: "website",
  },
  // iOS reads these rather than the manifest for home-screen behaviour.
  appleWebApp: {
    capable: true,
    title: "Reel Radar",
    statusBarStyle: "black-translucent",
  },
  other: {
    // Next emits only the unprefixed `mobile-web-app-capable`. Safari wants the
    // Apple-prefixed one, and without it older iOS opens the home-screen icon
    // in a browser tab instead of running it standalone.
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    // Must be PNG: iOS ignores SVG here.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Lets the backdrop run under the notch; the safe-area insets keep content clear.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="grain vignette antialiased">
        {children}
        <InstallHint />
        <ServiceWorker />
      </body>
    </html>
  );
}
