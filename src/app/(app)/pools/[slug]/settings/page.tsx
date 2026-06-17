import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { CopyInviteLink } from "@/components/copy-invite-link";
import { Card } from "@/components/ui";
import {
  removePoolMember,
  setPoolMemberPaid,
} from "@/app/(app)/pools/[slug]/settings/actions";
import { requireProfile } from "@/lib/auth";
import { getPlatformBaseUrl } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getPoolBySlug, getUserPools } from "@/lib/pools/context";
import { getPoolInvitePath } from "@/lib/pools/crud";
import { getPoolMemberProfiles } from "@/lib/pools/members";

export const dynamic = "force-dynamic";

export default async function PoolSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireProfile();
  const locale = await getLocale();
  const pool = await getPoolBySlug(slug);

  if (!pool) {
    notFound();
  }

  const memberships = await getUserPools(profile.id);
  const membership = memberships.find((entry) => entry.pool.id === pool.id);

  if (!membership) {
    notFound();
  }

  const canManage = ["owner", "admin"].includes(membership.role);
  const members = await getPoolMemberProfiles(pool.id);
  const invitePath = getPoolInvitePath(pool);
  const inviteUrl = `${getPlatformBaseUrl()}${invitePath}`;

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "pools.details")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {pool.name}
        </h1>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            {t(locale, "pools.inviteLink")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {t(locale, "pools.inviteBody")}
          </p>
          <CopyInviteLink inviteUrl={inviteUrl} locale={locale} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            {t(locale, "pools.members")}
          </h2>
          <ul className="mt-4 divide-y divide-zinc-100">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {member.display_name ?? member.email}
                  </p>
                  <p className="text-sm text-zinc-500">{member.email}</p>
                </div>
                {canManage && member.id !== profile.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setPoolMemberPaid}>
                      <input type="hidden" name="poolSlug" value={pool.slug} />
                      <input type="hidden" name="userId" value={member.id} />
                      <input
                        type="hidden"
                        name="hasPaid"
                        value={member.has_paid ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        className="h-9 border border-zinc-200 bg-white px-3 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        {member.has_paid
                          ? t(locale, "pools.markUnpaid")
                          : t(locale, "pools.markPaid")}
                      </Button>
                    </form>
                    <form action={removePoolMember}>
                      <input type="hidden" name="poolSlug" value={pool.slug} />
                      <input type="hidden" name="userId" value={member.id} />
                      <Button
                        type="submit"
                        className="h-9 border border-rose-200 bg-rose-50 px-3 text-xs text-rose-700 hover:bg-rose-100"
                      >
                        {t(locale, "pools.removeMember")}
                      </Button>
                    </form>
                  </div>
                ) : member.has_paid ? (
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {t(locale, "common.paid")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Link
          href="/dashboard"
          className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {t(locale, "pools.backToDashboard")}
        </Link>
      </div>
    </>
  );
}
