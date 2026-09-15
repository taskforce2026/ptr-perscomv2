"use client";

import type { ReactNode } from "react";

export function FormConfirm({
  action,
  message,
  children,
}: {
  action?: (fd: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
