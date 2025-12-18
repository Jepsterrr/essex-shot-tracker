"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member, Witness } from "@/types/types";
import LoadingSkeleton from "./loading";
import toast, { Toaster } from "react-hot-toast";

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allWitnessOptions, setAllWitnessOptions] = useState<Witness[]>([]);
  
  // Array för massbestraffning
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  // UI State
  const [changeType, setChangeType] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState<number | "">(1);
  const [reason, setReason] = useState<string>("");
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [otherWitnessValue, setOtherWitnessValue] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: membersToReceiveShots } = await supabase
          .from("members")
          .select("*")
          .eq("is_active", true)
          .not("group_type", "eq", "Joker")
          .order("name");
        
        if (membersToReceiveShots) {
          setMembers(membersToReceiveShots);
        }

        const { data: membersWhoCanWitness } = await supabase
          .from("members")
          .select("id, name, group_type")
          .eq("is_active", true)
          .in("group_type", ["ESS", "Joker"]);

        const { data: witnessData } = await supabase
          .from("witnesses")
          .select("*")
          .order("name");

        const memberWitnesses: Witness[] = (membersWhoCanWitness || []).map(
          (m) => ({ id: m.id, name: m.name })
        );

        const combined = [...(witnessData || []), ...memberWitnesses];
        const uniqueWitnesses = Array.from(
          new Map(combined.map((item) => [item.name, item])).values()
        );

        setAllWitnessOptions(
          uniqueWitnesses.sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Kunde inte hämta data");
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const resetForm = () => {
    setSelectedMemberIds([]);
    setChangeType("add");
    setAmount(1);
    setReason("");
    setSelectedWitnesses([]);
    setOtherWitnessValue("");
  };

  // --- UNDO FUNKTION ---
  const handleUndo = async (logIds: string[]) => {
    const toastId = toast.loading("Ångrar...");
    try {
      await Promise.all(
        logIds.map((id) =>
          fetch(`/api/revert-shot?id=${id}`, { method: "DELETE" })
        )
      );
      toast.success("Ångrat! Ingen skada skedd.", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ångra allt.", { id: toastId });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const numAmount = Number(amount);

    if (selectedMemberIds.length === 0 || numAmount <= 0) {
      toast.error("Välj minst en medlem och antal > 0");
      setIsSubmitting(false);
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
      toast.error('Minst ett giltigt vittne krävs för straff.');
      setIsSubmitting(false);
      return;
    }

    const changeAmount = changeType === "add" ? numAmount : -numAmount;
    const finalWitnesses = [...selectedWitnesses];
    if (otherWitnessValue.trim()) {
      finalWitnesses.push(`Övrig: ${otherWitnessValue.trim()}`);
    }

    // --- MASSBESTRAFFNING LOGIK ---
    const createdLogIds: string[] = [];
    let errorCount = 0;

    const promises = selectedMemberIds.map(async (memberId) => {
        const selectedMember = members.find((m) => m.id === memberId);
        if (!selectedMember) return;

        const res = await fetch("/api/log-shot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: memberId,
            change: changeAmount,
            reason,
            witnesses: finalWitnesses,
            group_type: selectedMember.group_type,
            giver_ids: changeType === "add" ? giverIds : [],
          }),
        });

        if (!res.ok) {
            errorCount++;
        } else {
            const data = await res.json();
            if (data.logId) createdLogIds.push(data.logId);
        }
    });

    await Promise.all(promises);

    setIsSubmitting(false);

    if (errorCount > 0) {
        toast.error(`Lyckades med ${createdLogIds.length}, misslyckades med ${errorCount}.`);
    } else {
        resetForm();
        
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }

        toast((t) => (
            <div className="flex items-center gap-4">
                <span>
                    {changeType === "add" ? "Domarklubban har talat! ⚖️" : "Skål! 🍻"}
                </span>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        handleUndo(createdLogIds);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold border border-red-400 hover:bg-red-500"
                >
                    ÅNGRA
                </button>
            </div>
        ), {
            duration: 4000,
            style: {
                background: '#333',
                color: '#fff',
                border: '1px solid #d4af37',
            }
        });
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => 
        prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
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
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
  };
  
  const decrementAmount = () => {
    setAmount((prev) => {
      if (typeof prev !== "number") return 1;
      return prev > 1 ? prev - 1 : 1;
    });
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
  };

  if (isLoadingData) return <LoadingSkeleton />;

  const isAddMode = changeType === "add";

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <Toaster position="bottom-center" />
      
      <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">
        Shot-Protokoll
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-card-white text-gray-200 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200/10"
      >
        {/* --- VÄLJ MEDLEM (GRID) --- */}
        <div>
          <label className="text-lg font-semibold mb-3 text-gray-200 flex justify-between">
            <span>Vem gäller det? {selectedMemberIds.length > 0 && <span className={isAddMode ? "text-red-400" : "text-green-400"}>({selectedMemberIds.length} valda)</span>}</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
            {members.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                    <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={`
                            py-4 px-2 rounded-lg text-sm font-bold transition-all duration-150 border shadow-md
                            ${isSelected 
                                ? (isAddMode 
                                    ? "bg-red-700 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] transform scale-[0.98]" 
                                    : "bg-green-600 text-white border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)] transform scale-[0.98]")
                                : "bg-gray-700/50 text-gray-white border-gray-600 hover:bg-gray-600"}
                        `}
                    >
                        {member.name}
                        {isSelected && " ✓"}
                    </button>
                )
            })}
            {members.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-4">Inga medlemmar hittades</p>
            )}
          </div>
        </div>

        {/* --- LÄGE & ANTAL --- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 bg-gray-900 p-1 rounded-xl border border-gray-600">
            <button
              type="button"
              onClick={() => setChangeType("add")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                isAddMode
                  ? "bg-red-700/80 text-white shadow-lg scale-100 ring-2 ring-red-500/50"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              GE SKULD
            </button>
            <button
              type="button"
              onClick={() => setChangeType("remove")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                !isAddMode
                  ? "bg-green-600/80 text-white shadow-lg scale-100 ring-2 ring-green-500/50"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              DRICKA
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-600/30 p-2 rounded-xl border border-gray-600">
            <button
              type="button"
              onClick={decrementAmount}
              className={`w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800 ${isAddMode ? 'hover:bg-red-900/40' : 'hover:bg-green-900/40'}`}
            >
              −
            </button>
            <div className="flex flex-col items-center flex-grow px-4">
              <span className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-1">Antal</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className={`
                  w-full bg-transparent text-center text-5xl font-bold border-none focus:ring-0 p-0 no-spinner
                  ${isAddMode ? 'text-essex-red placeholder-red-800/50' : 'text-green-500 placeholder-green-800/50'}
                `}
                placeholder="0"
                min="1"
              />
            </div>
            <button
              type="button"
              onClick={incrementAmount}
              className={`w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800 ${isAddMode ? 'hover:bg-red-900/40' : 'hover:bg-green-900/40'}`}
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
                      ? (isAddMode
                          ? "bg-red-700/80 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] transform scale-105"
                          : "bg-green-600/80 text-white border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)] transform scale-105")
                      : "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600"}
                  `}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="+ Annat vittne (namn)"
            value={otherWitnessValue}
            onChange={(e) => setOtherWitnessValue(e.target.value)}
            className={`form-input w-full bg-gray-800/50 border rounded-lg p-4 text-lg text-white placeholder-gray-500 transition-all ${isAddMode ? 'focus:border-red-500 focus:ring-1 focus:ring-red-500 border-gray-600' : 'focus:border-green-500 focus:ring-1 focus:ring-green-500 border-gray-600'}`}
          />
        </div>

        {/* --- ANLEDNING --- */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-300">
            Anledning
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Varför?"
            className={`form-input w-full bg-gray-800/50 border rounded-lg p-4 text-lg text-white placeholder-gray-500 transition-all ${isAddMode ? 'focus:border-red-500 focus:ring-1 focus:ring-red-500 border-gray-600' : 'focus:border-green-500 focus:ring-1 focus:ring-green-500 border-gray-600'}`}
          ></textarea>
        </div>

        {/* --- SUBMIT --- */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full text-white font-serif tracking-wider font-bold py-4 rounded-xl border-b-4 transition-all duration-200 transform active:scale-[0.98] active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
              ${isAddMode 
                ? "bg-red-700/50 border-red-900 hover:bg-red-700 shadow-red-900/30 shadow-lg" 
                : "bg-green-600/70 border-green-900 hover:bg-green-500 shadow-green-900/30 shadow-lg"}
            `}
          >
            {isSubmitting ? (
              <span className="text-2xl animate-pulse">Registrerar...</span>
            ) : (
                <>
                    <span className="text-2xl">
                        {selectedMemberIds.length > 1 ? "♣ Massbestraffning ♥" : "♣ Registrera ♥"}
                    </span>
                    <span className="text-lg font-sans font-normal opacity-90 mt-1">
                        {isAddMode ? "(Ge Straff)" : "(SKÅL!)"}
                    </span>
                </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}