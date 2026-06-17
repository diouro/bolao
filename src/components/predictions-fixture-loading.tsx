import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function PredictionsFixtureLoading({ locale }: { locale: Locale }) {
  return (
    <Card
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-zinc-500"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-semibold">{t(locale, "common.loading")}</p>
    </Card>
  );
}
