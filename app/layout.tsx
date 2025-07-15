import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import Header from "./components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-eb-garamond' });

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
      <body className={`${inter.variable} ${ebGaramond.variable} font-sans bg-felt-green-dark text-gray-100`}>
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}