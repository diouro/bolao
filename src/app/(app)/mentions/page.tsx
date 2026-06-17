import { Bell } from "lucide-react";
import { clearAllMentions } from "@/app/(app)/mentions/actions";
import { Button } from "@/components/button";
import { MentionLink } from "@/components/mention-link";
import { Badge, Card } from "@/components/ui";
import { formatAppDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getMentionLogs } from "@/lib/mentions";
import { getMentionHandle } from "@/lib/profiles";
import { requireAppContext } from "@/lib/pools/context";

export const dynamic = "force-dynamic";

export default async function MentionsPage() {
  const { profile, poolId } = await requireAppContext();
  const locale = await getLocale();
  const mentions = await getMentionLogs(profile, poolId);
  const handle = getMentionHandle(profile);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {t(locale, "app.mentions")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
            {t(locale, "mentions.title")}
          </h1>
        </div>
        {mentions.length > 0 && (
          <form action={clearAllMentions}>
            <Button
              className="h-10 border border-zinc-200 bg-white px-4 text-zinc-700 hover:bg-zinc-50"
              pendingChildren={t(locale, "mentions.clearing")}
            >
              {t(locale, "mentions.clearAll")}
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-4">
        {mentions.length > 0 ? (
          mentions.map((mention) => (
            <MentionLink
              key={`${mention.source}-${mention.id}`}
              href={mention.href}
              source={mention.source}
              sourceId={mention.id}
            >
              <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          mention.source === "chat"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700"
                        }
                      >
                        {mention.source === "chat"
                          ? t(locale, "app.chat")
                          : t(locale, "mentions.matchComment")}
                      </Badge>
                      <span className="text-sm font-bold text-zinc-950">
                        {mention.sourceLabel}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-500">
                      {mention.author_name ??
                        mention.author_email ??
                        t(locale, "common.friend")}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
                      {mention.body}
                    </p>
                  </div>
                  <time className="shrink-0 text-sm font-semibold text-zinc-400">
                    {formatAppDateTime(mention.created_at)}
                  </time>
                </div>
              </Card>
            </MentionLink>
          ))
        ) : (
          <Card className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Bell className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-zinc-950">
              {t(locale, "mentions.empty.title")}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {t(locale, "mentions.empty.body", { handle })}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
