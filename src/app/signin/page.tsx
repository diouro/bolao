import Link from "next/link";
import { loginWithEmail } from "@/app/login/actions";
import { AuthPage, EmailAuthForm } from "@/components/auth-page";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <AuthPage
      eyebrow="Welcome back"
      title="Sign in and keep your World Cup picks moving."
      description="Use your email and password to get back to your predictions, ranking, and stats."
    >
      <EmailAuthForm
        title="Sign in"
        action={loginWithEmail}
        next={next}
        submitLabel="Sign in"
        pendingLabel="Signing in"
        footer={
          <>
            New to Bolão?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Create an account
            </Link>
          </>
        }
      />
    </AuthPage>
  );
}
