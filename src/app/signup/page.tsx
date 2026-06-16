import Link from "next/link";
import { registerWithEmail } from "@/app/login/actions";
import { AuthPage, EmailAuthForm } from "@/components/auth-page";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <AuthPage
      eyebrow="Join your friends"
      title="Create your Bolão account."
      description="Register with email and password, then start predicting World Cup scores before each match locks."
    >
      <EmailAuthForm
        title="Create account"
        action={registerWithEmail}
        next={next}
        includeName
        submitLabel="Create account"
        pendingLabel="Creating account"
        footer={
          <>
            Already have an account?{" "}
            <Link
              href={`/signin?next=${encodeURIComponent(next)}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Sign in
            </Link>
          </>
        }
      />
    </AuthPage>
  );
}
