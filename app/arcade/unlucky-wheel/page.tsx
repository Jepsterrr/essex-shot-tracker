"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const SEGMENTS = [
  { label: "1 Shot", color: "#ef4444" },
  { label: "SAFE", color: "#22c55e" },
  { label: "2 Shots", color: "#7f1d1d" },
  { label: "Sällskap", color: "#eab308" },
  { label: "1 Shot", color: "#ef4444" },
  { label: "Bjud Laget", color: "#a855f7" },
];

export default function WheelPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    const randomSpins = 360 * (5 + Math.floor(Math.random() * 5));
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + randomSpins + randomAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const res = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
      setResult(res.label);
    }, 4000);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] items-center justify-between overflow-hidden">
      <div className="w-full text-left shrink-0">
        <Link href="/arcade" className="text-gray-400 hover:text-white text-lg py-2 block">
          ← Avbryt
        </Link>
      </div>

      <div className="text-center w-full">
        <h1 className="text-4xl font-serif font-bold text-essex-gold mb-2">
          Olyckshjulet
        </h1>
        <p className="text-gray-400 mb-8">Vågar du utmana ödet?</p>

        <div className="relative w-72 h-72 mx-auto mb-8">
          {/* Pil */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white drop-shadow-lg"></div>
          </div>

          {/* Hjul */}
          <motion.div
            className="w-full h-full rounded-full border-4 border-gray-700 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] relative"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: "circOut" }}
            style={{
              background: `conic-gradient(
                ${SEGMENTS[0].color} 0deg 60deg,
                ${SEGMENTS[1].color} 60deg 120deg,
                ${SEGMENTS[2].color} 120deg 180deg,
                ${SEGMENTS[3].color} 180deg 240deg,
                ${SEGMENTS[4].color} 240deg 300deg,
                ${SEGMENTS[5].color} 300deg 360deg
              )`,
            }}
          >
            <div className="absolute inset-0 rounded-full border-[20px] border-black/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg z-10"></div>
          </motion.div>
        </div>

        <div className="h-16 flex items-center justify-center">
          {result ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gray-800 border border-essex-gold px-8 py-3 rounded-xl shadow-lg"
            >
              <span className="text-xl font-bold text-white block">
                RESULTAT
              </span>
              <span className="text-2xl font-serif text-essex-gold">
                {result}
              </span>
            </motion.div>
          ) : (
            isSpinning && (
              <span className="text-lg animate-pulse text-gray-400">
                Ödet avgörs...
              </span>
            )
          )}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="w-full max-w-md py-6 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-2xl rounded-2xl shadow-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        SNURRA
      </button>
    </div>
  );
}
