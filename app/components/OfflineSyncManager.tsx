"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { getQueue, removeFromQueue, incrementRetryCount } from "@/lib/offline-queue";

const MAX_RETRIES = 5;

export default function OfflineSyncManager() {
  useEffect(() => {
    const handleOnline = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;

      const toastId = toast.loading(`Synkar ${queue.length} sparade händelser...`);
      let successCount = 0;
      let failCount = 0;

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
            if (res.status >= 400 && res.status < 500) {
              console.error(`Tog bort ogiltig post (Status ${res.status}):`, item);
              removeFromQueue(item.id);
              failCount++;
            } else {
              const retries = incrementRetryCount(item.id);
              console.warn(`Misslyckades att synka item ${item.id}. Försök: ${retries}/${MAX_RETRIES}`);
              
              if (retries >= MAX_RETRIES) {
                console.error("Max retries uppnått. Tar bort item:", item);
                removeFromQueue(item.id);
                failCount++;
              }
            }
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      }

      if (successCount > 0) {
        toast.success(`Synkroniserade ${successCount} händelser!`, { id: toastId });
      } else if (failCount > 0) {
        toast.error(`${failCount} händelser var ogiltiga och kunde inte sparas. Borttagna från kön.`, { id: toastId });
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