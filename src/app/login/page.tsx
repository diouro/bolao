import Link from "next/link";
import { Trophy } from "lucide-react";
import { loginWithEmail, registerWithEmail } from "@/app/login/actions";
import { Button } from "@/components/button";
import { PendingForm } from "@/components/pending-form";
import { Card, Input, Label } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-3 text-sm font-semibold text-zinc-700"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Trophy className="h-5 w-5" />
          </span>
          Back to Bolão
        </Link>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="flex flex-col justify-between bg-zinc-950 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Join your friends
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">
                Sign in and start predicting the World Cup.
              </h1>
              <p className="mt-4 leading-7 text-zinc-300">
                Use email and password to join the game. Registration is open
                for friends.
              </p>
            </div>
            <div className="mt-10 rounded-2xl bg-white/10 p-4 text-sm text-zinc-200">
              Predictions lock before kickoff. Only final scores count.
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <AuthForm
              title="Sign in"
              action={loginWithEmail}
              next={next}
              submitLabel="Sign in"
              pendingLabel="Signing in"
            />
            <AuthForm
              title="Create account"
              action={registerWithEmail}
              next={next}
              includeName
              submitLabel="Create account"
              pendingLabel="Creating account"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function AuthForm({
  title,
  action,
  next,
  includeName = false,
  submitLabel,
  pendingLabel,
}: {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  next: string;
  includeName?: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
      <PendingForm action={action} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />
        {includeName && (
          <div>
            <Label htmlFor={`${title}-name`}>Display name</Label>
            <Input
              id={`${title}-name`}
              name="displayName"
              autoComplete="name"
              placeholder="Pedro"
            />
          </div>
        )}
        <div>
          <Label htmlFor={`${title}-email`}>Email</Label>
          <Input
            id={`${title}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor={`${title}-password`}>Password</Label>
          <Input
            id={`${title}-password`}
            name="password"
            type="password"
            autoComplete={includeName ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </div>
        <Button className="w-full" pendingChildren={pendingLabel}>
          {submitLabel}
        </Button>
      </PendingForm>
    </Card>
  );
}
