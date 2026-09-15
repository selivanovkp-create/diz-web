"use client";

import { useEffect } from "react";
import { useFormaStore } from "@/lib/store";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        themeParams: Record<string, string>;
        colorScheme: "light" | "dark";
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        platform: string;
        isExpanded: boolean;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
        };
      };
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const setName = useFormaStore((s) => s.setName);
  const user = useFormaStore((s) => s.user);
  const hydrated = useFormaStore((s) => s.hydrated);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const wa = window.Telegram?.WebApp;
      if (!wa) return;
      document.documentElement.classList.add("telegram-mini-app");
      wa.ready();
      wa.expand();
      try {
        wa.setHeaderColor?.("#f2f3f0");
        wa.setBackgroundColor?.("#f2f3f0");
      } catch {
        /* older clients */
      }

      const tgUser = wa.initDataUnsafe?.user;
      if (tgUser?.first_name && hydrated) {
        const full = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
        if (!user?.name || user.name === "Konstantin") {
          setName(full);
        }
      }
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [hydrated, setName, user?.name]);

  return <>{children}</>;
}

export function triggerHaptic(kind: "success" | "light" = "light") {
  const hf = window.Telegram?.WebApp?.HapticFeedback;
  if (!hf) return;
  if (kind === "success") hf.notificationOccurred("success");
  else hf.impactOccurred("light");
}
