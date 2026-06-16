import { setLocale } from "@/app/actions";
import { localeLabels, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <form action={setLocale} className="flex rounded-full border border-zinc-200 bg-white p-1">
      {locales.map((item) => (
        <button
          key={item}
          type="submit"
          name="locale"
          value={item}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition",
            locale === item
              ? "bg-emerald-600 text-white"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
            compact && "px-2",
          )}
          aria-label={localeLabels[item]}
        >
          {compact && item === "pt" ? "PT" : item.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
