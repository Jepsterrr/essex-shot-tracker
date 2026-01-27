import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import Header from "./components/Navbar";
import UsePwaInputFocusFix from "./components/UsePwaInputFocusFix";
import OfflineSyncManager from "./components/OfflineSyncManager";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-eb-garamond",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Essex Straffshot",
  description: "Håller koll på allas straffshots!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="bg-black">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <link rel="icon" href="/Essex_Logga.png" />
        <link rel="apple-touch-icon" href="/Essex_Logga.png" />
        <meta name="apple-mobile-web-app-title" content="Essex Straffshots" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black"
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${inter.variable} ${ebGaramond.variable} font-sans text-gray-100`}
      >
        <OfflineSyncManager />
        <Toaster 
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            success: {
              duration: 4000,
            },
            error: {
              duration: 4000,
            },
          }}
        />
        <Header />
        <UsePwaInputFocusFix />
        <main className="container mx-auto p-4 pt-24 md:p-8 md:pt-64">{children}</main>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
