"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { setLocale } from "@/app/actions";
import { PendingForm } from "@/components/pending-form";
import { localeLabels, locales, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <PendingForm
      action={setLocale}
      className={cn(
        "flex items-center rounded-full border border-zinc-200 bg-white p-1",
        compact ? "gap-0.5" : "gap-1",
      )}
    >
      <LanguageSwitcherButtons locale={locale} compact={compact} />
    </PendingForm>
  );
}

function LanguageSwitcherButtons({
  locale,
  compact,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();
  const [targetLocale, setTargetLocale] = useState<Locale | null>(null);

  return (
    <>
      {locales.map((item) => {
        const isActive = locale === item;
        const isLoading = pending && targetLocale === item;

        return (
          <button
            key={item}
            type="submit"
            name="locale"
            value={item}
            disabled={pending || isActive}
            onClick={() => setTargetLocale(item)}
            className={cn(
              "inline-flex min-w-[2.75rem] items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed",
              isActive
                ? "bg-emerald-600 text-white"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
              pending && !isLoading && !isActive && "opacity-50",
              compact && "min-w-[2.25rem] px-2",
            )}
            aria-label={localeLabels[item]}
            aria-busy={isLoading || undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="sr-only">{t(locale, "common.loading")}</span>
              </>
            ) : (
              (compact && item === "pt" ? "PT" : item.toUpperCase())
            )}
          </button>
        );
      })}
      {pending && (
        <span
          className={cn(
            "pr-2 text-[10px] font-semibold text-zinc-500",
            compact && "sr-only",
          )}
          aria-live="polite"
        >
          {t(locale, "common.loading")}
        </span>
      )}
    </>
  );
}
