import Link from "next/link";
import { Trophy, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";

export default function Home() {
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
                World Cup
              </p>
              <h1 className="text-lg font-bold text-zinc-950">Bolão</h1>
            </div>
          </div>
          <Link href="/login">
            <Button>Join the game</Button>
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              Friends, predictions, flags, and bragging rights.
            </div>
            <h2 className="max-w-3xl text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl">
              Pick the scores. Climb the table. No money involved.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Sign in with Google or email, predict every World Cup score, and
              see who in the group is reading the tournament best. The game is
              score-only for now: no cards, scorers, corners, or betting.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                  Start predicting
                </Button>
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                See leaderboard
              </Link>
            </div>
          </div>

          <Card className="bg-white/90 p-5">
            <div className="rounded-2xl bg-zinc-950 p-5 text-white">
              <p className="text-sm font-medium text-emerald-300">
                Featured match
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
                title="Score ranking"
                text="Exact scores and correct outcomes drive the table."
              />
              <Feature
                icon={<BarChart3 className="h-4 w-4" />}
                title="Fun stats"
                text="Streaks, accuracy, bold picks, and head-to-heads."
              />
              <Feature
                icon={<Users className="h-4 w-4" />}
                title="Open signup"
                text="Friends can join directly with Google or email."
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
