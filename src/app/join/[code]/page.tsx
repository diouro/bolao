import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";
import { joinPoolAction } from "@/app/join/[code]/actions";
import { getPoolByInviteCode } from "@/lib/pools/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function JoinPoolPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const pool = await getPoolByInviteCode(code);

  if (!pool) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <Card className="w-full max-w-lg p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "pools.join")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "pools.joinTitle", { name: pool.name })}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">{t(locale, "pools.joinBody")}</p>

        {user ? (
          <form action={joinPoolAction.bind(null, code)} className="mt-6">
            <Button type="submit" className="w-full">
              {t(locale, "pools.joinConfirm", { name: pool.name })}
            </Button>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/signin?next=/join/${code}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {t(locale, "auth.signIn")}
            </Link>
            <Link
              href={`/signup?next=/join/${code}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
            >
              {t(locale, "auth.create")}
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
