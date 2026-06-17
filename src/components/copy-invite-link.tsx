"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { t, type Locale } from "@/lib/i18n";

export function CopyInviteLink({
  inviteUrl,
  locale,
}: {
  inviteUrl: string;
  locale: Locale;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <code className="flex-1 overflow-x-auto rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-800">
        {inviteUrl}
      </code>
      <Button
        type="button"
        onClick={copy}
        className="h-auto shrink-0 border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 sm:py-0"
      >
        {copied ? t(locale, "pools.copied") : t(locale, "pools.copyLink")}
      </Button>
    </div>
  );
}
