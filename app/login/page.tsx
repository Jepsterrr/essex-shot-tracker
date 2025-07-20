"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Felaktigt lösenord. Försök igen.");
      }
    } catch (err) {
      setError("Ett fel uppstod. Kontrollera din anslutning.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-card-white text-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200/10">
        <h1 className="text-3xl font-serif font-bold text-center mb-6 text-gray-200">
          Lösenordsskyddad
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Ange lösenordet för att få tillgång till sidan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password-input" className="sr-only">
              Lösenord
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full bg-white border border-gray-400 rounded-md p-3 text-lg shadow-sm text-gray-200"
              placeholder="Lösenord..."
              required
            />
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-serif tracking-wider font-bold text-xl py-3 rounded-lg bg-essex-red hover:border-7 transition-all duration-300 transform hover:scale-105 border-b-3 border-t-3 border-red-900 active:border-b-2 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loggar in..." : "Logga in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
