import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function PredictionsLoading() {
  const locale = await getLocale();

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-semibold">{t(locale, "common.loading")}</p>
    </div>
  );
}
