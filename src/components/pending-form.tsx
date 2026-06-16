"use client";

import {
  createContext,
  useActionState,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

type PendingFormContextValue = {
  pending: boolean;
};

const PendingFormContext = createContext<PendingFormContextValue>({
  pending: false,
});

export function usePendingFormStatus() {
  return useContext(PendingFormContext).pending;
}

type PendingFormProps = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

export function PendingForm({ action, children, ...props }: PendingFormProps) {
  const [, formAction, pending] = useActionState(
    async (_previousState: null, formData: FormData) => {
      await action(formData);
      return null;
    },
    null,
  );

  return (
    <PendingFormContext.Provider value={{ pending }}>
      <form action={formAction} {...props}>
        {children}
      </form>
    </PendingFormContext.Provider>
  );
}

type PendingGetFormProps = Omit<ComponentProps<"form">, "method"> & {
  children: ReactNode;
  method?: "get";
};

export function PendingGetForm({
  children,
  method = "get",
  onSubmit,
  ...props
}: PendingGetFormProps) {
  const [pending, setPending] = useState(false);

  return (
    <PendingFormContext.Provider value={{ pending }}>
      <form
        {...props}
        method={method}
        onSubmit={(event) => {
          setPending(true);
          onSubmit?.(event);
        }}
      >
        {children}
      </form>
    </PendingFormContext.Provider>
  );
}
