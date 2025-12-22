"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPER & KONSTANTER ---
type Suit = "SPADE" | "HEART" | "CLUB" | "DIAMOND";
type Card = {
  suit: Suit;
  value: number;
  label: string;
  id: string;
  flipped: boolean;
};

const SUITS: Suit[] = ["SPADE", "HEART", "CLUB", "DIAMOND"];
const VALUES = [
  { val: 11, label: "1" },
  { val: 2, label: "2" },
  { val: 3, label: "3" },
  { val: 4, label: "4" },
  { val: 5, label: "5" },
  { val: 6, label: "6" },
  { val: 7, label: "7" },
  { val: 8, label: "8" },
  { val: 9, label: "9" },
  { val: 10, label: "10" },
  { val: 10, label: "11-JACK" },
  { val: 10, label: "12-QUEEN" },
  { val: 10, label: "13-KING" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getCardImagePath = (card: Card) =>
  `/cards/${card.suit}-${card.label}.svg`;

// --- KOMPONENTER ---

const CardView = ({ card, index }: { card: Card; index: number }) => {
  const startRotation = card.flipped ? 180 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      style={{
        zIndex: index,
        marginLeft: index === 0 ? 0 : -45,
        perspective: 1000,
      }}
      className="w-20 h-28 sm:w-24 sm:h-36 relative shrink-0"
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateY: startRotation }}
        animate={{ rotateY: card.flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* FRAMSIDA */}
        <div
          className="absolute inset-0 w-full h-full rounded-lg shadow-xl overflow-hidden bg-white"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <img
            src={getCardImagePath(card)}
            alt={card.label}
            className="w-full h-full object-contain p-0.5"
          />
        </div>

        {/* BAKSIDA */}
        <div
          className="absolute inset-0 w-full h-full bg-[#1a1a1a] rounded-lg border-2 border-[#d4af37] shadow-xl flex items-center justify-center overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#d4af37 1px, transparent 0)",
              backgroundSize: "8px 8px",
            }}
          />
          <img
            src="/Essex_Logga.png"
            className="w-10 opacity-80 z-10"
            alt="Essex"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BlackjackPage() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<
    "idle" | "dealing" | "playing" | "dealer_turn" | "done"
  >("idle");
  const [message, setMessage] = useState("");

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter((c) => c.label === "1").length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const createDeck = () => {
    const newDeck: Card[] = [];
    SUITS.forEach((suit) => {
      VALUES.forEach((v) => {
        newDeck.push({
          suit,
          value: v.val,
          label: v.label,
          id: `${suit}-${v.label}-${Math.random()}`,
          flipped: false,
        });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const startGame = async () => {
    setGameState("dealing");
    setMessage("");
    setPlayerHand([]);
    setDealerHand([]);

    const newDeck = createDeck();
    const p1 = { ...newDeck.pop()!, flipped: false };
    const d1 = { ...newDeck.pop()!, flipped: false };
    const p2 = { ...newDeck.pop()!, flipped: false };
    const d2 = { ...newDeck.pop()!, flipped: true };

    await delay(300);
    setPlayerHand([p1 as Card]);
    await delay(300);
    setDealerHand([d1 as Card]);
    await delay(300);
    setPlayerHand([p1 as Card, p2 as Card]);
    await delay(300);
    setDealerHand([d1 as Card, d2 as Card]);

    setDeck(newDeck);
    setGameState("playing");
  };

  const hit = async () => {
    const newDeck = [...deck];
    const card = { ...newDeck.pop()!, flipped: false };
    const newHand = [...playerHand, card as Card];
    setDeck(newDeck);
    setPlayerHand(newHand);
    if (calculateScore(newHand) > 21) endGame("TJOCK! Drick 5.");
  };

  const stand = async () => {
    setGameState("dealer_turn");

    // Vänd upp det dolda kortet
    let currentDealer = dealerHand.map((c) => ({ ...c, flipped: false }));
    setDealerHand(currentDealer);

    await delay(800);

    const currentDeck = [...deck];
    while (calculateScore(currentDealer) < 17) {
      const nextCard = { ...currentDeck.pop()!, flipped: false };
      currentDealer = [...currentDealer, nextCard as Card];
      setDealerHand(currentDealer);
      setDeck(currentDeck);
      await delay(800);
    }

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(currentDealer);
    if (dScore > 21 || pScore > dScore) endGame("VINST! Ge 3.");
    else if (dScore === pScore) endGame("LIKA. Skåla!");
    else endGame("BANKEN VANN. Drick 3.");
  };

  const endGame = (msg: string) => {
    setMessage(msg);
    setGameState("done");
  };

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100dvh-130px)] w-full overflow-hidden bg-[#0000004d] touch-none">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center shrink-0 px-4">
        <Link href="/arcade" className="text-gray-400 py-2 text-lg">
          ← Avbryt
        </Link>
        <span className="text-[#d4af37] font-black tracking-[0.2em] text-sm -translate-x-2">
          BLACKJACK
        </span>
        <div className="w-10"></div>
      </div>

      {/* GAME AREA */}
      <div className="flex-grow w-full flex flex-col justify-evenly items-center max-w-md">
        {/* Dealer */}
        <div className="w-full flex flex-col items-center">
          <div className="text-[1rem] text-[#d4af37] uppercase tracking-widest mb-2 opacity-80">
            Banken
          </div>
          <div className="flex justify-center h-32 items-center w-full relative px-6">
            <AnimatePresence mode="popLayout">
              {dealerHand.map((c, i) => (
                <CardView key={c.id} card={c} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Status/Score Slot */}
        <div className="h-20 flex items-center justify-center w-full z-10 px-4">
          <AnimatePresence mode="wait">
            {gameState === "done" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/60 border border-[#d4af37] px-6 py-2 rounded-xl text-center"
              >
                <p className="text-[#d4af37] font-black text-lg uppercase leading-tight">
                  {message}
                </p>
              </motion.div>
            ) : gameState === "idle" ? (
              <div className="text-9xl opacity-10 grayscale">🃏</div>
            ) : (
              <div className="flex gap-10">
                <div className="text-center">
                  <p className="text-[1rem] text-white uppercase mb-1 tracking-tighter">
                    Banken
                  </p>
                  <p className="text-xl font-black text-[#d4af37]">
                    {gameState === "playing" ? "?" : calculateScore(dealerHand)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[1rem] text-white uppercase mb-1 tracking-tighter">
                    Du
                  </p>
                  <p className="text-xl font-black text-[#d4af37]">
                    {calculateScore(playerHand)}
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Player */}
        <div className="w-full flex flex-col items-center">
          <div className="text-[1rem] text-[#d4af37] uppercase tracking-widest mb-2 opacity-80">
            Din Hand
          </div>
          <div className="flex justify-center h-32 items-center w-full relative px-6">
            <AnimatePresence mode="popLayout">
              {playerHand.map((c, i) => (
                <CardView key={c.id} card={c} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="w-full max-w-md shrink-0 mb-2 px-4">
        {gameState === "idle" || gameState === "done" ? (
          <button
            onClick={startGame}
            className="w-full py-5 bg-[#d4af37] text-black font-black text-xl rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-tighter"
          >
            {gameState === "done" ? "Spela Igen" : "Dela ut kort"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={hit}
              disabled={gameState !== "playing"}
              className="py-5 bg-zinc-800 text-white font-black text-xl rounded-2xl border border-white/10 active:bg-zinc-700 disabled:opacity-50"
            >
              HIT
            </button>
            <button
              onClick={stand}
              disabled={gameState !== "playing"}
              className="py-5 bg-red-900/40 text-white font-black text-xl rounded-2xl border border-red-500/50 active:bg-red-900/60 disabled:opacity-50"
            >
              STAND
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
