// src/pages/Auth/ForgotPasswordPage.tsx
// --------------------------------------------------------------
// Sends password reset link to user's email with friendly feedback.
// Consistent with other auth pages: calm tone, clear UX, and loading state.
// --------------------------------------------------------------

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, Toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast("Please enter your email address.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        showToast(
          "A password reset link has been sent to your email. Please check your inbox (and spam folder).",
          "success"
        );
        setEmail("");
      } else if (res.status === 404) {
        showToast(
          "We couldn’t find an account with that email address.",
          "warning"
        );
      } else if (res.status === 429) {
        const retryAfter = data?.retryAfterSec ?? 60;
        showToast(
          `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
          "warning"
        );
      } else {
        showToast(
          data?.error || "Something went wrong. Please try again later.",
          "error"
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      showToast(
        "We couldn’t connect to the server. Please check your internet connection.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your registered email address, and we’ll send you a link to
          reset your password.
        </p>

        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 disabled:opacity-60"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>

        <div className="mt-4 text-center text-sm">
          <a href="/auth?mode=login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>

        {Toast}
      </form>
    </div>
  );
}
