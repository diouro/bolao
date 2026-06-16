import Link from "next/link";
import { loginWithEmail } from "@/app/login/actions";
import { AuthPage, EmailAuthForm } from "@/components/auth-page";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const next = params.next ?? "/dashboard";

  return (
    <AuthPage
      eyebrow={t(locale, "signin.eyebrow")}
      title={t(locale, "signin.title")}
      description={t(locale, "signin.description")}
      locale={locale}
    >
      <EmailAuthForm
        title={t(locale, "auth.signIn")}
        action={loginWithEmail}
        next={next}
        submitLabel={t(locale, "auth.signIn")}
        pendingLabel={t(locale, "auth.signingIn")}
        locale={locale}
        footer={
          <>
            {t(locale, "auth.new")}{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {t(locale, "auth.create")}
            </Link>
          </>
        }
      />
    </AuthPage>
  );
}
