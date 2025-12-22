"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const SEGMENTS = [
  { label: "1 Shot", color: "#ef4444" }, // Index 0 (0-60°)
  { label: "SAFE", color: "#22c55e" }, // Index 1 (60-120°)
  { label: "2 Shots", color: "#7f1d1d" }, // Index 2 (120-180°)
  { label: "Svep!", color: "#eab308" }, // Index 3 (180-240°)
  { label: "1 Shot", color: "#ef4444" }, // Index 4 (240-300°)
  { label: "1 Klunk", color: "#a855f7" },// Index 5 (300-360°)
];

export default function WheelPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);

    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const winner = SEGMENTS[winningIndex];
    const segmentAngle = 360 / SEGMENTS.length;
    const randomOffsetInSegment = Math.floor(Math.random() * (segmentAngle - 20)) + 10;
    const positionOfWinner = (winningIndex * segmentAngle) + randomOffsetInSegment;
    const targetRotation = 360 - positionOfWinner;
    const extraSpins = 360 * 8;
    const currentRotationBase = rotation - (rotation % 360);
    const finalRotation = currentRotationBase + extraSpins + targetRotation;

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(winner.label);
    }, 4000);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] items-center justify-between overflow-hidden px-4 touch-none">
      {/* HEADER */}
      <div className="w-full text-left shrink-0">
        <Link href="/arcade" className="text-gray-400 hover:text-white text-lg py-2 block">
          ← Avbryt
        </Link>
      </div>

      {/* WHEEL SECTION */}
      <div className="text-center w-full flex flex-col items-center">
        <h1 className="text-4xl font-serif font-bold text-essex-gold mb-2">
          Olyckshjulet
        </h1>
        <p className="text-gray-400 mb-8 italic">Vågar du utmana ödet?</p>

        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto">
          {/* Fysisk Pil (Pointer) */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
            <motion.div 
              animate={isSpinning ? { 
                rotate: [0, -15, 0], // Vicka till
                y: [0, -2, 0] 
              } : {}}
              transition={{ 
                repeat: isSpinning ? Infinity : 0, 
                duration: 0.1, // Snabbt klickande
                ease: "linear" 
              }}
              className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white drop-shadow-lg"
            />
          </div>

          {/* Hjulet */}
          <motion.div
            className="w-full h-full rounded-full border-4 border-zinc-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.2, 0, 0.2, 1] }}
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
            {/* Texter på hjulet */}
            {SEGMENTS.map((seg, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
                style={{ transform: `rotate(${(i * 60) + 30}deg)` }}
              >
                <span className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-white uppercase tracking-tighter vertical-text">
                  {seg.label}
                </span>
              </div>
            ))}
            
            {/* Dekorativ mittcirkel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#1a1a1a] border-4 border-zinc-800 rounded-full z-10 shadow-inner flex items-center justify-center">
                <div className="w-1 h-1 bg-[#9a7b2c] rounded-full" />
            </div>
          </motion.div>
        </div>

        {/* Resultat Display */}
        <div className="h-24 mt-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border-2 border-[#9a7b2c] px-8 py-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center"
              >
                <span className="text-[10px] font-black text-[#9a7b2c] block uppercase tracking-[0.2em] mb-1">
                  Resultat
                </span>
                <span className="text-3xl font-serif font-bold text-white uppercase">
                  {result}
                </span>
              </motion.div>
            ) : isSpinning ? (
              <motion.span 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-[#9a7b2c]/80 font-serif italic"
              >
                Hjulet avgör ditt öde...
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="w-full max-w-md py-6 bg-[#9a7b2c] text-white font-bold text-2xl rounded-2xl shadow-lg border-4 border-[#9a7b2c] active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        SNURRA
      </button>
    </div>
  );
}