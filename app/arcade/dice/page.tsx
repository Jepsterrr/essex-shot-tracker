"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import Link from "next/link";

const DICE_TYPES = [
  { label: "D4", value: 4 },
  { label: "D6", value: 6 },
  { label: "D8", value: 8 },
  { label: "D10", value: 10 },
  { label: "D12", value: 12 },
  { label: "D20", value: 20 },
  { label: "D100", value: 100 },
];

export default function DicePage() {
  const [selectedDie, setSelectedDie] = useState(6);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const controls = useAnimation();

  const rollDice = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    await controls.start({
      rotateX: [0, 720, 1080],
      rotateY: [0, 720, 1080],
      rotateZ: [0, 360, 720],
      scale: [1, 0.8, 1.2, 1],
      transition: { duration: 0.8, ease: "easeInOut" },
    });

    const outcome = Math.floor(Math.random() * selectedDie) + 1;
    setResult(outcome);
    setIsRolling(false);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] p-4 max-w-md mx-auto justify-between overflow-hidden touch-pan-x">
      <div className="flex justify-between items-center shrink-0">
        <Link
          href="/arcade"
          className="text-gray-400 hover:text-white py-2 text-lg"
        >
          ← Avbryt
        </Link>
        <h1 className="text-xl font-serif font-bold text-blue-400">Tärning</h1>
        <div className="w-16"></div>
      </div>

      <div className="flex-grow flex items-center justify-center relative perspective-1000">
        <motion.div
          animate={controls}
          onClick={rollDice}
          whileTap={{ scale: 0.9 }}
          className={`
            w-40 h-40 sm:w-48 sm:h-48 rounded-3xl cursor-pointer shadow-2xl flex items-center justify-center relative
            bg-gradient-to-br from-blue-800 to-blue-600 border-4 border-blue-400
            ${isRolling ? "blur-sm" : ""}
          `}
          style={{ transformStyle: "preserve-3d" }}
        >
          {!isRolling && result !== null ? (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl sm:text-8xl font-bold text-white drop-shadow-md font-mono"
            >
              {result}
            </motion.span>
          ) : (
            <span className="text-3xl sm:text-4xl text-blue-300/50 font-bold">
              D{selectedDie}
            </span>
          )}

          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-3xl pointer-events-none"></div>
        </motion.div>

        <div className="absolute bottom-6 text-center w-full">
          <p className="text-gray-500 text-sm uppercase tracking-widest animate-pulse">
            {isRolling ? "Snurrar..." : "Tryck för att slå"}
          </p>
        </div>
      </div>

      <div className="shrink-0 mb-2">
        <label className="text-xs text-gray-300 uppercase font-bold tracking-widest mb-4 block text-center">
          Välj Tärning
        </label>

        <div className="flex gap-2 overflow-x-auto pb-4 px-2 snap-x justify-start md:justify-center no-scrollbar mt-6">
          {DICE_TYPES.map((d) => (
            <button
              key={d.label}
              onClick={() => {
                setSelectedDie(d.value);
                setResult(null);
              }}
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl font-bold text-base transition-all snap-center border-2
                ${
                  selectedDie === d.value
                    ? "bg-blue-600 border-blue-400 text-white scale-104 shadow-lg shadow-blue-900/50"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                }
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
