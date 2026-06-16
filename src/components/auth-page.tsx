import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/button";
import { PendingForm } from "@/components/pending-form";
import { Card, Input, Label } from "@/components/ui";

export function AuthPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
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
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">
                {title}
              </h1>
              <p className="mt-4 leading-7 text-zinc-300">{description}</p>
            </div>
            <div className="mt-10 rounded-2xl bg-white/10 p-4 text-sm text-zinc-200">
              Predictions lock before kickoff. Only final scores count.
            </div>
          </Card>

          {children}
        </div>
      </div>
    </main>
  );
}

export function EmailAuthForm({
  title,
  action,
  next,
  includeName = false,
  submitLabel,
  pendingLabel,
  footer,
}: {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  next: string;
  includeName?: boolean;
  submitLabel: string;
  pendingLabel: string;
  footer: React.ReactNode;
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
      <div className="mt-5 text-sm text-zinc-600">{footer}</div>
    </Card>
  );
}
