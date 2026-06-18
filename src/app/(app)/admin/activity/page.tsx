import Link from "next/link";
import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatAppDateTime } from "@/lib/dates";
import {
  FRIENDS_ACTIVITY_PAGE_SIZE,
  getFriendsActivity,
  type FriendsActivityItem,
  type FriendsActivityKind,
} from "@/lib/friends-activity";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const kindLabelKeys: Record<FriendsActivityKind, TranslationKey> = {
  prediction: "admin.activity.prediction",
  prediction_updated: "admin.activity.predictionUpdated",
  chat: "admin.activity.chat",
  comment: "admin.activity.comment",
  joined: "admin.activity.joined",
};

const kindBadgeStyles: Record<FriendsActivityKind, string> = {
  prediction: "bg-emerald-50 text-emerald-700",
  prediction_updated: "bg-amber-50 text-amber-700",
  chat: "bg-sky-50 text-sky-700",
  comment: "bg-zinc-100 text-zinc-700",
  joined: "bg-violet-50 text-violet-700",
};

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const locale = await getLocale();
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { activities, total, totalPages } = await getFriendsActivity(profile.id, {
    page,
    pageSize: FRIENDS_ACTIVITY_PAGE_SIZE,
    locale,
  });
  const rangeStart = total === 0 ? 0 : (page - 1) * FRIENDS_ACTIVITY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * FRIENDS_ACTIVITY_PAGE_SIZE, total);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "admin.activity.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "admin.activity.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          {t(locale, "admin.activity.subtitle")}
        </p>
      </div>

      {total > 0 && (
        <p className="mb-4 text-sm font-medium text-zinc-500">
          {t(locale, "admin.activity.showing", {
            from: String(rangeStart),
            to: String(rangeEnd),
            total: String(total),
          })}
        </p>
      )}

      <div className="grid gap-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              locale={locale}
            />
          ))
        ) : (
          <Card className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Activity className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-zinc-950">
              {t(locale, "admin.activity.empty.title")}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {t(locale, "admin.activity.empty.body")}
            </p>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <ActivityPagination
          locale={locale}
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  );
}

function ActivityPagination({
  locale,
  page,
  totalPages,
}: {
  locale: Locale;
  page: number;
  totalPages: number;
}) {
  const pages = getPaginationPages(page, totalPages);

  return (
    <nav
      className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={t(locale, "admin.activity.pagination")}
    >
      <p className="text-sm font-semibold text-zinc-500">
        {t(locale, "admin.activity.page", {
          page: String(page),
          totalPages: String(totalPages),
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <PaginationLink href={`/admin/activity?page=${page - 1}`}>
            {t(locale, "admin.activity.previous")}
          </PaginationLink>
        ) : (
          <PaginationLink disabled>{t(locale, "admin.activity.previous")}</PaginationLink>
        )}
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm font-semibold text-zinc-400"
            >
              ...
            </span>
          ) : (
            <PaginationLink
              key={item}
              href={`/admin/activity?page=${item}`}
              active={item === page}
            >
              {item}
            </PaginationLink>
          ),
        )}
        {page < totalPages ? (
          <PaginationLink href={`/admin/activity?page=${page + 1}`}>
            {t(locale, "admin.activity.next")}
          </PaginationLink>
        ) : (
          <PaginationLink disabled>{t(locale, "admin.activity.next")}</PaginationLink>
        )}
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  active = false,
  disabled = false,
  children,
}: {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition",
    active
      ? "border-emerald-600 bg-emerald-600 text-white"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
    disabled && "pointer-events-none opacity-40",
  );

  if (!href || disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function getPaginationPages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

function ActivityCard({
  activity,
  locale,
}: {
  activity: FriendsActivityItem;
  locale: Locale;
}) {
  const authorLabel =
    activity.authorName ?? activity.authorEmail ?? t(locale, "common.friend");
  const body = getActivityBody(activity, locale, authorLabel);

  return (
    <Link href={activity.href} className="block">
      <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className={kindBadgeStyles[activity.kind]}>
                {t(locale, kindLabelKeys[activity.kind])}
              </Badge>
              {activity.context && (
                <span className="text-sm font-bold text-zinc-950">
                  {activity.context}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-500">{authorLabel}</p>
            {body && (
              <p
                className={cn(
                  "mt-2 text-sm leading-6 text-zinc-700",
                  activity.kind === "chat" || activity.kind === "comment"
                    ? "whitespace-pre-wrap break-words"
                    : "font-black text-zinc-950",
                )}
              >
                {body}
              </p>
            )}
          </div>
          <time className="shrink-0 text-sm font-semibold text-zinc-400">
            {formatAppDateTime(activity.occurredAt)}
          </time>
        </div>
      </Card>
    </Link>
  );
}

function getActivityBody(
  activity: FriendsActivityItem,
  locale: Locale,
  authorLabel: string,
) {
  if (activity.kind === "joined") {
    return t(locale, "admin.activity.joinedBody", { name: authorLabel });
  }

  if (
    activity.kind === "prediction" ||
    activity.kind === "prediction_updated"
  ) {
    return t(locale, "admin.activity.predictionBody", {
      score: activity.body,
    });
  }

  return activity.body;
}
