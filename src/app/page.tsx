import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const locale = await getLocale();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_35%),linear-gradient(135deg,#f8fafc,#f4f4f5)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t(locale, "app.worldCup")}
              </p>
              <h1 className="text-lg font-bold text-zinc-950">Bolão</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} compact />
            <Link href="/signup">
              <Button>{t(locale, "landing.cta")}</Button>
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              {t(locale, "landing.eyebrow")}
            </div>
            <h2 className="max-w-3xl text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl">
              {t(locale, "landing.hero")}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              {t(locale, "landing.sub")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                  {t(locale, "landing.start")}
                </Button>
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                {t(locale, "landing.leaderboard")}
              </Link>
            </div>
          </div>

          <Card className="bg-white/90 p-5">
            <div className="rounded-2xl bg-zinc-950 p-5 text-white">
              <p className="text-sm font-medium text-emerald-300">
                {t(locale, "landing.featured")}
              </p>
              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <TeamPreview flag="🇧🇷" name="Brazil" />
                <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
                  2 - 1
                </div>
                <TeamPreview flag="🇲🇦" name="Morocco" align="right" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Feature
                icon={<Trophy className="h-4 w-4" />}
                title={t(locale, "landing.feature1.title")}
                text={t(locale, "landing.feature1.text")}
              />
              <Feature
                icon={<BarChart3 className="h-4 w-4" />}
                title={t(locale, "landing.feature2.title")}
                text={t(locale, "landing.feature2.text")}
              />
              <Feature
                icon={<Users className="h-4 w-4" />}
                title={t(locale, "landing.feature3.title")}
                text={t(locale, "landing.feature3.text")}
              />
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function TeamPreview({
  flag,
  name,
  align = "left",
}: {
  flag: string;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="text-4xl">{flag}</div>
      <div className="mt-2 font-semibold">{name}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>
      <h3 className="font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  );
}
