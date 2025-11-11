// src/components/ui/toast-provider.tsx
import * as React from "react";
import {
  ToastProvider as Provider,
  ToastViewport,
} from "@radix-ui/react-toast";

/**
 * Global toast provider to wrap the entire app.
 * Ensures that all toast notifications render consistently.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider swipeDirection="right">
      {children}
      <ToastViewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
    </Provider>
  );
}
