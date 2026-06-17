import Link from "next/link";
import { setCurrentPool } from "@/app/actions";
import { Button } from "@/components/button";
import { t, type Locale } from "@/lib/i18n";
import type { PoolMembership } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PoolSwitcher({
  memberships,
  currentSlug,
  locale,
}: {
  memberships: PoolMembership[];
  currentSlug: string;
  locale: Locale;
}) {
  const current = memberships.find(
    (membership) => membership.pool.slug === currentSlug,
  );

  return (
    <div className="border-b border-zinc-200 p-4">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {t(locale, "pools.current")}
      </p>
      <details className="group relative">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-950",
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="truncate">{current?.pool.name ?? t(locale, "pools.select")}</span>
          <span className="text-xs text-zinc-500 group-open:rotate-180">▼</span>
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
          {memberships.map((membership) => (
            <form key={membership.pool.id} action={setCurrentPool}>
              <input type="hidden" name="slug" value={membership.pool.slug} />
              <Button
                type="submit"
                className={cn(
                  "h-10 w-full justify-start rounded-xl bg-transparent px-3 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100",
                  membership.pool.slug === currentSlug &&
                    "bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
                )}
              >
                {membership.pool.name}
              </Button>
            </form>
          ))}
          <Link
            href="/pools/new"
            className="mt-1 flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {t(locale, "pools.create")}
          </Link>
        </div>
      </details>
      {current ? (
        <Link
          href={`/pools/${current.pool.slug}/settings`}
          className="mt-3 flex h-10 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          {t(locale, "pools.details")}
        </Link>
      ) : null}
    </div>
  );
}
