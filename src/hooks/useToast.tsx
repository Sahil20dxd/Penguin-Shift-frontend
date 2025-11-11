// src/hooks/useToast.tsx
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";

/**
 * Custom hook that exposes helper methods to show success/error/info/warning toasts.
 */
export function useToast() {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [variant, setVariant] = React.useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToast = (
    msg: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setMessage(msg);
    setVariant(type);
    setOpen(true);
  };

  

  const background =
    variant === "success"
      ? "bg-green-600"
      : variant === "error"
      ? "bg-red-600"
      : variant === "warning"
      ? "bg-amber-500"
      : "bg-indigo-600"; // info

  const Toast = (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      className={`relative rounded-lg px-4 py-3 text-white shadow-lg ${background}`}
    >
      <ToastPrimitive.Title className="font-medium">
        {message}
      </ToastPrimitive.Title>
      <ToastPrimitive.Close
        className="absolute top-2 right-3 text-white/80 hover:text-white"
        aria-label="Close"
      >
        ×
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );

  return { showToast, Toast };
}
