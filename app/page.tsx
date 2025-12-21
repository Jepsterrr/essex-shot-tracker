"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member, Witness } from "@/types/types";
import LoadingSkeleton from "./loading";
import toast, { Toaster } from "react-hot-toast";
import { addToQueue, cacheData, getCachedData } from "@/lib/offline-queue";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allWitnessOptions, setAllWitnessOptions] = useState<Witness[]>([]);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // UI State
  const [changeType, setChangeType] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [otherWitnessValue, setOtherWitnessValue] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOfflineMode(!navigator.onLine);
    };

    if (typeof navigator !== "undefined") {
      setIsOfflineMode(!navigator.onLine);
    }

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const cached = getCachedData();
      if (cached.members.length > 0) {
        setMembers(cached.members);
        setAllWitnessOptions(cached.witnesses);
        setIsLoadingData(false);
      }

      if (!navigator.onLine) {
        if (cached.members.length === 0)
          toast.error("Du är offline och ingen data finns sparad.");
        setIsLoadingData(false);
        return;
      }

      try {
        const { data: allActiveMembers } = await supabase
          .from("members")
          .select("*")
          .eq("is_active", true)
          .order("name");

        const { data: witnessData } = await supabase
          .from("witnesses")
          .select("*")
          .order("name");

        if (!isMounted) return;

        const fetchedMembers = allActiveMembers || [];

        const membersWhoCanWitness = fetchedMembers.filter((m) =>
          ["ESS", "Joker"].includes(m.group_type)
        );

        const memberWitnesses: Witness[] = membersWhoCanWitness.map((m) => ({
          id: m.id,
          name: m.name,
        }));

        const combined = [...(witnessData || []), ...memberWitnesses];
        const uniqueWitnesses = Array.from(
          new Map(combined.map((item) => [item.name, item])).values()
        );
        const sortedWitnesses = uniqueWitnesses.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMembers(fetchedMembers);
        setAllWitnessOptions(sortedWitnesses);
        cacheData(fetchedMembers, sortedWitnesses);
      } catch (error) {
        console.error("Error fetching fresh data:", error);
        if (members.length === 0) toast.error("Kunde inte hämta data");
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadData();

    const channel = supabase
      .channel("live-members-update")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members",
        },
        (payload) => {
          setMembers((currentMembers) => {
            let newMemberList = [...currentMembers];
            const eventType = payload.eventType;

            if (eventType === "INSERT") {
              const newMember = payload.new as Member;
              if (newMember.is_active) {
                if (!newMemberList.find((m) => m.id === newMember.id)) {
                  newMemberList.push(newMember);
                  newMemberList.sort((a, b) => a.name.localeCompare(b.name));
                }
              }
            } else if (eventType === "UPDATE") {
              const updatedMember = payload.new as Member;
              if (!updatedMember.is_active) {
                newMemberList = newMemberList.filter(
                  (m) => m.id !== updatedMember.id
                );
              } else {
                const index = newMemberList.findIndex(
                  (m) => m.id === updatedMember.id
                );
                if (index >= 0) {
                  newMemberList[index] = {
                    ...newMemberList[index],
                    ...updatedMember,
                  };
                } else {
                  newMemberList.push(updatedMember);
                  newMemberList.sort((a, b) => a.name.localeCompare(b.name));
                }
              }
            } else if (eventType === "DELETE") {
              newMemberList = newMemberList.filter(
                (m) => m.id !== payload.old.id
              );
            }

            cacheData(newMemberList, getCachedData().witnesses);
            return newMemberList;
          });

          setAllWitnessOptions((currentWitnesses) => {
            let newWitnessList = [...currentWitnesses];
            const eventType = payload.eventType;

            const shouldBeWitness = (m: Member) =>
              m.is_active && ["ESS", "Joker"].includes(m.group_type);

            if (eventType === "INSERT" || eventType === "UPDATE") {
              const record = payload.new as Member;

              if (shouldBeWitness(record)) {
                const index = newWitnessList.findIndex(
                  (w) => w.id === record.id
                );
                if (index >= 0) {
                  newWitnessList[index] = { id: record.id, name: record.name };
                } else {
                  newWitnessList.push({ id: record.id, name: record.name });
                  newWitnessList.sort((a, b) => a.name.localeCompare(b.name));
                }
              } else {
                newWitnessList = newWitnessList.filter(
                  (w) => w.id !== record.id
                );
              }
            } else if (eventType === "DELETE") {
              newWitnessList = newWitnessList.filter(
                (w) => w.id !== payload.old.id
              );
            }

            cacheData(getCachedData().members, newWitnessList);
            return newWitnessList;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const resetForm = () => {
    setSelectedMemberIds([]);
    setChangeType("add");
    setAmount(1);
    setReason("");
    setSelectedWitnesses([]);
    setOtherWitnessValue("");
  };

  const handleUndo = async (logIds: string[]) => {
    const toastId = toast.loading("Ångrar...");
    try {
      await Promise.all(
        logIds.map((id) =>
          fetch(`/api/revert-shot?id=${id}`, { method: "DELETE" })
        )
      );
      toast.success("Ångrat! Ingen skada skedd.", {
        id: toastId,
        duration: 4000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ångra allt.", { id: toastId, duration: 4000 });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numAmount = Number(amount);

    if (selectedMemberIds.length === 0 || numAmount <= 0) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      toast.error("Välj minst en medlem och antal > 0");
      setIsSubmitting(false);
      return;
    }

    const selectedWitnessObjects = allWitnessOptions.filter((w) =>
      selectedWitnesses.includes(w.id)
    );

    const witnessNames = selectedWitnessObjects.map((w) => w.name);

    const giverIds = selectedWitnessObjects
      .map((w) => {
        const member = members.find((m) => m.id === w.id);
        if (
          member &&
          (member.group_type === "ESS" || member.group_type === "Joker")
        ) {
          return member.id;
        }
        return null;
      })
      .filter((id): id is string => id !== null);

    if (
      changeType === "add" &&
      giverIds.length === 0 &&
      !otherWitnessValue.trim()
    ) {
      toast.error("Minst ett giltigt vittne krävs för straff.");
      setIsSubmitting(false);
      return;
    }

    const changeAmount = changeType === "add" ? numAmount : -numAmount;
    const finalWitnesses = [...witnessNames];
    if (otherWitnessValue.trim()) {
      finalWitnesses.push(`Övrig: ${otherWitnessValue.trim()}`);
    }

    const createdLogIds: string[] = [];
    let errorCount = 0;
    let queuedCount = 0;

    if (!navigator.onLine) {
      selectedMemberIds.forEach((memberId) => {
        const selectedMember = members.find((m) => m.id === memberId);
        if (!selectedMember) return;

        const payload = {
          member_id: memberId,
          change: changeAmount,
          reason,
          witnesses: finalWitnesses,
          group_type: selectedMember.group_type,
          giver_ids: changeType === "add" ? giverIds : [],
        };

        addToQueue(payload);
      });

      setIsSubmitting(false);
      resetForm();
      toast.success(
        "Du är offline! Sparade straffen i kön. De skickas så fort du får nät igen.",
        {
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
            border: "1px solid #d4af37",
          },
        }
      );
      return;
    }

    const promises = selectedMemberIds.map(async (memberId) => {
      const selectedMember = members.find((m) => m.id === memberId);
      if (!selectedMember) return;

      const payload = {
        member_id: memberId,
        change: changeAmount,
        reason,
        witnesses: finalWitnesses,
        group_type: selectedMember.group_type,
        giver_ids: changeType === "add" ? giverIds : [],
      };

      let response;

      try {
        response = await fetch("/api/log-shot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Nätverksfel (fetch throw):", err);
        addToQueue(payload);
        queuedCount++;
        return;
      }

      if (!response.ok) {
        console.error("Serverfel status:", response.status);
        errorCount++;
        return;
      }

      try {
        const data = await response.json();
        if (data.logId) createdLogIds.push(data.logId);
      } catch (jsonError) {
        console.error("Kunde inte tolka JSON-svar:", jsonError);
        errorCount++;
      }
    });

    await Promise.all(promises);

    setIsSubmitting(false);

    if (errorCount > 0) {
      toast.error(
        `Lyckades med ${createdLogIds.length}, Köade: ${queuedCount}, Misslyckades: ${errorCount}`,
        {
          duration: 4000,
        }
      );
    } else if (queuedCount > 0 && createdLogIds.length) {
      resetForm();
      toast.success("Nätverket svajade! Sparade allt i offline-kön.", {
        duration: 4000,
      });
    } else if (queuedCount > 0) {
      resetForm();
      toast.success(
        `${createdLogIds.length} sparade, ${queuedCount} köade pga nätverk.`,
        {
          duration: 4000,
        }
      );
    } else {
      const affectedMembers = members.filter((m) =>
        selectedMemberIds.includes(m.id)
      );
      let namesString = "";

      if (affectedMembers.length === 1) {
        namesString = affectedMembers[0].name;
      } else if (affectedMembers.length === 2) {
        namesString = `${affectedMembers[0].name} & ${affectedMembers[1].name}`;
      } else {
        namesString = `${affectedMembers.length} personer`;
      }

      const toastMessage =
        changeType === "add"
          ? `${amount} shots utdelat till ${namesString}`
          : `Skål! ${namesString} drack ${amount}`;

      resetForm();

      toast(
        (t) => (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-bold">{toastMessage}</span>
            </div>
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
        ),
        {
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
            border: "1px solid #d4af37",
          },
        }
      );
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleWitnessChange = (witnessId: string) => {
    setSelectedWitnesses((prev) =>
      prev.includes(witnessId)
        ? prev.filter((id) => id !== witnessId)
        : [...prev, witnessId]
    );
  };

  const incrementAmount = () => {
    setDirection(1);
    setAmount((prev) => prev + 1);
  };

  const decrementAmount = () => {
    setDirection(-1);
    setAmount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  if (isLoadingData) return <LoadingSkeleton />;

  const isAddMode = changeType === "add";

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <Toaster position="bottom-center" />

      <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">
        Shot-Protokoll
      </h1>

      {isOfflineMode && (
        <div className="bg-yellow-600 text-white text-center py-2 px-4 mb-4 rounded font-bold border border-yellow-400">
          Du är offline. Händelser sparas i kön.
        </div>
      )}

      <motion.form
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="space-y-8 bg-card-white text-gray-200 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200/10"
      >
        {/* --- VÄLJ MEDLEM (GRID) --- */}
        <div>
          <label className="text-lg font-semibold mb-3 text-gray-200 flex justify-between">
            <span>
              Vem gäller det?{" "}
              {selectedMemberIds.length > 0 && (
                <span className={isAddMode ? "text-red-400" : "text-green-400"}>
                  ({selectedMemberIds.length} valda)
                </span>
              )}
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
            {members
              .filter((m) => m.group_type !== "Joker")
              .map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`
                            py-4 px-2 rounded-lg text-sm font-bold transition-all duration-150 border shadow-md
                            ${
                              isSelected
                                ? isAddMode
                                  ? "bg-red-700 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] transform scale-[0.98]"
                                  : "bg-green-600 text-white border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)] transform scale-[0.98]"
                                : "bg-gray-700/50 text-gray-white border-gray-600 hover:bg-gray-600"
                            }
                        `}
                  >
                    {member.name}
                    {isSelected && " ✓"}
                  </motion.button>
                );
              })}
            {members.filter((m) => m.group_type !== "Joker").length === 0 && (
              <p className="col-span-full text-center text-gray-500 py-4">
                Inga medlemmar hittades
              </p>
            )}
          </div>
        </div>

        {/* --- LÄGE & ANTAL --- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 bg-gray-900 p-1 rounded-xl border border-gray-600">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setChangeType("add")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                isAddMode
                  ? "bg-red-700/80 text-white shadow-lg scale-100 ring-2 ring-red-500/50"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              GE SKULD
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setChangeType("remove")}
              className={`py-4 text-lg font-bold rounded-lg transition-all duration-300 ${
                !isAddMode
                  ? "bg-green-600/80 text-white shadow-lg scale-100 ring-2 ring-green-500/50"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              DRICKA
            </motion.button>
          </div>

          <div className="flex items-center justify-between bg-gray-600/30 p-2 rounded-xl border border-gray-600">
            <motion.button
              whileTap={{ scale: 0.90 }}
              type="button"
              onClick={decrementAmount}
              className={`w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800 ${
                isAddMode ? "hover:bg-red-900/40" : "hover:bg-green-900/40"
              }`}
            >
              −
            </motion.button>
            <div className="relative h-16 flex-grow flex items-center justify-center overflow-hidden">
              <div className="flex flex-col items-center w-full">
                <span className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-1">
                  Antal
                </span>
                <div className="relative h-12 w-full flex justify-center items-center">
                  <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.span
                      key={amount}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className={`
                        text-5xl font-bold absolute
                        ${isAddMode ? "text-essex-red" : "text-green-500"}
                      `}
                    >
                      {amount}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={incrementAmount}
              className={`w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-700 text-white rounded-lg text-3xl font-bold transition-colors active:bg-gray-800 ${
                isAddMode ? "hover:bg-red-900/40" : "hover:bg-green-900/40"
              }`}
            >
              +
            </motion.button>
          </div>
        </div>

        {/* --- VITTNEN --- */}
        <div>
          <label className="block text-lg font-semibold mb-3 text-gray-200">
            Vilka såg det?
          </label>
          <div className="flex flex-wrap gap-3">
            {allWitnessOptions.map((w) => {
              const isSelected = selectedWitnesses.includes(w.id);
              return (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={w.id}
                  type="button"
                  onClick={() => handleWitnessChange(w.id)}
                  className={`
                    flex-grow md:flex-grow-0 py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 border
                    ${
                      isSelected
                        ? isAddMode
                          ? "bg-red-700/80 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] transform scale-105"
                          : "bg-green-600/80 text-white border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)] transform scale-105"
                        : "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600"
                    }
                  `}
                >
                  {w.name}
                </motion.button>
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
            className={`form-input w-full bg-gray-800/50 border rounded-lg p-4 text-lg text-white placeholder-gray-500 transition-all ${
              isAddMode
                ? "focus:border-red-500 focus:ring-1 focus:ring-red-500 border-gray-600"
                : "focus:border-green-500 focus:ring-1 focus:ring-green-500 border-gray-600"
            }`}
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
            className={`form-input w-full bg-gray-800/50 border rounded-lg p-4 text-lg text-white placeholder-gray-500 transition-all ${
              isAddMode
                ? "focus:border-red-500 focus:ring-1 focus:ring-red-500 border-gray-600"
                : "focus:border-green-500 focus:ring-1 focus:ring-green-500 border-gray-600"
            }`}
          ></textarea>
        </div>

        {/* --- SUBMIT --- */}
        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full text-white font-serif tracking-wider font-bold py-4 rounded-xl border-b-4 transition-all duration-200 transform active:scale-[0.98] active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
              ${
                isAddMode
                  ? "bg-red-700/50 border-red-900 hover:bg-red-700 shadow-red-900/30 shadow-lg"
                  : "bg-green-600/70 border-green-900 hover:bg-green-500 shadow-green-900/30 shadow-lg"
              }
            `}
          >
            {isSubmitting ? (
              <span className="text-2xl animate-pulse">Registrerar...</span>
            ) : (
              <>
                <span className="text-2xl">
                  {selectedMemberIds.length > 1
                    ? "♣ Massbestraffning ♥"
                    : "♣ Registrera ♥"}
                </span>
                <span className="text-lg font-sans font-normal opacity-90 mt-1">
                  {isAddMode ? "(Ge Straff)" : "(SKÅL!)"}
                </span>
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
