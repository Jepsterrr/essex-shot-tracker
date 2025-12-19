"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { getQueue, removeFromQueue } from "@/lib/offline-queue";

export default function OfflineSyncManager() {
  useEffect(() => {
    const handleOnline = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;

      const toastId = toast.loading(`Synkar ${queue.length} sparade händelser...`);
      let successCount = 0;

      // Vi loopar igenom kön och försöker skicka varje post
      for (const item of queue) {
        try {
          const res = await fetch("/api/log-shot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });

          if (res.ok) {
            removeFromQueue(item.id);
            successCount++;
          } else {
            console.error("Failed to sync item", item);
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      }

      if (successCount > 0) {
        toast.success(`Synkroniserade ${successCount} straffar!`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    };

    window.addEventListener("online", handleOnline);
    
    // Kör en check direkt vid mount ifall vi startar appen med nät
    if (typeof navigator !== "undefined" && navigator.onLine) {
        handleOnline();
    }

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}