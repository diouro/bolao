import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { clearAllMentions } from "@/app/(app)/mentions/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/button";
import { MentionLink } from "@/components/mention-link";
import { Badge, Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { formatAppDateTime } from "@/lib/dates";
import { getMentionLogs } from "@/lib/mentions";
import { getMentionHandle } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function MentionsPage() {
  const profile = await requireProfile();
  const mentions = await getMentionLogs(profile);
  const handle = getMentionHandle(profile);

  return (
    <AppShell profile={profile} active="mentions">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Mentions
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
            Unread mentions
          </h1>
        </div>
        {mentions.length > 0 && (
          <form action={clearAllMentions}>
            <Button
              className="h-10 border border-zinc-200 bg-white px-4 text-zinc-700 hover:bg-zinc-50"
              pendingChildren="Clearing"
            >
              Clear all
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
                        {mention.source === "chat" ? "Chat" : "Match comment"}
                      </Badge>
                      <span className="text-sm font-bold text-zinc-950">
                        {mention.sourceLabel}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-500">
                      {mention.author_name ?? mention.author_email ?? "Friend"}
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
              No unread mentions.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              When someone tags @{handle} in chat or match comments, it will show
              here until you open or clear it.
            </p>
            <Link
              href="/chat"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Open chat
            </Link>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
