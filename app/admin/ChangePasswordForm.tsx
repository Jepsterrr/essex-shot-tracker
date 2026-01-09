"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isInvalid = newPassword.trim().length < 8;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);

    const res = await fetch("/api/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });

    if (res.ok) {
      toast.success("Lösenordet har uppdaterats!");
      setNewPassword("");
    } else {
      toast.error("Kunde inte uppdatera lösenordet");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleUpdate}
      className="bg-gray-800/40 p-6 rounded-xl border border-gray-700"
    >
      <h3 className="text-xl font-bold text-gray-200 mb-4">Säkerhet</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="password"
          placeholder="Nytt gemensamt lösenord"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded border border-gray-600 flex-grow"
          required
        />
        <button
          type="submit"
          disabled={loading || isInvalid}
          className={`font-bold py-2 px-6 rounded transition-all ${
            loading || isInvalid
              ? "bg-red-600 text-gray-400 cursor-not-allowed opacity-50"
              : "bg-red-700 hover:bg-red-600 text-white shadow-lg active:scale-95"
          }`}
        >
          {loading ? "Sparar..." : "Byt lösenord"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {isInvalid && newPassword.length > 0 
          ? "Lösenordet måste vara minst 8 tecken." 
          : "Varning: Detta ändrar lösenordet för ALLA som använder sidan."}
      </p>
    </form>
  );
}
