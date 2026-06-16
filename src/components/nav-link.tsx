"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  active,
  className,
  children,
}: {
  href: string;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = active ?? isNavActive(href, pathname);

  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        isActive
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <NavLinkContent>{children}</NavLinkContent>
    </Link>
  );
}

export function MobileNavLink({
  href,
  active,
  className,
  children,
}: {
  href: string;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = active ?? isNavActive(href, pathname);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition",
        isActive
          ? "text-emerald-700"
          : "text-zinc-500 hover:text-zinc-950",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <NavLinkContent className="flex flex-col items-center gap-1">
        {children}
      </NavLinkContent>
    </Link>
  );
}

function NavLinkContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "flex w-full min-w-0 items-center gap-3",
        className,
        pending && "opacity-60",
      )}
    >
      {children}
    </span>
  );
}

function isNavActive(href: string, pathname: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
