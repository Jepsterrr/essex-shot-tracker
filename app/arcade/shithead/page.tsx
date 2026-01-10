"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { supabase } from "@/lib/supabase-client";

// --- TYPER ---
type Suit = "SPADE" | "HEART" | "CLUB" | "DIAMOND";
type Card = {
  suit: Suit;
  rank: number;
  label: string;
  id: string;
};

type Player = {
  id: string;
  name: string;
  hand: Card[];
  face_up: Card[];
  face_down: Card[];
  ready: boolean;
  has_won?: boolean;
};

const SUITS: Suit[] = ["SPADE", "HEART", "CLUB", "DIAMOND"];
const VALUES = [
  { r: 2, l: "2" },
  { r: 3, l: "3" },
  { r: 4, l: "4" },
  { r: 5, l: "5" },
  { r: 6, l: "6" },
  { r: 7, l: "7" },
  { r: 8, l: "8" },
  { r: 9, l: "9" },
  { r: 10, l: "10" },
  { r: 11, l: "11-JACK" },
  { r: 12, l: "12-QUEEN" },
  { r: 13, l: "13-KING" },
  { r: 14, l: "1" },
];

const getCardImagePath = (card: Card) =>
  `/cards/${card.suit}-${card.label}.svg`;

const CardView = ({
  card,
  index = 0,
  small = false,
  hidden = false,
  onClick,
  selected = false,
  isOpponent = false,
  noMargin = false,
}: any) => {
  if (!card && !hidden) return null;

  const mLeft = noMargin
    ? 0
    : index === 0
    ? 0
    : small
    ? isOpponent
      ? -22
      : -28
    : -30;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: selected ? -15 : 0,
        zIndex: (Number(index) || 0) + 10,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      style={{ marginLeft: mLeft }}
      className={`${
        small ? "w-14 h-20" : "w-20 h-28 sm:w-24 sm:h-36"
      } relative shrink-0 cursor-pointer shadow-2xl transition-shadow`}
    >
      <div
        className={`w-full h-full rounded-lg overflow-hidden bg-white border-2 transition-colors ${
          selected
            ? "border-yellow-400 ring-4 ring-yellow-400/30"
            : "border-black/10"
        }`}
      >
        {hidden ? (
          <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center border-2 border-[#d4af37]">
            <img
              src="/Essex_Logga.png"
              className={`${small ? "w-8" : "w-12"} opacity-90`}
              alt=""
            />
          </div>
        ) : (
          <img
            src={getCardImagePath(card)}
            alt=""
            className="w-full h-full object-contain p-0.5"
          />
        )}
      </div>
    </motion.div>
  );
};

