"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  "Ölmärken",
  "Bilmodeller",
  "Huvudstäder",
  "Saker i kylskåpet",
  "Snusmärken",
  "Kända svenskar",
  "Harry Potter karaktärer",
  "Saker man inte säger till chefen",
  "Sexställningar",
  "Drinkar",
  "Fotbollslag",
  "Pokémon",
  "Saker som luktar illa",
];

export default function HotPotatoPage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "exploded">(
    "idle"
  );
  const [category, setCategory] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const startGame = () => {
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const randomTime = 10 + Math.floor(Math.random() * 15);

    setCategory(randomCat);
    setTimeLeft(randomTime);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("exploded");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div
      className={`flex flex-col items-center justify-between h-[calc(100dvh-140px)] w-full transition-colors duration-300 overflow-hidden ${
        gameState === "exploded" ? "bg-red-900/50 rounded-xl" : ""
      }`}
    >
      <div className="w-full flex justify-start shrink-0">
        <Link
          href="/arcade"
          className="text-gray-400 hover:text-white py-2 block text-lg"
        >
          ← Avbryt
        </Link>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md">
        {gameState === "idle" && (
          <div className="text-center space-y-6">
            <div className="text-9xl mb-4 animate-bounce">💣</div>
            <h2 className="text-4xl font-serif font-bold text-essex-gold">
              Heta Telefonen
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Säg ett ord i kategorin.
              <br />
              Skicka telefonen.
              <br />
              Håll den inte när det smäller.
            </p>
          </div>
        )}

        {gameState === "playing" && (
          <div className="text-center w-full">
            <div className="text-sm text-gray-400 uppercase tracking-widest mb-2 font-bold">
              Kategori
            </div>
            <div className="text-3xl font-bold text-white mb-12 bg-gray-800/80 p-6 rounded-2xl border border-white/10 shadow-lg break-words">
              {category}
            </div>

            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: timeLeft < 5 ? 0.3 : 1,
              }}
              className="text-9xl mb-8"
            >
              💣
            </motion.div>

            <p className="text-orange-400 font-mono text-xl animate-pulse font-bold mt-8">
              TICK TACK...
            </p>
          </div>
        )}

        {gameState === "exploded" && (
          <div className="text-center w-full animate-bounce">
            <h1 className="text-8xl mb-4">💥</h1>
            <h2 className="text-4xl font-bold text-white mb-8">BOOM!</h2>

            <div className="bg-black/40 p-6 rounded-2xl mb-8 border-2 border-red-500/50 backdrop-blur-sm">
              <p className="text-xl text-red-200 font-bold uppercase tracking-widest">
                Straffet
              </p>
              <p className="text-6xl font-bold text-white mt-2">3 KLUNKAR</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-md mb-4">
        {gameState === "idle" && (
          <button
            onClick={startGame}
            className="w-full py-6 bg-orange-600 text-white font-bold text-2xl rounded-2xl shadow-lg border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            Tänd Stubinen
          </button>
        )}

        {gameState === "playing" && (
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: timeLeft, ease: "linear" }}
            />
          </div>
        )}

        {gameState === "exploded" && (
          <button
            onClick={() => setGameState("idle")}
            className="w-full py-6 bg-white text-black font-bold text-2xl rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            Spela Igen
          </button>
        )}
      </div>
    </div>
  );
}
