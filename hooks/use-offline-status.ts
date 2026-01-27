import { useState, useEffect } from "react";

export function useOfflineStatus() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => setIsOfflineMode(!navigator.onLine);

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

  return isOfflineMode;
}
