"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member } from "@/types/types";
import { useRouter } from "next/navigation";

export default function AdminMembersPage() {
  // State för komponentens data
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [archivedMembers, setArchivedMembers] = useState<Member[]>([]);

  // State för sortering av arkiverade medlemmar
  const [sortKey, setSortKey] = useState<"name" | "created_at">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // State för formulär och statusmeddelanden
  const [newName, setNewName] = useState("");
  const [newMemberGroup, setNewMemberGroup] = useState<"ESS" | "Kex" | "Joker">(
    "ESS"
  );
  const [status, setStatus] = useState("");

  // State för redigeringsläget
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingGroup, setEditingGroup] = useState<"ESS" | "Kex" | "Joker">(
    "ESS"
  );

  const router = useRouter();

  // --- Datahämtning ---
  const fetchActiveMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setActiveMembers(data);
  };

  const fetchArchivedMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("is_active", false)
      .order("name");
    if (data) setArchivedMembers(data);
  };

  useEffect(() => {
    fetchActiveMembers();
    fetchArchivedMembers();
  }, []);

  const refreshAllData = async () => {
    await Promise.all([fetchActiveMembers(), fetchArchivedMembers()]);
    router.refresh();
  };

  // --- Funktioner för att hantera medlemmar ---
  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMemberOptimistic = {
      id: tempId,
      name: newName.trim(),
      group_type: newMemberGroup,
      is_active: true,
      current_shots: 0,
      created_at: new Date().toISOString(),
    };

    // Optimistic Uppdatering
    setActiveMembers((prev) =>
      [newMemberOptimistic, ...prev].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    const originalName = newName;
    setNewName("");

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newMemberOptimistic.name,
        group_type: newMemberOptimistic.group_type,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      setStatus(`Kunde inte lägga till medlem: ${error}`);
      setActiveMembers((prev) => prev.filter((m) => m.id !== tempId));
      setNewName(originalName);
    } else {
      setStatus(`Medlem "${newMemberOptimistic.name}" tillagd!`);
      await refreshAllData();
    }
  };

  const handleArchiveMember = async (id: string, name: string) => {
    if (!window.confirm(`Är du säker på att du vill ARKIVERA ${name}?`)) return;
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, is_active: false }),
    });
    if (res.ok) {
      setStatus(`Medlem "${name}" har arkiverats!`);
      await refreshAllData();
    } else {
      const { error } = await res.json();
      setStatus(`Kunde inte arkivera medlem: ${error}`);
    }
  };

  const handleReactivateMember = async (id: string, name: string) => {
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, is_active: true }),
    });
    if (res.ok) {
      setStatus(`Medlem "${name}" har återaktiverats!`);
      await refreshAllData();
    } else {
      const { error } = await res.json();
      setStatus(`Kunde inte återaktivera medlem: ${error}`);
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    const confirmMsg = `Är du HELT säker? Detta raderar ${name} och all historik och data kopplat till ${name} PERMANENT. (Detta kan inte ångras!)`;
    if (!window.confirm(confirmMsg)) return;
    const res = await fetch(`/api/members?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setStatus(`Medlem "${name}" har raderats permanent.`);
      await fetchArchivedMembers();
      router.refresh();
    } else {
      const { error } = await res.json();
      setStatus(`Kunde inte radera medlem: ${error}`);
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMemberId(member.id);
    setEditingName(member.name);
    setEditingGroup(member.group_type as "ESS" | "Kex" | "Joker");
  };

  const handleCancelClick = () => setEditingMemberId(null);

  const handleSaveClick = async (id: string) => {
    if (!editingName.trim()) return;
    const res = await fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        newName: editingName.trim(),
        newGroup: editingGroup,
      }),
    });
    if (res.ok) {
      setStatus("Namn uppdaterat!");
      setEditingMemberId(null);
      await fetchActiveMembers();
      router.refresh();
    } else {
      const { error } = await res.json();
      setStatus(`Kunde inte uppdatera: ${error}`);
    }
  };

  const sortedArchivedMembers = useMemo(() => {
    return [...archivedMembers].sort((a, b) => {
      if (sortKey === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [archivedMembers, sortKey, sortOrder]);

  const handleSort = (key: "name" | "created_at") => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-200/10">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-200 mb-2">
          Hantera Medlemmar
        </h1>
        <p className="text-gray-300 mb-6 md:mb-8">
          Lägg till, redigera, arkivera eller ta bort medlemmar i systemet.
        </p>

        {/* Sektion: Lägg till ny medlem */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-200">
            Lägg till ny medlem
          </h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <label
              htmlFor="newName"
              className="block text-sm font-medium text-gray-300"
            >
              Namn & Roll
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-input flex-grow w-full bg-white border border-gray-400 rounded-md p-2 shadow-sm text-gray-200"
                placeholder="Medlemmens namn..."
                required
              />
              <div className="flex items-center gap-4 flex-shrink-0 py-2 sm:py-0">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ESS"
                    checked={newMemberGroup === "ESS"}
                    onChange={() => setNewMemberGroup("ESS")}
                    className="form-radio h-4 w-4"
                  />{" "}
                  <span className="ml-1 font-semibold text-gray-100">ESS</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Kex"
                    checked={newMemberGroup === "Kex"}
                    onChange={() => setNewMemberGroup("Kex")}
                    className="form-radio h-4 w-4"
                  />{" "}
                  <span className="ml-1 font-semibold text-gray-100">Kex</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Joker"
                    checked={newMemberGroup === "Joker"}
                    onChange={() => setNewMemberGroup("Joker")}
                    className="form-radio h-4 w-4"
                  />{" "}
                  <span className="ml-1 font-semibold text-gray-100">
                    Joker
                  </span>
                </label>
              </div>
              <button
                type="submit"
                className="flex-shrink-0 bg-green-500 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
              >
                Lägg till
              </button>
            </div>
          </form>
        </div>

        {/* Sektion: Aktiva Medlemmar */}
        <div className="mt-10">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-200">
            Aktiva Medlemmar
          </h2>
          {status && (
            <p className="mb-4 text-center text-sm p-3 border border-amber-300/50 bg-gray-600/50 text-gray-200 rounded-md">
              {status}
            </p>
          )}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {activeMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 gap-3 bg-gray-600/30 hover:bg-gray-600/50 transition-colors"
                >
                  {editingMemberId === member.id ? (
                    // Redigeringsläge
                    <div className="flex-grow flex flex-col sm:flex-row items-stretch gap-2 w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="form-input flex-grow bg-white border border-gray-500/40 text-gray-100 rounded-md p-1 w-full"
                      />
                      <div className="flex gap-4 justify-center items-center flex-shrink-0 py-1">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="ESS"
                            checked={editingGroup === "ESS"}
                            onChange={() => setEditingGroup("ESS")}
                            className="form-radio h-4 w-4"
                          />{" "}
                          <span className="ml-1 text-xs text-gray-100">
                            ESS
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Kex"
                            checked={editingGroup === "Kex"}
                            onChange={() => setEditingGroup("Kex")}
                            className="form-radio h-4 w-4"
                          />{" "}
                          <span className="ml-1 text-xs text-gray-100">
                            Kex
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Joker"
                            checked={editingGroup === "Joker"}
                            onChange={() => setEditingGroup("Joker")}
                            className="form-radio h-4 w-4"
                          />{" "}
                          <span className="ml-1 text-xs text-gray-100">
                            Joker
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    // Visningsläge
                    <div className="flex-grow flex items-center mb-2 sm:mb-0">
                      <div>
                        <span className="p-1 font-medium text-gray-100">
                          {member.name}
                        </span>
                        <span
                          className={`text-xs font-bold ml-2 px-2 py-0.5 rounded-full ${
                            member.group_type === "Kex"
                              ? "bg-blue-100 text-blue-800"
                              : member.group_type == "Joker"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.group_type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-300 ml-auto">
                        Skapad:{" "}
                        {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                    {editingMemberId === member.id ? (
                      <>
                        <button
                          onClick={() => handleSaveClick(member.id)}
                          className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-700"
                        >
                          Spara
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="bg-gray-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-gray-400"
                        >
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(member)}
                          className="font-semibold text-xs py-1 px-3 rounded-md text-gray-200 hover:bg-gray-600"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() =>
                            handleArchiveMember(member.id, member.name)
                          }
                          className="font-semibold text-xs py-1 px-3 rounded-md text-gray-200 hover:bg-gray-600"
                        >
                          Arkivera
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sektion: Arkiverade Medlemmar */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-200">
            Arkiverade Medlemmar
          </h2>
          <p className="text-sm text-gray-300 mb-4">
            Medlemmar här är dolda från vanliga listor men deras historik finns
            kvar. Härifrån kan de återaktiveras eller raderas permanent.
          </p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleSort("name")}
              className={`font-semibold text-xs py-1 px-3 rounded-md ${
                sortKey === "name"
                  ? "bg-amber-400/80 text-black hover:bg-amber-400/90"
                  : "text-gray-200 hover:bg-gray-600"
              }`}
            >
              Namn{" "}
              {sortKey === "name" && (sortOrder === "asc" ? "(A-Ö)" : "(Ö-A)")}
            </button>
            <button
              onClick={() => handleSort("created_at")}
              className={`font-semibold text-xs py-1 px-3 rounded-md ${
                sortKey === "created_at"
                  ? "bg-amber-400/80 text-black hover:bg-amber-400/90"
                  : "text-gray-200 hover:bg-gray-600"
              }`}
            >
              Skapad{" "}
              {sortKey === "created_at" &&
                (sortOrder === "desc" ? "(Nyast)" : "(Äldst)")}
            </button>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {sortedArchivedMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 gap-2 bg-gray-600/50"
                >
                  <div>
                    <span className="p-1 font-medium text-gray-50 italic mb-2 sm:mb-0">
                      {member.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      Skapad: {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleReactivateMember(member.id, member.name)
                      }
                      className="font-semibold text-xs py-1 px-3 rounded-md text-green-500 hover:bg-green-100"
                    >
                      Återställ
                    </button>
                    <button
                      onClick={() => handleHardDelete(member.id, member.name)}
                      className="font-semibold text-xs py-1 px-3 rounded-md text-red-600 hover:bg-red-100"
                    >
                      Ta bort permanent
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
