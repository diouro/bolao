"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  getSelectedCategoryFromSearchParam,
  groupOrder,
  knockoutRoundOrder,
} from "@/lib/tournament/fixture-categories";
import { cn } from "@/lib/utils";

const roundLabelKeys: Record<(typeof knockoutRoundOrder)[number], TranslationKey> =
  {
    round_of_32: "round.round_of_32",
    round_of_16: "round.round_of_16",
    quarter_final: "round.quarter_final",
    semi_final: "round.semi_final",
    third_place: "round.third_place",
    final: "round.final",
  };

export function FixtureNavigation({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const selectedCategory = getSelectedCategoryFromSearchParam(
    searchParams.get("group") ?? undefined,
  );

  return (
    <Card className="sticky top-4 z-10 p-3">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1">
        {groupOrder.map((group) => (
          <FixtureNavLink
            key={group}
            href={`/predictions?group=${group}`}
            locale={locale}
            selected={selectedCategory === group}
          >
            {t(locale, "common.group")} {group}
          </FixtureNavLink>
        ))}
        <div className="mx-1 h-10 w-px shrink-0 bg-zinc-200" />
        {knockoutRoundOrder.map((round) => (
          <FixtureNavLink
            key={round}
            href={`/predictions?group=${round}`}
            locale={locale}
            selected={selectedCategory === round}
            knockout
          >
            {t(locale, roundLabelKeys[round])}
          </FixtureNavLink>
        ))}
      </div>
    </Card>
  );
}

function FixtureNavLink({
  href,
  locale,
  selected,
  knockout = false,
  children,
}: {
  href: string;
  locale: Locale;
  selected: boolean;
  knockout?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100",
        selected &&
          (knockout
            ? "bg-zinc-950 text-white hover:bg-zinc-950"
            : "bg-emerald-600 text-white hover:bg-emerald-600"),
      )}
      aria-current={selected ? "page" : undefined}
    >
      <FixtureNavLinkContent locale={locale}>{children}</FixtureNavLinkContent>
    </Link>
  );
}

function FixtureNavLinkContent({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn("inline-flex items-center gap-2", pending && "opacity-60")}
      aria-busy={pending || undefined}
    >
      {children}
      {pending && (
        <span className="sr-only">{t(locale, "common.loading")}</span>
      )}
    </span>
  );
}
