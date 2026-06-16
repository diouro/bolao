import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Check, ListChecks, LogOut, Shield, Trophy } from "lucide-react";
import { logout } from "@/app/actions";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: ListChecks },
  { key: "predictions", label: "Predictions", href: "/predictions", icon: Trophy },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
  { key: "breakdown", label: "Breakdown", href: "/breakdown", icon: ListChecks },
  { key: "stats", label: "Stats", href: "/stats", icon: BarChart3 },
];

export function AppShell({
  profile,
  active,
  children,
}: {
  profile: Profile;
  active:
    | "dashboard"
    | "predictions"
    | "leaderboard"
    | "breakdown"
    | "stats"
    | "admin";
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-zinc-200 bg-white lg:flex lg:flex-col">
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
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              href={item.href}
              active={active === item.key}
              icon={<item.icon className="h-4 w-4" />}
            >
              {item.label}
            </NavItem>
          ))}
          {profile.role === "admin" && (
            <NavItem
              href="/admin/results"
              active={active === "admin"}
              icon={<Shield className="h-4 w-4" />}
            >
              Results admin
            </NavItem>
          )}
        </nav>
        <div className="border-t border-zinc-200 p-4">
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
              pendingChildren="Logging out"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <section className="pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-zinc-950">Bolão</p>
                  {profile.has_paid && <PaidBadge />}
                </div>
                <p className="text-xs text-zinc-500">{profile.email}</p>
              </div>
            </div>
            <form action={logout}>
              <input type="hidden" name="redirectTo" value="/signin" />
              <Button
                className="h-10 w-10 border border-zinc-200 bg-white p-0 text-zinc-700 hover:bg-zinc-50"
                pendingChildren={<span className="sr-only">Logging out</span>}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-zinc-500",
              active === item.key && "text-emerald-700",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
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
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950",
        active && "bg-emerald-50 text-emerald-700",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
