"use client";
import { useEffect } from "react";

export default function UsePwaInputFocusFix() {
  useEffect(() => {
    // kör bara i browser
    if (typeof window === "undefined") return;

    const isStandalone =
      // modern media query
      window.matchMedia && window.matchMedia("(display-mode: standalone)").matches ||
      // older iOS check
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (window.navigator && (window.navigator as any).standalone === true);

    if (!isStandalone) return;

    const onTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        const el = target as HTMLInputElement | HTMLTextAreaElement;
        if (el.readOnly || el.disabled) return;

        // liten timeout hjälper iOS att visa tangentbordet
        setTimeout(() => {
          try {
            el.focus();
            const len = (el.value || "").length;
            if (typeof el.setSelectionRange === "function") {
              el.setSelectionRange(len, len);
            }
          } catch {
            /* ignorerar fel */
          }
        }, 50);
      }
    };

    document.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    return () =>
      document.removeEventListener("touchend", onTouchEnd, { passive: true, capture: true } as any);
  }, []);

  return null;
}