// src/pages/Auth/ResendVerificationPage.tsx
// ---------------------------------------------------------
// Resend verification email page with friendly feedback,
// calm tone, toast notifications, and 10s redirect to login.
// ---------------------------------------------------------

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";

export default function ResendVerificationPage() {
  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get("email") || "";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const navigate = useNavigate();
  const { showToast, Toast } = useToast();

  // Pre-fill email if query param provided
  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  // Handle resend request
  const handleResend = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8080/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const msg =
          data.message ||
          "A new verification link has been sent to your inbox. Please check your email.";
        setMessage(msg);
        showToast("Verification email sent successfully.", "success");
        setSent(true);
      } else if (response.status === 404) {
        const msg = "We couldn’t find an account with that email address.";
        setError(msg);
        showToast(msg, "error");
      } else {
        const msg =
          data.error ||
          "Something went wrong while sending the verification email. Please try again.";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Resend verification failed:", err);
      setError(
        "We couldn’t connect to the server. Please check your connection."
      );
      showToast("Network error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect to login after success
  useEffect(() => {
    if (!sent) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/auth?mode=login");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sent, navigate]);

  // Render UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-lg font-semibold text-gray-800">
              {sent ? "Email Sent!" : "Resend Verification Email"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {sent ? (
              // Success view
              <div className="text-center space-y-3">
                <p className="text-green-700 text-sm">
                  A new verification link has been sent to your email. Please
                  check your inbox (and spam folder).
                </p>
                <p className="text-gray-500 text-xs">
                  Redirecting to login in {countdown} seconds...
                </p>
                <Button
                  onClick={() => navigate("/auth?mode=login")}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              // Resend form
              <>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}
                {message && (
                  <p className="text-green-600 text-sm text-center">
                    {message}
                  </p>
                )}

                <Button
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Resend Email
                    </>
                  )}
                </Button>

                <div className="mt-2 text-center">
                  <button
                    onClick={() => navigate("/auth?mode=register")}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Back to Register
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Toast container */}
      {Toast}
    </div>
  );
}
