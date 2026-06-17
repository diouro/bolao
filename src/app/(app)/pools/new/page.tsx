import { PendingForm } from "@/components/pending-form";
import { Button } from "@/components/button";
import { Card, Input, Label } from "@/components/ui";
import { createPoolAction } from "@/app/(app)/pools/new/actions";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NewPoolPage() {
  const locale = await getLocale();

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "pools.create")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "pools.createTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          {t(locale, "pools.createBody")}
        </p>
      </div>

      <Card className="max-w-xl p-6">
        <PendingForm action={createPoolAction} className="space-y-5">
          <div>
            <Label htmlFor="pool-name">{t(locale, "pools.name")}</Label>
            <Input
              id="pool-name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              placeholder={t(locale, "pools.namePlaceholder")}
            />
          </div>
          <Button type="submit" pendingChildren={t(locale, "pools.creating")}>
            {t(locale, "pools.create")}
          </Button>
        </PendingForm>
      </Card>
    </>
  );
}