export default function VandtiaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [myId] = useState(() => Math.random().toString(36).substring(2, 11));
  const [inRoom, setInRoom] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const roomCodeRef = useRef<string | null>(null);

  const sortCards = (cards: Card[]) =>
    [...cards].sort((a, b) => a.rank - b.rank);

  const canPlayCard = (card: Card, pile: Card[]) => {
    if (card.rank === 2 || card.rank === 10) return true;
    const top = pile.length > 0 ? pile[pile.length - 1] : null;
    if (!top || top.rank === 2) return true;
    return card.rank >= top.rank;
  };

  const checkWinner = (player: Player) => {
    return (
      player.hand.length === 0 &&
      player.face_up.length === 0 &&
      player.face_down.length === 0
    );
  };

  const leaveRoom = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !inRoom) return;
    const { data: latest } = await supabase
      .from("vandtia_rooms")
      .select("*")
      .eq("room_code", code)
      .single();
    if (!latest) return;
    const remaining = latest.players.filter((p: Player) => p.id !== myId);
    if (remaining.length === 0) {
      await supabase.from("vandtia_rooms").delete().eq("room_code", code);
    } else {
      const updates: any = {
        players: remaining,
        updated_at: new Date().toISOString(),
      };
      if (latest.host_id === myId) updates.host_id = remaining[0].id;
      if (latest.current_turn_player_id === myId)
        updates.current_turn_player_id = remaining[0].id;
      await supabase
        .from("vandtia_rooms")
        .update(updates)
        .eq("room_code", code);
    }
  }, [myId, inRoom]);

  useEffect(() => {
    if (!inRoom || !roomInput) return;
    const code = roomInput.toUpperCase();
    roomCodeRef.current = code;
    const channel = supabase
      .channel(`vandtia-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vandtia_rooms",
          filter: `room_code=eq.${code}`,
        },
        (payload) =>
          payload.eventType === "DELETE"
            ? (setInRoom(false), router.push("/arcade"))
            : setRoom(payload.new)
      )
      .subscribe();
    window.addEventListener("beforeunload", leaveRoom);
    return () => {
      window.removeEventListener("beforeunload", leaveRoom);
      supabase.removeChannel(channel);
    };
  }, [inRoom, roomInput, leaveRoom, router]);

  const handleJoin = async () => {
    if (!name || !roomInput) return;
    const code = roomInput.toUpperCase();
    const { data: existing } = await supabase
      .from("vandtia_rooms")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();
    const me: Player = {
      id: myId,
      name: name.toUpperCase(),
      hand: [],
      face_up: [],
      face_down: [],
      ready: false,
    };

    let currentData;
    if (existing) {
      if (existing.players.length >= 5) return alert("Rummet är fullt!");
      const { data } = await supabase
        .from("vandtia_rooms")
        .update({ players: [...existing.players, me] })
        .eq("room_code", code)
        .select()
        .single();
      currentData = data;
    } else {
      const { data } = await supabase
        .from("vandtia_rooms")
        .insert({
          room_code: code,
          host_id: myId,
          players: [me],
          game_state: "idle",
        })
        .select()
        .single();
      currentData = data;
    }
    setRoom(currentData);
    setInRoom(true);
  };

  const startNewGame = async () => {
    if (!room || room.players.length < 2) return;
    const deck: Card[] = [];
    SUITS.forEach((s) =>
      VALUES.forEach((v, i) =>
        deck.push({
          suit: s,
          rank: v.r,
          label: v.l,
          id: `${s}-${v.l}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        })
      )
    );
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const players = room.players.map((p: Player) => {
      const face_down = deck.splice(0, 3);
      const hand = deck.splice(0, 6);

      return {
        ...p,
        face_down,
        hand,
        face_up: [],
        ready: false,
      };
    });
    await supabase
      .from("vandtia_rooms")
      .update({
        updated_at: new Date().toISOString(),
        game_state: "setup",
        deck,
        players,
        pile: [],
      })
      .eq("room_code", room.room_code);
  };

  const confirmSetup = async () => {
    if (selectedIds.length !== 3) return alert("Välj 3 kort!");
    const updatedPlayers = room.players.map((p: Player) => {
      if (p.id === myId) {
        const face_up = p.hand.filter((c) => selectedIds.includes(c.id));
        const hand = sortCards(
          p.hand.filter((c) => !selectedIds.includes(c.id))
        );
        return { ...p, face_up, hand, ready: true };
      }
      return p;
    });
    const allReady = updatedPlayers.every((p: Player) => p.ready);
    await supabase
      .from("vandtia_rooms")
      .update({
        players: updatedPlayers,
        updated_at: new Date().toISOString(),
        game_state: allReady ? "playing" : "setup",
        current_turn_player_id: allReady ? updatedPlayers[0].id : null,
      })
      .eq("room_code", room.room_code);
    setSelectedIds([]);
  };

  const playCards = async () => {
    if (room.current_turn_player_id !== myId || selectedIds.length === 0)
      return;
    const me = room.players.find((p: Player) => p.id === myId);
    if (!me) return;
    const cardsToPlay = [...me.hand, ...me.face_up].filter((c) =>
      selectedIds.includes(c.id)
    );
    if (cardsToPlay.length === 0) return;

    // Kontroll: Spela klart handen först
    const playingFromFaceUp = me.face_up.some((c: Card) =>
      selectedIds.includes(c.id)
    );
    if (playingFromFaceUp && me.hand.length > 0) {
      alert("Du måste spela klart korten på handen först!");
      return;
    }

    // Validera rang och om kortet får läggas på högen
    const cardRank = cardsToPlay[0].rank;
    if (
      !cardsToPlay.every((c) => c.rank === cardRank) ||
      !canPlayCard(cardsToPlay[0], room.pile)
    ) {
      return;
    }

    const newPile = [...(room.pile || []), ...cardsToPlay];
    const newDeck = [...(room.deck || [])];
    const remainingHand = me.hand.filter(
      (c: Card) => !selectedIds.includes(c.id)
    );
    const remainingFaceUp = me.face_up.filter(
      (c: Card) => !selectedIds.includes(c.id)
    );

    // Man försöker gå ut om man inte har hand, inte har kvarvarande face_up och inga face_down
    const isAttemptingToFinish =
      remainingHand.length === 0 &&
      remainingFaceUp.length === 0 &&
      me.face_down.length === 0;

    // Kan inte gå ut på 2 eller 10
    const invalidFinish =
      isAttemptingToFinish && (cardRank === 2 || cardRank === 10);

    let isWinner = false;
    let finalActionMsg = "";
    let updatedPile = newPile;

    const updatedPlayers = room.players.map((p: Player) => {
      if (p.id === myId) {
        if (invalidFinish) {
          // Vi tar bort de spelade korten från face_up men lägger till dem + högen i handen
          return {
            ...p,
            hand: sortCards([...newPile]),
            face_up: remainingFaceUp,
            face_down: p.face_down,
          };
        }

        // Normalt drag
        const nextHand = [...remainingHand];
        while (nextHand.length < 3 && newDeck.length > 0)
          nextHand.push(newDeck.pop()!);

        const updatedMe = {
          ...p,
          hand: sortCards(nextHand),
          face_up: remainingFaceUp,
        };
        if (checkWinner(updatedMe)) isWinner = true;
        return updatedMe;
      }
      return p;
    });

    if (invalidFinish) {
      updatedPile = []; // Högen plockas upp av spelaren
      finalActionMsg = `STUPSTOCK! ${me.name} försökte gå ut på en ${
        cardRank === 2 ? "tvåa" : "tia"
      } och får plocka upp!`;
    } else {
      // Kolla om högen bränns (Tia eller fyra lika)
      const burn =
        cardRank === 10 ||
        (newPile.length >= 4 &&
          newPile.slice(-4).every((c) => c.rank === cardRank));
      updatedPile = burn ? [] : newPile;
      finalActionMsg = burn ? "HÖGEN VÄNDES!" : "";
    }

    // Bestäm vems tur det är
    const nextId =
      (cardRank === 2 ||
        cardRank === 10 ||
        finalActionMsg === "HÖGEN VÄNDES!") &&
      !invalidFinish
        ? myId
        : room.players[
            (room.players.findIndex((p: any) => p.id === myId) + 1) %
              room.players.length
          ].id;

    await supabase
      .from("vandtia_rooms")
      .update({
        pile: updatedPile,
        players: updatedPlayers,
        deck: newDeck,
        current_turn_player_id: nextId,
        updated_at: new Date().toISOString(),
        game_state: isWinner ? "finished" : "playing",
        winner_name: isWinner ? me.name : null,
        last_action_msg: finalActionMsg,
      })
      .eq("room_code", room.room_code);

    setSelectedIds([]);
  };

  const playFaceDown = async (cardIndex: number) => {
    const me = room.players.find((p: Player) => p.id === myId);
    if (
      !me ||
      room.current_turn_player_id !== myId ||
      me.hand.length > 0 ||
      me.face_up.length > 0
    )
      return;

    const card = me.face_down[cardIndex];
    const success = canPlayCard(card, room.pile);
    const newFaceDown = me.face_down.filter(
      (_: Card, i: number) => i !== cardIndex
    );
    const isLastCard = newFaceDown.length === 0;

    if (success) {
      const nextPlayerId =
        room.players[
          (room.players.findIndex((p: any) => p.id === myId) + 1) %
            room.players.length
        ].id;

      // REGEL: Kan inte gå ut på 2 eller 10
      if (isLastCard && (card.rank === 2 || card.rank === 10)) {
        const updatedPlayers = room.players.map((p: Player) =>
          p.id === myId
            ? { ...p, hand: sortCards([...room.pile, card]), face_down: [] }
            : p
        );
        await supabase
          .from("vandtia_rooms")
          .update({
            pile: [],
            players: updatedPlayers,
            current_turn_player_id: nextPlayerId,
            updated_at: new Date().toISOString(),
            last_action_msg: `SISTA KORTET VAR ${card.label}! Måste plocka upp högen.`,
          })
          .eq("room_code", room.room_code);
        return;
      }

      const newPile = [...room.pile, card];
      const burn =
        card.rank === 10 ||
        (newPile.length >= 4 &&
          newPile.slice(-4).every((c) => c.rank === card.rank));
      let isWinner = false;
      const updatedPlayers = room.players.map((p: Player) => {
        if (p.id === myId) {
          const upP = { ...p, face_down: newFaceDown };
          if (checkWinner(upP)) isWinner = true;
          return upP;
        }
        return p;
      });
      const nextId =
        burn || card.rank === 2
          ? myId
          : room.players[
              (room.players.findIndex((p: any) => p.id === myId) + 1) %
                room.players.length
            ].id;
      await supabase
        .from("vandtia_rooms")
        .update({
          pile: burn ? [] : newPile,
          players: updatedPlayers,
          current_turn_player_id: nextId,
          updated_at: new Date().toISOString(),
          game_state: isWinner ? "finished" : "playing",
          winner_name: isWinner ? me.name : null,
          last_action_msg: `DOLT KORT LYCKADES: ${card.label}!`,
        })
        .eq("room_code", room.room_code);
    } else {
      const updatedPlayers = room.players.map((p: Player) =>
        p.id === myId
          ? {
              ...p,
              hand: sortCards([...room.pile, card]),
              face_down: newFaceDown,
            }
          : p
      );
      await supabase
        .from("vandtia_rooms")
        .update({
          pile: [],
          players: updatedPlayers,
          current_turn_player_id:
            room.players[
              (room.players.findIndex((p: any) => p.id === myId) + 1) %
                room.players.length
            ].id,
          updated_at: new Date().toISOString(),
          last_action_msg: `MISSLYCKAT DOLT KORT: ${card.label}`,
        })
        .eq("room_code", room.room_code);
    }
  };

  const handleChance = async () => {
    if (room.current_turn_player_id !== myId || (room?.deck?.length || 0) === 0)
      return;
    const newDeck = [...(room?.deck || [])];
    const card = newDeck.pop()!;
    const success = canPlayCard(card, room.pile);

    if (success) {
      const newPile = [...(room?.pile || []), card];
      const burn =
        card.rank === 10 ||
        (newPile.length >= 4 &&
          newPile
            .slice(-4)
            .every((c) => c.rank === newPile[newPile.length - 1].rank));
      const nextId =
        burn || card.rank === 2
          ? myId
          : room.players[
              (room.players.findIndex((p: any) => p.id === myId) + 1) %
                room.players.length
            ].id;
      await supabase
        .from("vandtia_rooms")
        .update({
          pile: burn ? [] : newPile,
          deck: newDeck,
          current_turn_player_id: nextId,
          updated_at: new Date().toISOString(),
          last_action_msg: `LYCKAD CHANS: ${card.label}!`,
        })
        .eq("room_code", room.room_code);
    } else {
      const updatedPlayers = room.players.map((p: Player) =>
        p.id === myId
          ? { ...p, hand: sortCards([...p.hand, ...room.pile, card]) }
          : p
      );
      await supabase
        .from("vandtia_rooms")
        .update({
          pile: [],
          deck: newDeck,
          players: updatedPlayers,
          current_turn_player_id:
            room.players[
              (room.players.findIndex((p: any) => p.id === myId) + 1) %
                room.players.length
            ].id,
          updated_at: new Date().toISOString(),
          last_action_msg: `CHANS MISSLYCKADES (${card.label})`,
        })
        .eq("room_code", room.room_code);
    }
  };

  const pickUp = async () => {
    if (room.current_turn_player_id !== myId || room.pile.length === 0) return;
    const updatedPlayers = room.players.map((p: Player) =>
      p.id === myId ? { ...p, hand: sortCards([...p.hand, ...room.pile]) } : p
    );
    await supabase
      .from("vandtia_rooms")
      .update({
        pile: [],
        players: updatedPlayers,
        current_turn_player_id:
          room.players[
            (room.players.findIndex((p: any) => p.id === myId) + 1) %
              room.players.length
          ].id,
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", room.room_code);
  };

  if (!inRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-130px)] bg-[#0000004d] px-6 text-white uppercase">
        <h1 className="text-5xl font-serif font-bold text-[#d4af37] mb-8 tracking-widest text-center">
          Vändtia
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
            placeholder="RUMSKOD"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            className="w-full py-4 bg-black/40 border-2 border-[#d4af37] rounded-xl text-center font-bold text-[#d4af37] outline-none"
          />
          <button
            onClick={handleJoin}
            className="w-full py-5 bg-[#d4af37] text-black font-black text-xl rounded-2xl shadow-lg active:scale-95"
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

  if (room?.game_state === "finished") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-10 text-center z-[100]">
        <h1 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce uppercase">
          Spel Slut!
        </h1>
        <p className="text-2xl mb-8 font-bold">
          {room.winner_name} VANN RUNDAN!
        </p>
        <button
          onClick={startNewGame}
          className="px-10 py-5 bg-[#d4af37] text-black font-black rounded-2xl shadow-xl active:scale-95 uppercase"
        >
          Ny Runda
        </button>
        <Link
          href="/arcade"
          className="block text-center text-white pt-4 underline"
        >
          Tillbaka
        </Link>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="flex flex-col items-center justify-between h-[calc(100dvh-120px)] w-full overflow-hidden bg-[#0000004d] touch-none text-white">
        {/* Header */}
        <div className="w-full flex justify-between items-center px-4 py-3 bg-black/40 border-b border-white/10 z-50">
          <div className="flex flex-col">
            <span className="text-[0.75rem] text-[#d4af37]/60 uppercase font-bold">
              Rum
            </span>
            <span className="text-xs text-[#d4af37] font-black leading-none">
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
            VÄNDTIA
          </span>
        </div>

        <div className="flex-grow w-full flex flex-col justify-between relative">
          {/* Motståndare */}
          <div className="flex justify-center gap-3 px-4 min-h-[80px] w-full mt-1">
            {others.map((p: any) => (
              <div
                key={p.id}
                className={`flex flex-col items-center transition-all ${
                  room.current_turn_player_id === p.id
                    ? "scale-105 opacity-100"
                    : "opacity-40"
                }`}
              >
                <div className="flex gap-2 mb-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="relative w-10 h-14 bg-black/20 rounded border border-white/10 flex items-center justify-center"
                    >
                      {/* 1. Underst: Det dolda kortet (Face down) */}
                      {p.face_down && p.face_down[i] && (
                        <div className="absolute inset-0 z-0">
                          <CardView
                            card={null}
                            small
                            hidden
                            noMargin
                            isOpponent
                          />
                        </div>
                      )}
                      {p.face_up && p.face_up[i] && (
                        <div className="absolute inset-0 z-10">
                          <CardView
                            card={p.face_up[i]}
                            small
                            noMargin
                            isOpponent
                          />
                        </div>
                      )}

                      {/* Om platsen är helt tom visas bara den mörka boxen ovan */}
                    </div>
                  ))}
                </div>

                <span className="text-[0.6rem] font-black text-[#d4af37] uppercase text-center leading-tight mt-6">
                  {p.name}
                  <br />({p.hand.length} PÅ HAND)
                </span>
              </div>
            ))}
          </div>

          {/* Center - spelyta */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-8 relative">
              {/* Kortlek */}
              <div className="relative w-12 h-18 bg-black/40 rounded-lg border-2 border-white/10 flex items-center justify-center shadow-inner">
                <img src="/Essex_Logga.png" className="w-6 opacity-20" alt="" />
                <span className="absolute -bottom-4 text-[7px] font-black text-white/30 uppercase italic">
                  Lek: {room?.deck?.length}
                </span>
              </div>

              {/* Högen */}
              <div className="relative w-18 h-24 flex items-center justify-center">
                <AnimatePresence>
                  {room?.pile?.slice(-4).map((c: Card, i: number) => (
                    <motion.div
                      key={`pile-${c.id}`}
                      layoutId={c.id}
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        rotate: (i - 2) * 5,
                        x: (i - 2) * 2,
                        y: 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      style={{ zIndex: i + 50, position: "absolute" }}
                    >
                      <CardView card={c} small noMargin />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {room?.pile?.length === 0 && (
                  <div className="absolute inset-0 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-[9px] uppercase text-white/10 italic text-center">
                    Spela
                    <br />
                    här
                  </div>
                )}
              </div>
            </div>
            {room?.last_action_msg && (
              <div className="text-yellow-400 font-black text-[0.65rem] uppercase italic animate-pulse">
                {room.last_action_msg}
              </div>
            )}
          </div>

          {/* Min Hand & Bordskort */}
          <div className="relative flex flex-col items-center w-full">
            {/* Bordskorten */}
            <div className="relative flex gap-4 scale-95 z-10 mt-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="relative w-14 h-20 bg-black/20 rounded-lg border border-white/5"
                >
                  <div className="absolute top-0.5 left-0.5 opacity-70">
                    {me?.face_down?.[i] && (
                      <CardView
                        card={me.face_down[i]}
                        small
                        hidden
                        noMargin
                        onClick={() => playFaceDown(i)}
                      />
                    )}
                  </div>
                  <div className="relative z-10">
                    <CardView
                      card={me?.face_up?.[i]}
                      small
                      index={1}
                      noMargin
                      selected={selectedIds.includes(me?.face_up?.[i]?.id)}
                      onClick={() => {
                        if (me?.hand.length > 0) return;
                        const cid = me?.face_up?.[i]?.id;
                        if (cid)
                          setSelectedIds((prev) =>
                            prev.includes(cid)
                              ? prev.filter((id) => id !== cid)
                              : [...prev, cid]
                          );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Handen */}
            <div className="relative flex justify-start w-full px-12 h-34 items-end pb-1 overflow-x-auto no-scrollbar z-20">
              <div className="flex -space-x-3 sm:-space-x-4 overflow-visible mx-auto min-w-max">
                {me?.hand.map((c: Card, idx: number) => (
                  <CardView
                    key={c.id}
                    card={c}
                    index={idx}
                    selected={selectedIds.includes(c.id)}
                    onClick={() =>
                      setSelectedIds((p) =>
                        p.includes(c.id)
                          ? p.filter((id) => id !== c.id)
                          : [...p, c.id]
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kontroller */}
        <div className="w-full max-w-md p-4 bg-black/40 border-t border-white/5 z-[70]">
          {!room || room.game_state === "idle" ? (
            room?.host_id === myId ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={startNewGame}
                  className={`w-full py-4 bg-[#d4af37] text-black font-black text-lg rounded-2xl transition-all uppercase ${
                    !room || room.players.length < 2
                      ? "opacity-20 pointer-events-none"
                      : "opacity-100 shadow-lg active:scale-95"
                  }`}
                >
                  {!room || room.players.length < 2
                    ? "Väntar på spelare..."
                    : "STARTA RUNDA"}
                </button>
                {(!room || room.players.length < 2) && (
                  <div className="text-[#d4af37] text-center font-bold tracking-widest uppercase text-[10px] italic">
                    Behövs minst 2 för att spela
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[#d4af37] text-center font-black animate-pulse uppercase text-xs py-4">
                Väntar på host...
              </div>
            )
          ) : room.game_state === "setup" ? (
            <button
              onClick={confirmSetup}
              disabled={selectedIds.length !== 3 || me?.ready}
              className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-2xl uppercase disabled:opacity-30 shadow-lg active:scale-95"
            >
              {me?.ready ? "VÄNTAR PÅ ANDRA..." : "VÄLJ 3 ATT HA UPPÅT"}
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={playCards}
                  disabled={!isMyTurn || selectedIds.length === 0}
                  className="py-3 bg-zinc-800 text-white font-black rounded-xl border border-white/10 disabled:opacity-20 uppercase text-[10px]"
                >
                  Lägg Kort
                </button>
                <button
                  onClick={pickUp}
                  disabled={!isMyTurn || room?.pile?.length === 0}
                  className="py-3 bg-red-900/40 text-white font-black rounded-xl border border-red-500/50 disabled:opacity-20 uppercase text-[10px]"
                >
                  Ta Upp
                </button>
              </div>
              {isMyTurn && room?.deck?.length > 0 && (
                <button
                  onClick={handleChance}
                  disabled={!isMyTurn || room?.deck?.length === 0}
                  className="w-full py-2 bg-yellow-600/20 text-yellow-400 font-black rounded-xl border border-yellow-500/50 uppercase text-[9px]"
                >
                  Chansa
                </button>
              )}
              {isMyTurn && (
                <div className="text-center text-[#d4af37] text-[10px] font-black uppercase tracking-widest py-1">
                  Din tur!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}
