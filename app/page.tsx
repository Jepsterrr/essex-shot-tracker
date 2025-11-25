"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member } from "@/types/types";
import type { Witness } from "@/types/types";
import LoadingSkeleton from "./loading";

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allWitnessOptions, setAllWitnessOptions] = useState<Witness[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [changeType, setChangeType] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState<number | "">(1);
  const [reason, setReason] = useState<string>("");
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error" | "";
  }>({ message: "", type: "" });
  const [otherWitnessValue, setOtherWitnessValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Hämta medlemmar som kan få shots
        const { data: membersToReceiveShots } = await supabase
          .from("members")
          .select("*")
          .eq("is_active", true)
          .not("group_type", "eq", "Joker")
          .order("name");
        if (membersToReceiveShots) setMembers(membersToReceiveShots);

        // Hämta medlemmar som kan vittna
        const { data: membersWhoCanWitness } = await supabase
          .from("members")
          .select("id, name, group_type")
          .eq("is_active", true)
          .in("group_type", ["ESS", "Joker"]);

        // Hämta manuellt tillagda vittnen från 'witnesses'-tabellen
        const { data: witnessData } = await supabase
          .from("witnesses")
          .select("*")
          .order("name");

        const memberWitnesses: Witness[] = (membersWhoCanWitness || []).map(
          (m) => ({ id: m.id, name: m.name })
        );

        // Slå ihop de manuella vittnena med de kvalificerade medlemmarna
        const combined = [...(witnessData || []), ...memberWitnesses];

        // Ta bort eventuella dubbletter
        const uniqueWitnesses = Array.from(
          new Map(combined.map((item) => [item.name, item])).values()
        );

        setAllWitnessOptions(
          uniqueWitnesses.sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // När all data är hämtad, stäng av laddning
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const resetForm = () => {
    setSelectedMemberId("");
    setChangeType("add");
    setAmount(1);
    setReason("");
    setSelectedWitnesses([]);
    setOtherWitnessValue("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });
    const numAmount = Number(amount);

    if (!selectedMemberId || numAmount <= 0) {
      setStatus({
        message: "Välj en medlem och ange ett antal större än noll.",
        type: "error",
      });
      return;
    }

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    if (!selectedMember) {
      setStatus({ message: "Kunde inte hitta medlemsdata.", type: "error" });
      return;
    }

    const giverIds = selectedWitnesses
      .map((witnessName) => {
        const member = members.find(
          (m) =>
            m.name === witnessName &&
            (m.group_type === "ESS" || m.group_type === "Joker")
        );
        return member ? member.id : null;
      })
      .filter((id): id is string => id !== null);

    if (
      changeType === "add" &&
      giverIds.length === 0 &&
      !otherWitnessValue.trim()
    ) {
      setStatus({
        message:
          'Minst ett vittne som är ESS/Joker eller ett "Annat vittne" måste anges för att dela ut straff.',
        type: "error",
      });
      return;
    }

    const changeAmount = changeType === "add" ? numAmount : -numAmount;

    const finalWitnesses = [...selectedWitnesses];
    if (otherWitnessValue.trim()) {
      finalWitnesses.push(`Övrig: ${otherWitnessValue.trim()}`);
    }

    const res = await fetch("/api/log-shot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: selectedMemberId,
        change: changeAmount,
        reason,
        witnesses: finalWitnesses,
        group_type: selectedMember.group_type,
        giver_ids: changeType === "add" ? giverIds : [],
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      setStatus({
        message: `Något gick fel: ${errorData.error || res.statusText}`,
        type: "error",
      });
    } else {
      setStatus({ message: "Shots loggade!", type: "success" });
      resetForm();
      setTimeout(() => setStatus({ message: "", type: "" }), 4000);
    }
  };

  const handleWitnessChange = (memberName: string) => {
    setSelectedWitnesses((prev) =>
      prev.includes(memberName)
        ? prev.filter((w) => w !== memberName)
        : [...prev, memberName]
    );
  };

  const incrementAmount = () => {
    setAmount((prev) => (typeof prev === "number" ? prev + 1 : 1));
  };
  
  const decrementAmount = () => {
    setAmount((prev) => {
      if (typeof prev !== "number") return 1;
      return prev > 1 ? prev - 1 : 1;
    });
  };

  const selectedMemberName =
    members.find((m) => m.id === selectedMemberId)?.name || "Välj en medlem...";

  const isAddMode = changeType === "add";

  if (isLoadingData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">
        Shot-Protokoll
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-card-white text-gray-200 p-8 rounded-xl shadow-2xl border border-gray-200/10"
      >
        {/* --- VÄLJ MEDLEM --- */}
        <div>
          <label className="block text-lg font-semibold mb-3 text-gray-200">
            Vem gäller det?
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                w-full p-4 text-xl font-bold text-left grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border-2 transition-all duration-200
                ${isDropdownOpen ? "border-amber-300/80 shadow-lg bg-gray-700" : "bg-gray-600/50 border-gray-500 hover:bg-gray-600"}
              `}
            >
              <span className="truncate">{selectedMemberName}</span>
              <svg
                className={`w-6 h-6 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-amber-300/80" : "text-gray-400"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute z-50 w-full mt-2 max-h-80 overflow-auto bg-gray-800 rounded-xl border-2 border-amber-300/80 shadow-2xl">
                {members.map((member) => (
                  <li
                    key={member.id}
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setIsDropdownOpen(false);
                    }}
                    className="p-4 text-white text-lg font-medium cursor-pointer hover:bg-gray-600 border-b border-gray-700 last:border-0"
                  >
                    {member.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* --- LÄGE & ANTAL --- */}
        <div className="space-y-4">
          
          {/* Toggle Switch */}
          <div className="grid grid-cols-2 bg-gray-900 p-1 rounded-xl border border-gray-600">
            <button
              type="button"
              onClick={() => setChangeType("add")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                isAddMode
                  ? "bg-red-700/50 text-white shadow-lg scale-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              LÄGG TILL
            </button>
            <button
              type="button"
              onClick={() => setChangeType("remove")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                !isAddMode
                  ? "bg-green-600/70 text-white shadow-lg scale-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              TA BORT
            </button>
          </div>

          {/* Stepper med Input */}
          <div className="flex items-center justify-between bg-gray-600/30 p-2 rounded-xl border border-gray-600">
            <button
              type="button"
              onClick={decrementAmount}
              className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800"
            >
              −
            </button>
            
            <div className="flex flex-col items-center flex-grow px-4">
              <span className="text-sm text-gray-200 uppercase tracking-widest font-bold mb-1">Antal</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className={`
                  w-full bg-transparent text-center text-5xl font-bold border-none focus:ring-0 p-0 no-spinner
                  ${isAddMode ? 'text-essex-red placeholder-red-800' : 'text-green-500 placeholder-green-800'}
                `}
                placeholder="0"
                min="1"
              />
            </div>

            <button
              type="button"
              onClick={incrementAmount}
              className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800"
            >
              +
            </button>
          </div>
        </div>

        {/* --- VITTNEN --- */}
        <div>
          <label className="block text-lg font-semibold mb-3 text-gray-200">
            Vilka såg det?
          </label>
          <div className="flex flex-wrap gap-3">
            {allWitnessOptions.map((w) => {
              const isSelected = selectedWitnesses.includes(w.name);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleWitnessChange(w.name)}
                  className={`
                    flex-grow md:flex-grow-0 py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 border
                    ${isSelected 
                      ? "bg-red-700/50 text-white border-amber-400 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                      : "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600"}
                  `}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- ÖVRIGT VITTNE --- */}
        <div>
          <input
            type="text"
            id="otherWitness"
            placeholder="+ Annat vittne (namn)"
            value={otherWitnessValue}
            onChange={(e) => setOtherWitnessValue(e.target.value)}
            className="form-input w-full bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-lg text-white placeholder-gray-500 focus:border-essex-gold focus:ring-1 focus:ring-essex-gold transition-all"
          />
        </div>

        {/* --- ANLEDNING --- */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-300">
            Anledning
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Varför?"
            className="form-input w-full bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-lg text-white placeholder-gray-500 focus:border-essex-gold focus:ring-1 focus:ring-essex-gold transition-all"
          ></textarea>
        </div>

        {/* --- SUBMIT --- */}
        <div className="pt-4">
          <button
            type="submit"
            className={`
              w-full text-white font-serif tracking-wider font-bold py-4 rounded-xl border-b-4 transition-all duration-200 transform active:scale-[0.98] active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center
              ${isAddMode 
                ? "bg-red-700/50 border-red-900 hover:bg-red-700 shadow-red-900/30 shadow-lg" 
                : "bg-green-600/70 border-green-900 hover:bg-green-500 shadow-green-900/30 shadow-lg"}
            `}
          >
            <span className="text-2xl">♣ Registrera ♥</span>
            <span className="text-lg font-sans font-normal opacity-90 mt-1">
              {isAddMode ? "(Ge Straff)" : "(SKÅL!)"}
            </span>
          </button>
        </div>

        {status.message && (
          <div
            className={`text-center p-4 rounded-xl mt-4 font-bold text-lg border-2 animate-pulse ${
              status.type === "success"
                ? "bg-green-900/30 border-green-500 text-green-400"
                : "bg-red-900/30 border-red-500 text-red-400"
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
