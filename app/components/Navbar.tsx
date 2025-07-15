'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm text-white sticky top-0 z-50 border-b border-gray-700">
      <nav className="container mx-auto flex justify-between items-center p-3">
        <Link href="/" className="flex items-center gap-4 z-50" onClick={() => isMenuOpen && setIsMenuOpen(false)}>
          <Image src="/logo.png" alt="Essex Logo" width={60} height={60} className="w-12 md:w-16" />
        </Link>

        {/* Desktopmeny */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="font-semibold hover:text-yellow-300 transition-colors">Logga Shot</Link>
          <Link href="/standings" className="font-semibold hover:text-yellow-300 transition-colors">Ställning</Link>
          <Link href="/historik" className="font-semibold hover:text-yellow-300 transition-colors">Historik</Link>
          <div className="flex items-center gap-4 pl-4 border-l-2 border-gray-500">
            <Link href="/admin/medlemmar" className="text-sm hover:text-yellow-300">Admin: Medlemmar</Link>
            <Link href="/admin/vittnen" className="text-sm hover:text-yellow-300">Admin: Vittnen</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Hamburgarknapp för mobil */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden z-50 p-2 text-white" aria-label="Öppna menyn">
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobilmeny-overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-gray-900 flex flex-col items-center justify-center space-y-8 text-xl">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-yellow-300 transition-colors">Logga Shot</Link>
          <Link href="/standings" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-yellow-300 transition-colors">Ställning</Link>
          <Link href="/historik" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-yellow-300 transition-colors">Historik</Link>
          <div className="pt-8 border-t-2 border-gray-600 flex flex-col items-center space-y-6">
            <Link href="/admin/medlemmar" onClick={() => setIsMenuOpen(false)} className="text-base hover:text-yellow-300">Admin: Medlemmar</Link>
            <Link href="/admin/vittnen" onClick={() => setIsMenuOpen(false)} className="text-base hover:text-yellow-300">Admin: Vittnen</Link>
          </div>
        </div>
      )}
    </header>
  );
}