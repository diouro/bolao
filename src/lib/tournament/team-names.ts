import { t, type Locale, type TranslationKey } from "@/lib/i18n";

export function getLocalizedTeamName(
  locale: Locale,
  code?: string | null,
  fallback?: string | null,
) {
  if (!code) {
    return fallback ?? "";
  }

  const key = `teams.${code}` as TranslationKey;
  const translated = t(locale, key);

  if (translated !== key) {
    return translated;
  }

  return fallback ?? code;
}
