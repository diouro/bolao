import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireAppContext } from "@/lib/pools/context";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, pool, poolId, membership, memberships } = await requireAppContext();

  return (
    <AppShell
      profile={profile}
      pool={pool}
      poolId={poolId}
      membership={membership}
      memberships={memberships}
    >
      {children}
    </AppShell>
  );
}
