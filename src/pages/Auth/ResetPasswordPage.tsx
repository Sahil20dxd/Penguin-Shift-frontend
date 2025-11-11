// src/pages/Auth/ResetPasswordPage.tsx
// --------------------------------------------------------------
// Handles password reset using token passed in the URL.
// Provides friendly messages for success, errors, and validation.
// --------------------------------------------------------------
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const { showToast, Toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      showToast("This reset link is invalid or missing.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match. Please try again.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.ok) {
        showToast("Your password has been reset successfully!", "success");
        setTimeout(() => (window.location.href = "/auth?mode=login"), 1500);
      } else if (res.status === 400 || res.status === 401) {
        showToast(
          "This reset link has expired. Please request a new one.",
          "error"
        );
      } else {
        showToast("Something went wrong. Please try again later.", "error");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      showToast(
        "We couldn’t connect to the server. Please check your connection.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please enter a new password for your account.
        </p>

        <input
          type="password"
          placeholder="New password"
          required
          className="mb-4 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          required
          className="mb-6 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 disabled:opacity-60"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>

        <div className="mt-4 text-center">
          <a
            href="/auth?mode=login"
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </a>
        </div>

        {Toast}
      </form>
    </div>
  );
}
