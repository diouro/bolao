"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearSingleMention } from "@/app/(app)/mentions/actions";
import type { MentionSource } from "@/lib/mentions";

export function MentionLink({
  href,
  source,
  sourceId,
  children,
}: {
  href: string;
  source: MentionSource;
  sourceId: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={async (event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        await clearSingleMention({ source, sourceId });
        router.push(href);
      }}
    >
      {children}
    </Link>
  );
}
