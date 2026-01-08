"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";

// --- TYPER & KONSTANTER ---
type Suit = "SPADE" | "HEART" | "CLUB" | "DIAMOND";
type Card = {
  suit: Suit;
  value: number;
  label: string;
  id: string;
  flipped: boolean;
};

type Player = {
  id: string;
  name: string;
  hand: Card[];
  status: "playing" | "stand" | "bust" | "blackjack";
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

const CardView = ({
  card,
  index,
  small = false,
}: {
  card: Card;
  index: number;
  small?: boolean;
}) => {
  if (!card) return null;
  const startRotation = card.flipped ? 180 : 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{
        zIndex: index,
        marginLeft: index === 0 ? 0 : small ? -30 : -45,
        perspective: 1000,
      }}
      className={`${
        small ? "w-16 h-24" : "w-20 h-28 sm:w-24 sm:h-36"
      } relative shrink-0 pointer-events-none`}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateY: startRotation }}
        animate={{ rotateY: card.flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 w-full h-full rounded-lg shadow-xl overflow-hidden bg-white"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <img
            src={getCardImagePath(card)}
            alt=""
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <div
          className="absolute inset-0 w-full h-full bg-[#1a1a1a] rounded-lg border-2 border-[#d4af37] flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <img
            src="/Essex_Logga.png"
            className={`${small ? "w-6" : "w-10"} opacity-80`}
            alt="Essex"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BlackjackPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [myId] = useState(() => Math.random().toString(36).substring(2, 11));
  const [inRoom, setInRoom] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [numDecks, setNumDecks] = useState(6);

  const roomCodeRef = useRef<string | null>(null);
  const isDealerLoopRunning = useRef(false);

  const calculateScore = (hand: Card[] | undefined | null) => {
    if (!hand || !Array.isArray(hand)) return 0;
    const validCards = hand.filter((c) => c && typeof c.value === "number");
    let score = validCards.reduce((acc, card) => acc + card.value, 0);
    let aces = validCards.filter((c) => c.label === "1").length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const createDeck = (count: number) => {
    const deck: Card[] = [];
    for (let i = 0; i < count; i++) {
      SUITS.forEach((s) =>
        VALUES.forEach((v) =>
          deck.push({
            suit: s,
            value: v.val,
            label: v.label,
            id: `${s}-${v.label}-${i}-${Math.random()}`,
            flipped: false,
          })
        )
      );
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const leaveRoom = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !inRoom) return;

    const { data: latest } = await supabase
      .from("blackjack_rooms")
      .select("*")
      .eq("room_code", code)
      .single();
    if (!latest) return;

    const remaining = latest.players.filter((p: Player) => p.id !== myId);
    if (remaining.length === 0) {
      await supabase.from("blackjack_rooms").delete().eq("room_code", code);
    } else {
      const updates: any = {
        players: remaining,
        updated_at: new Date().toISOString(),
      };
      if (latest.host_id === myId) updates.host_id = remaining[0].id;
      if (latest.current_turn_player_id === myId) {
        const next = remaining.find((p: Player) => p.status === "playing");
        updates.current_turn_player_id = next ? next.id : null;
        if (!next && latest.game_state === "playing")
          updates.game_state = "dealer_turn";
      }
      await supabase
        .from("blackjack_rooms")
        .update(updates)
        .eq("room_code", code);
    }
  }, [myId, inRoom]);

  useEffect(() => {
    if (!inRoom || !roomInput) return;
    const code = roomInput.toUpperCase();
    roomCodeRef.current = code;

    const channel = supabase
      .channel(`blackjack-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blackjack_rooms",
          filter: `room_code=eq.${code}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setInRoom(false);
            router.push("/arcade");
            return;
          }
          setRoom(payload.new);
        }
      )
      .subscribe();

    window.addEventListener("beforeunload", leaveRoom);
    return () => {
      window.removeEventListener("beforeunload", leaveRoom);
      supabase.removeChannel(channel);
    };
  }, [inRoom, roomInput, leaveRoom, router]);

  useEffect(() => {
    if (
      room?.game_state === "dealer_turn" &&
      !isDealerLoopRunning.current &&
      room?.host_id === myId
    ) {
      handleDealerLogic();
    }
  }, [room?.game_state, room?.host_id, myId]);

  const handleJoin = async () => {
    if (!name || !roomInput) return;
    const code = roomInput.toUpperCase();
    const { data: existing } = await supabase
      .from("blackjack_rooms")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();
    const me: Player = {
      id: myId,
      name: name.toUpperCase(),
      hand: [],
      status: "playing",
    };

    let currentRoomData;
    if (existing) {
      const players = [...(existing.players || []), me];
      const { data } = await supabase
        .from("blackjack_rooms")
        .update({ players, updated_at: new Date().toISOString() })
        .eq("room_code", code)
        .select()
        .maybeSingle();
      currentRoomData = data;
    } else {
      const { data } = await supabase
        .from("blackjack_rooms")
        .insert({
          room_code: code,
          host_id: myId,
          players: [me],
          game_state: "idle",
          num_decks: numDecks,
          deck: [],
        })
        .select()
        .maybeSingle();
      currentRoomData = data;
    }
    setRoom(currentRoomData);
    setInRoom(true);
  };

  const startNewRound = async () => {
    const code = roomCodeRef.current;
    if (!code) return;
    const { data: currentRoom } = await supabase
      .from("blackjack_rooms")
      .select("*")
      .eq("room_code", code)
      .single();
    if (!currentRoom || currentRoom.host_id !== myId) return;

    isDealerLoopRunning.current = false;
    const freshPlayers = currentRoom.players.map((p: Player) => ({
      ...p,
      hand: [],
      status: "playing",
    }));

    await supabase
      .from("blackjack_rooms")
      .update({
        game_state: "shuffling",
        dealer_hand: [],
        players: freshPlayers,
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", code);

    await delay(1500);

    let dDeck = [...(currentRoom.deck || [])];
    if (dDeck.length < freshPlayers.length * 10 || dDeck.length === 0)
      dDeck = createDeck(currentRoom.num_decks || 6);

    let dHand: Card[] = [];
    let pList: Player[] = JSON.parse(JSON.stringify(freshPlayers));

    await supabase
      .from("blackjack_rooms")
      .update({
        game_state: "dealing",
        deck: dDeck,
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", code);

    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < pList.length; i++) {
        const c = dDeck.pop();
        if (c) pList[i].hand.push(c);
        await supabase
          .from("blackjack_rooms")
          .update({
            players: pList,
            deck: dDeck,
            updated_at: new Date().toISOString(),
          })
          .eq("room_code", code);
        await delay(700);
      }
      const c = dDeck.pop();
      if (c) {
        if (r === 1) c.flipped = true;
        dHand.push(c);
      }
      await supabase
        .from("blackjack_rooms")
        .update({
          dealer_hand: dHand,
          deck: dDeck,
          updated_at: new Date().toISOString(),
        })
        .eq("room_code", code);
      await delay(700);
    }

    const finalPlayers: Player[] = pList.map((p: Player) => ({
      ...p,
      status: calculateScore(p.hand) === 21 ? "blackjack" : "playing",
    }));
    const nextId =
      finalPlayers.find((p: Player) => p.status === "playing")?.id || null;

    await supabase
      .from("blackjack_rooms")
      .update({
        game_state: nextId ? "playing" : "dealer_turn",
        players: finalPlayers,
        current_turn_player_id: nextId,
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", code);
  };

  const handleHit = async () => {
    if (room.current_turn_player_id !== myId) return;
    let dDeck = [...(room?.deck || [])];
    if (dDeck.length === 0) dDeck = createDeck(room?.num_decks || 6);
    const card = dDeck.pop();
    if (!card) return;

    const players = room.players.map((p: Player) => {
      if (p.id === myId) {
        const hand = [...p.hand, card];
        const score = calculateScore(hand);
        const status: Player["status"] =
          score > 21 ? "bust" : score === 21 ? "stand" : "playing";
        return { ...p, hand, status };
      }
      return p;
    });

    if (players.find((p: Player) => p.id === myId)?.status !== "playing") {
      await moveToNextTurn(players, dDeck);
    } else {
      await supabase
        .from("blackjack_rooms")
        .update({ deck: dDeck, players, updated_at: new Date().toISOString() })
        .eq("room_code", room.room_code);
    }
  };

  const handleStand = async () => {
    if (room.current_turn_player_id !== myId) return;
    const players = room.players.map((p: Player) =>
      p.id === myId ? { ...p, status: "stand" } : p
    );
    await moveToNextTurn(players, room.deck || []);
  };

  const moveToNextTurn = async (players: Player[], deck: Card[]) => {
    const next = players.find((p: Player) => p.status === "playing");
    await supabase
      .from("blackjack_rooms")
      .update({
        players,
        deck,
        game_state: next ? "playing" : "dealer_turn",
        current_turn_player_id: next?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", room.room_code);
  };

  const handleDealerLogic = async () => {
    if (isDealerLoopRunning.current) return;
    isDealerLoopRunning.current = true;
    try {
      let dHand = (room?.dealer_hand || []).map((c: Card) => ({
        ...c,
        flipped: false,
      }));
      let dDeck = [...(room?.deck || [])];
      await supabase
        .from("blackjack_rooms")
        .update({ dealer_hand: dHand, updated_at: new Date().toISOString() })
        .eq("room_code", room.room_code);
      await delay(1200);
      let currentScore = calculateScore(dHand);
      while (currentScore < 17) {
        if (dDeck.length === 0) dDeck = createDeck(room?.num_decks || 6);
        const newCard = dDeck.pop();
        if (newCard) {
          dHand = [...dHand, newCard];
          currentScore = calculateScore(dHand);
          await supabase
            .from("blackjack_rooms")
            .update({
              dealer_hand: dHand,
              deck: dDeck,
              updated_at: new Date().toISOString(),
            })
            .eq("room_code", room.room_code);
          await delay(1200);
        } else break;
      }
      await supabase
        .from("blackjack_rooms")
        .update({ game_state: "done", updated_at: new Date().toISOString() })
        .eq("room_code", room.room_code);
    } finally {
      isDealerLoopRunning.current = false;
    }
  };

  const getResult = (p: Player) => {
    const score = calculateScore(p.hand);
    const dScore = calculateScore(room?.dealer_hand);
    if (p.status === "blackjack")
      return { m: "BLACKJACK! Ge 5.", c: "text-[#d4af37]" };
    if (p.status === "bust") return { m: "TJOCK! Drick 5.", c: "text-red-500" };
    if (dScore > 21 || score > dScore)
      return { m: "VINST! Ge 3.", c: "text-green-500" };
    if (score === dScore) return { m: "LIKA. Skåla!", c: "text-white" };
    return { m: "BANKEN VANN. Drick 3.", c: "text-red-400" };
  };

  if (!inRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-130px)] bg-[#0000004d] px-6 touch-none text-white">
        <h1 className="text-5xl font-serif font-bold text-[#d4af37] mb-8 tracking-widest text-center uppercase">
          Blackjack
        </h1>
        <div className="w-full max-w-xs space-y-4">
          <input
            type="text"
            placeholder="DITT NAMN"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="w-full py-4 bg-black/40 border-2 border-[#d4af37] rounded-xl text-center font-bold text-[#d4af37] outline-none"
          />
          <input
            type="text"
            placeholder="RUMSKOD (Skriv in något random)"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            className="w-full py-4 bg-black/40 border-2 border-[#d4af37] rounded-xl text-center font-bold text-[#d4af37] outline-none"
          />
          <div className="py-2 w-full touch-auto">
            <label className="text-[10px] text-[#d4af37] block text-center mb-2 uppercase font-bold tracking-widest opacity-60">
              Kortlekar: {numDecks}
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={numDecks}
              onChange={(e) => setNumDecks(parseInt(e.target.value))}
              className="w-full accent-[#d4af37] touch-pan-x"
            />
          </div>
          <button
            onClick={handleJoin}
            className="w-full py-5 bg-[#d4af37] text-black font-black text-xl rounded-2xl shadow-lg active:scale-95 transition-all uppercase"
          >
            GÅ MED / SKAPA
          </button>
          <Link
            href="/arcade"
            className="block text-center text-gray-400 pt-4 underline"
          >
            Tillbaka
          </Link>
        </div>
      </div>
    );
  }

  const me = room?.players?.find((p: Player) => p.id === myId);
  const others = room?.players?.filter((p: Player) => p.id !== myId) || [];
  const isMyTurn = room?.current_turn_player_id === myId;

  const res =
    room?.game_state === "done" && me && me.hand && me.hand.length > 0
      ? getResult(me)
      : null;

  const visibleDealerScore = calculateScore(
    room?.dealer_hand?.filter((c: Card) => !c.flipped)
  );

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100dvh-130px)] w-full overflow-hidden bg-[#0000004d] touch-none text-white">
      <div className="w-full flex justify-between items-center px-4 py-3 bg-black/40 border-b border-white/10 z-10">
        <div className="flex flex-col">
          <span className="text-[0.75rem] text-[#d4af37]/60 uppercase font-bold tracking-tighter">
            Rum
          </span>
          <span className="text-xs text-[#d4af37] font-black">
            {room?.room_code}
          </span>
        </div>
        <button
          onClick={async () => {
            await leaveRoom();
            router.push("/arcade");
          }}
          className="text-gray-300 py-1 text-xs uppercase font-bold tracking-widest"
        >
          ← Lämna
        </button>
        <span className="text-sm font-black text-[#d4af37] tracking-[0.2em]">
          BLACKJACK
        </span>
      </div>

      <div className="flex-grow w-full flex flex-col justify-evenly py-2 relative">
        <div className="flex flex-col items-center pointer-events-none">
          <div className="text-[1rem] text-[#d4af37] uppercase tracking-widest mb-2 opacity-80">
            Banken: {visibleDealerScore > 0 ? visibleDealerScore : "?"}
          </div>
          <div className="flex justify-center h-28 relative px-10 w-full">
            <AnimatePresence>
              {room?.dealer_hand?.map((c: Card, i: number) => (
                <CardView key={c.id} card={c} index={i} small />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {room?.game_state === "shuffling" ? (
              <div className="text-[#d4af37] text-[1rem] font-black uppercase animate-pulse">
                Blandar...
              </div>
            ) : room?.game_state === "dealing" ? (
              <div className="text-[#d4af37] text-[1rem] font-black uppercase animate-pulse">
                Delar ut...
              </div>
            ) : room?.game_state === "dealer_turn" ? (
              <div className="text-[#d4af37] text-[1rem] font-black uppercase animate-bounce">
                Bankens tur...
              </div>
            ) : isMyTurn ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1.1 }}
                className="bg-[#d4af37] text-black px-4 py-1 rounded-full font-black text-[1rem] uppercase shadow-lg"
              >
                Din tur!
              </motion.div>
            ) : room?.current_turn_player_id ? (
              <div className="text-white/40 text-[1rem] uppercase tracking-widest italic">
                Väntar på{" "}
                {
                  room.players.find(
                    (p: Player) => p.id === room.current_turn_player_id
                  )?.name
                }
                ...
              </div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 px-4 overflow-x-auto no-scrollbar min-h-[50px] touch-pan-x w-full">
          {others.map((p: Player) => (
            <div
              key={p.id}
              className={`flex flex-col items-center shrink-0 transition-opacity ${
                room.current_turn_player_id === p.id
                  ? "opacity-100"
                  : "opacity-60"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[0.75rem] font-bold ${
                  p.status === "bust"
                    ? "border-red-500 text-red-500"
                    : p.status === "blackjack"
                    ? "border-[#d4af37] text-[#d4af37]"
                    : "border-white/40 text-white"
                }`}
              >
                {calculateScore(p.hand)}
              </div>
              <span className="text-[0.75rem] text-white mt-1 uppercase w-12 truncate text-center font-bold tracking-tighter">
                {p.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center relative z-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-sm uppercase font-black tracking-widest ${
                isMyTurn ? "text-[#d4af37] animate-pulse" : "text-white/60"
              }`}
            >
              {me?.name} (DIG)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-black ${
                calculateScore(me?.hand) > 21
                  ? "bg-red-600"
                  : "bg-[#d4af37] text-black"
              }`}
            >
              {calculateScore(me?.hand)}
            </span>
          </div>
          <div className="flex justify-center h-36 relative px-10 w-full pointer-events-none">
            <AnimatePresence mode="popLayout">
              {me?.hand?.map((c: Card, i: number) => (
                <CardView key={c.id} card={c} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {res && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.5 }}
            animate={{ y: -150, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-75 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-black/95 border-2 border-[#d4af37] p-5 rounded-2xl shadow-2xl text-center min-w-[220px] backdrop-blur-md">
              <p
                className={`font-black text-xl uppercase tracking-tighter ${res.c}`}
              >
                {res.m}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md shrink-0 p-6 bg-black/40 border-t border-white/5 z-20">
        {room?.game_state === "idle" || room?.game_state === "done" ? (
          room?.host_id === myId ? (
            <button
              onClick={startNewRound}
              className="w-full py-5 bg-[#d4af37] text-black font-black text-xl rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-tighter"
            >
              STARTA RUNDA
            </button>
          ) : (
            <div className="text-[#d4af37] text-center animate-pulse font-bold tracking-widest uppercase text-xs italic">
              Väntar på host...
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleHit}
              disabled={!isMyTurn || (me?.status ?? "") !== "playing"}
              className="py-5 bg-zinc-800 text-white font-black rounded-2xl border border-white/10 active:bg-zinc-700 disabled:opacity-30 shadow-inner"
            >
              HIT
            </button>
            <button
              onClick={handleStand}
              disabled={!isMyTurn || (me?.status ?? "") !== "playing"}
              className="py-5 bg-red-900/40 text-white font-black rounded-2xl border border-red-500/50 active:bg-red-900/60 disabled:opacity-30 shadow-inner"
            >
              STAND
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
