"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const GAMES = [
  {
    id: "tarning",
    title: "Tärning",
    description: "Slå en D6, D20 eller D100.",
    icon: "🎲",
    color: "from-blue-900 to-blue-600",
    href: "/arcade/dice",
  },
  {
    id: "olyckshjulet",
    title: "Olyckshjulet",
    description: "Låt ödet avgöra straffet.",
    icon: "🎰",
    color: "from-red-900 to-red-600",
    href: "/arcade/unlucky-wheel",
  },
  {
    id: "heta-telefonen",
    title: "Heta Telefonen",
    description: "Stressa inte... eller jo.",
    icon: "💣",
    color: "from-orange-700 to-orange-500",
    href: "/arcade/hot-phone",
  },
  {
    id: "blackjack",
    title: "Klunk-Blackjack",
    description: "Du mot Banken. Vågar du?",
    icon: "🃏",
    color: "from-green-900 to-green-600",
    href: "/arcade/blackjack",
  },
];

export default function GamesPage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <h1 className="text-5xl font-serif font-bold text-center mb-4 text-essex-gold drop-shadow-lg mt-8">
        Spelhallen
      </h1>
      <p className="text-center text-gray-400 mb-12 italic font-serif text-lg">
        Där hedern står på spel.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {GAMES.map((game, i) => (
          <Link key={game.id} href={game.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative h-48 rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden cursor-pointer group
                bg-gradient-to-br ${game.color}
              `}
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 text-8xl opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                {game.icon}
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl font-serif font-bold text-white mb-2 text-shadow-sm">
                  {game.title}
                </h2>
                <p className="text-white/80 font-medium leading-relaxed">
                  {game.description}
                </p>
              </div>

              <div className="relative z-10 flex items-center text-sm font-bold uppercase tracking-widest text-white/90 group-hover:text-white mt-4">
                Spela Nu <span className="ml-2">→</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
