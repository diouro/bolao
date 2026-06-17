"use client";

import { RotateCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";

export function BracketLandscapeGate({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [needsRotate, setNeedsRotate] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const portraitQuery = window.matchMedia("(orientation: portrait)");

    const update = () => {
      setNeedsRotate(mobileQuery.matches && portraitQuery.matches);
    };

    update();

    mobileQuery.addEventListener("change", update);
    portraitQuery.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      mobileQuery.removeEventListener("change", update);
      portraitQuery.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    if (needsRotate) {
      return;
    }

    let active = true;

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };

    orientation.lock?.("landscape").catch(() => {
      // Browsers only allow this in some contexts; rotate prompt is the fallback.
    });

    return () => {
      if (!active) {
        return;
      }

      active = false;
      orientation.unlock?.();
    };
  }, [needsRotate]);

  if (needsRotate) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <RotateCw className="h-10 w-10" aria-hidden />
        </div>
        <h2 className="text-xl font-black text-zinc-950">
          {t(locale, "bracket.rotateTitle")}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-zinc-600">
          {t(locale, "bracket.rotateBody")}
        </p>
      </div>
    );
  }

  return children;
}
