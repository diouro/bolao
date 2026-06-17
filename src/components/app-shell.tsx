import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  GitBranch,
  ListChecks,
  LogOut,
  MessageCircle,
  Shield,
  Trophy,
} from "lucide-react";
import { logout } from "@/app/actions";
import { Button } from "@/components/button";
import { ChatNavBadge } from "@/components/chat-nav-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MentionNavBadge } from "@/components/mention-nav-badge";
import { MobileNavLink, NavLink } from "@/components/nav-link";
import { getUnreadChatMessageCount } from "@/lib/chat";
import { t, type TranslationKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getMentionLogs } from "@/lib/mentions";
import { getMentionHandle } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

const navItems = [
  { key: "dashboard", labelKey: "app.dashboard", href: "/dashboard", icon: ListChecks },
  { key: "predictions", labelKey: "app.predictions", href: "/predictions", icon: Trophy },
  { key: "schedule", labelKey: "app.schedule", href: "/schedule", icon: CalendarDays },
  { key: "bracket", labelKey: "app.bracket", href: "/bracket", icon: GitBranch },
  { key: "leaderboard", labelKey: "app.leaderboard", href: "/leaderboard", icon: BarChart3 },
  { key: "breakdown", labelKey: "app.breakdown", href: "/breakdown", icon: ListChecks },
  { key: "chat", labelKey: "app.chat", href: "/chat", icon: MessageCircle },
  { key: "mentions", labelKey: "app.mentions", href: "/mentions", icon: Bell },
  { key: "stats", labelKey: "app.stats", href: "/stats", icon: BarChart3 },
];

const mobileNavItems = navItems.filter((item) => item.key !== "mentions");

export async function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const [mentionCount, chatUnreadCount] = await Promise.all([
    getMentionLogs(profile).then((logs) => logs.length),
    getUnreadChatMessageCount(profile.id),
  ]);
  const mentionHandle = getMentionHandle(profile);

  return (
    <main className="min-h-screen bg-zinc-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                World Cup
              </div>
              <div className="text-lg font-black text-zinc-950">Bolão</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              href={item.href}
              icon={<item.icon className="h-4 w-4" />}
              badge={
                item.key === "chat" ? (
                  <ChatNavBadge
                    key={`chat-desktop-${chatUnreadCount}`}
                    initialCount={chatUnreadCount}
                    currentUserId={profile.id}
                    channelKey="desktop"
                    className="ml-auto"
                  />
                ) : item.key === "mentions" ? (
                  <MentionNavBadge
                    initialCount={mentionCount}
                    handle={mentionHandle}
                    currentUserId={profile.id}
                  />
                ) : null
              }
            >
              {t(locale, item.labelKey as TranslationKey)}
            </NavItem>
          ))}
          {profile.role === "admin" && (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                {t(locale, "app.adminNav")}
              </p>
              <div className="space-y-1">
                <NavItem
                  href="/admin/results"
                  icon={<Shield className="h-4 w-4" />}
                >
                  {t(locale, "app.resultsAdmin")}
                </NavItem>
                <NavItem
                  href="/admin/activity"
                  icon={<Activity className="h-4 w-4" />}
                >
                  {t(locale, "app.activityAdmin")}
                </NavItem>
              </div>
            </div>
          )}
        </nav>
        <div className="border-t border-zinc-200 p-4">
          <div className="mb-4">
            <LanguageSwitcher locale={locale} />
          </div>
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-zinc-950">
              {profile.display_name ?? profile.email}
            </p>
            {profile.has_paid && <PaidBadge />}
          </div>
          <p className="truncate text-xs text-zinc-500">{profile.email}</p>
          <form action={logout} className="mt-4">
            <input type="hidden" name="redirectTo" value="/signin" />
            <Button
              className="h-10 w-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              pendingChildren={t(locale, "app.loggingOut")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t(locale, "app.logout")}
            </Button>
          </form>
        </div>
      </aside>

      <section className="pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-zinc-950">Bolão</p>
                  {profile.has_paid && <PaidBadge />}
                </div>
                <p className="truncate text-xs text-zinc-500">{profile.email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher locale={locale} compact />
              <form action={logout}>
                <input type="hidden" name="redirectTo" value="/signin" />
                <Button
                  className="h-10 w-10 border border-zinc-200 bg-white p-0 text-zinc-700 hover:bg-zinc-50"
                  pendingChildren={<span className="sr-only">{t(locale, "app.loggingOut")}</span>}
                  aria-label={t(locale, "app.logout")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-zinc-200 bg-white lg:hidden">
        {mobileNavItems.map((item) => (
          <MobileNavLink
            key={item.key}
            href={item.href}
            className="min-w-[5.5rem] shrink-0 px-2"
          >
            <span className="relative">
              <item.icon className="h-4 w-4" />
              {item.key === "chat" && (
                <ChatNavBadge
                  key={`chat-mobile-${chatUnreadCount}`}
                  initialCount={chatUnreadCount}
                  currentUserId={profile.id}
                  channelKey="mobile"
                  className="absolute -right-3 -top-2 min-w-5 border-2 border-white px-1.5 py-0 text-[10px]"
                />
              )}
            </span>
            {t(locale, item.labelKey as TranslationKey)}
          </MobileNavLink>
        ))}
      </nav>
    </main>
  );
}

function PaidBadge() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
      title="Paid"
      aria-label="Paid"
    >
      <Check className="h-3 w-3" />
    </span>
  );
}

function NavItem({
  href,
  icon,
  badge,
  children,
}: {
  href: string;
  icon: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <NavLink href={href}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge}
    </NavLink>
  );
}
