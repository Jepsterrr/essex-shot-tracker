import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import Header from "./components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-eb-garamond",
});

export const metadata: Metadata = {
  title: "Essex Straffshot",
  description: "Håller koll på allas straffshots!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        <link rel="icon" href="/Essex_Logga.png" />

        <link rel="apple-touch-icon" href="/Essex_Logga.png" />
        <meta name="apple-mobile-web-app-title" content="Essex Straffshots" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${inter.variable} ${ebGaramond.variable} font-sans text-gray-100`}
      >
        <Header />
        <main className="container mx-auto p-4 md:p-8">{children}</main>
      </body>
    </html>
  );
}
