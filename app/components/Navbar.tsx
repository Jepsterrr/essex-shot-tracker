"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const bgVariants: Variants = {
    open: {
      scale: 80,
      transition: {
        type: "spring",
        stiffness: 20,
        restDelta: 2,
      },
    },
    closed: {
      scale: 1, 
      transition: {
        delay: 0.2, 
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const listVariants: Variants = {
    open: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
    closed: {
      opacity: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  };

  const itemVariants: Variants = {
    open: {
      y: 0,
      opacity: 1,
      transition: { y: { stiffness: 1000, velocity: -100 } },
    },
    closed: {
      y: 50,
      opacity: 0,
      transition: { y: { stiffness: 1000 } },
    },
  };

  return (
    <header className="site-header backdrop-blur-md bg-black/30 text-white fixed w-full top-0 z-50 border-b border-gray-700/50">
      <nav className="container mx-auto flex items-center justify-between p-3 relative z-50 min-h-[64px]">
        <Link
          href="/"
          className="relative z-50 flex-shrink-0"
          onClick={() => isMenuOpen && setIsMenuOpen(false)}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Image
              src="/Essex_Logga.png"
              alt="Essex Logo"
              width={60}
              height={60}
              className="w-12 md:w-16 drop-shadow-lg"
            />
          </motion.div>
        </Link>

        {/* DESKTOP MENY */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {[
            ["Logga Shot", "/"],
            ["Historik", "/historik"],
            ["Ställning", "/standings"],
            ["Topplistor", "/topplistor"],
            ["Spelhall", "/arcade"],
          ].map(([title, url]) => (
            <Link
              key={url}
              href={url}
              className="font-semibold text-gray-300 hover:text-[#9a7b2c] transition-colors relative group whitespace-nowrap"
            >
              {title}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9a7b2c] transition-all group-hover:w-full"></span>
            </Link>
          ))}

          <div className="flex items-center gap-4 pl-4 border-l-2 border-gray-600">
            <Link
              href="/admin"
              className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        {/* HAMBURGERKNAPP */}
        <div className="flex items-center gap-4 md:hidden z-50">
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 text-white focus:outline-none relative z-50 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
            animate={isMenuOpen ? "open" : "closed"}
          >
            <div className="relative w-7 h-6 flex flex-col justify-between items-center">
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 11 },
                }}
                className="w-7 h-0.5 bg-white block rounded-full origin-center"
              />
              <motion.span
                variants={{
                  closed: { opacity: 1, x: 0 },
                  open: { opacity: 0, x: 20 },
                }}
                className="w-7 h-0.5 bg-white block rounded-full"
              />
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -11 },
                }}
                className="w-7 h-0.5 bg-white block rounded-full origin-center"
              />
            </div>
          </motion.button>
        </div>
      </nav>

      <motion.div
        initial="closed"
        animate={isMenuOpen ? "open" : "closed"}
        variants={bgVariants}
        className="fixed top-5 right-5 w-10 h-10 bg-black rounded-full z-40 md:hidden pointer-events-none"
      />

      {/* Mobilmeny-overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={listVariants}
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center pointer-events-auto w-full h-[100dvh] pt-8 touch-none"
          >
            <ul className="flex flex-col items-center space-y-8 text-3xl font-serif w-full text-center">
              {[
                ["Logga Shot", "/"],
                ["Ställning", "/standings"],
                ["Historik", "/historik"],
                ["Topplistor", "/topplistor"],
                ["Spelhall", "/arcade"],
              ].map(([title, url]) => (
                <motion.li key={url} variants={itemVariants} className="w-full">
                  <Link
                    href={url}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-bold text-gray-200 hover:text-amber-400/60 transition-colors active:scale-95 block w-full py-2"
                  >
                    {title}
                  </Link>
                </motion.li>
              ))}

              <motion.li
                variants={itemVariants}
                className="pt-3 w-40 flex justify-center mt-2 mx-auto"
              >
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-sans text-gray-300 hover:text-white block py-2 border-b border-transparent hover:border-gray-300 transition-all"
                >
                  Admin Panel
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
