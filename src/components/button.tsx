"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { usePendingFormStatus } from "@/components/pending-form";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingChildren?: ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function Button({
  children,
  pendingChildren,
  className,
  disabled,
  formAction,
  style,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const formPending = useFormStatus().pending;
  const contextPending = usePendingFormStatus();
  const pending =
    pendingChildren !== undefined && (contextPending || formPending);

  return (
    <button
      {...props}
      formAction={formAction}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      style={style}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-label={ariaLabel}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingChildren}
        </>
      ) : (
        children
      )}
    </button>
  );
}
