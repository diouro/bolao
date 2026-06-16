import Link from "next/link";
import { registerWithEmail } from "@/app/login/actions";
import { AuthPage, EmailAuthForm } from "@/components/auth-page";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const next = params.next ?? "/dashboard";

  return (
    <AuthPage
      eyebrow={t(locale, "signup.eyebrow")}
      title={t(locale, "signup.title")}
      description={t(locale, "signup.description")}
      locale={locale}
    >
      <EmailAuthForm
        title={t(locale, "auth.create")}
        action={registerWithEmail}
        next={next}
        includeName
        submitLabel={t(locale, "auth.create")}
        pendingLabel={t(locale, "auth.creating")}
        locale={locale}
        footer={
          <>
            {t(locale, "auth.already")}{" "}
            <Link
              href={`/signin?next=${encodeURIComponent(next)}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {t(locale, "auth.signIn")}
            </Link>
          </>
        }
      />
    </AuthPage>
  );
}
