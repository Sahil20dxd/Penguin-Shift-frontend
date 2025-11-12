// src/pages/Auth/LoginPage.tsx
// --------------------------------------------------------------------
// Friendly login page using Cloudflare Turnstile verification.
// Handles server feedback, email verification redirects, and OAuth fallback.
// --------------------------------------------------------------------
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  loadTurnstile,
  renderTurnstile,
  getTurnstileToken,
  resetTurnstile,
} from "@/utils/security/turnstile";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  "https://penguinshift-production.up.railway.app";
const TURNSTILE_SITE_KEY =
  (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || "";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const { showToast, Toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Turnstile mount effect
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadTurnstile();
        if (mounted) await renderTurnstile("captcha-login");
      } catch {
        showToast(
          "We couldn’t load the verification widget. Please refresh the page.",
          "error"
        );
      }
    })();
    return () => {
      mounted = false;
      resetTurnstile();
    };
  }, [showToast]);

  // Handle OAuth redirect messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const reason = params.get("reason");
    const newEmail = params.get("newEmail");

    if (mode === "oauth-failed") {
      if (reason === "user-not-found") {
        showToast(
          "No account exists for that Google email. Please register first.",
          "warning"
        );
      } else if (reason === "email-moved" && newEmail) {
        showToast(
          "Your account email was changed to " +
            newEmail +
            ". Please log in with the new address.",
          "info"
        );
      } else {
        showToast("Google sign-in failed. Please try again.", "error");
      }
    }
  }, [location.search, showToast]);

  // Handle Login
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast("Please fill in both email/username and password.", "warning");
      return;
    }

    // still in src/pages/Auth/LoginPage.tsx inside handleLogin
    let captchaToken: string | null = "TEST_PASS";
    if (TURNSTILE_SITE_KEY) {
      captchaToken = getTurnstileToken();
      if (!captchaToken) {
        showToast("Please complete the verification first.", "warning");
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: identifier,
          password,
          rememberMe: remember,
          captchaToken,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        /* tolerate non-JSON */
      }

      if (res.ok) {
        const generatedUsername =
          data?.username ||
          identifier.trim().toLowerCase().replace(/\s+/g, "") ||
          "user" + Math.floor(Math.random() * 1000);

        login(
          {
            name: data?.username || identifier.trim(),
            email: data?.email || identifier.trim(),
            username: generatedUsername,
          },
          data?.accessToken
        );
        showToast("Welcome back! Login successful.", "success");
        resetTurnstile();
        navigate("/profile", { replace: true });
        return;
      }

      // Too many attempts / lockouts
      if (res.status === 429) {
        const retryAfter = data?.retryAfterSec ?? 60;
        showToast(
          `Too many attempts. Please wait ${retryAfter}s before trying again.`,
          "warning"
        );
        return;
      }

      if (res.status === 423) {
        const remaining = data?.retryAfterSec;
        showToast(
          remaining
            ? `Your account is temporarily locked. Try again in ${remaining}s.`
            : "Your account has been temporarily locked after multiple failed attempts.",
          "warning"
        );
        return;
      }

      // Authentication outcomes
      if (res.status === 401) {
        showToast("Incorrect email/username or password.", "error");
      } else if (res.status === 403) {
        showToast(
          data?.error || "Please verify your email before logging in.",
          "info"
        );
        setTimeout(() => {
          navigate(
            `/verify-email?status=pending&email=${encodeURIComponent(
              identifier.trim()
            )}`,
            { replace: true }
          );
        }, 1500);
      } else if (res.status === 404) {
        showToast(
          "No account found with this email or username. Please register.",
          "warning"
        );
      } else if (res.status === 400) {
        showToast(
          data?.error || "Please check your details and try again.",
          "warning"
        );
        resetTurnstile();
      } else {
        showToast(
          "Something went wrong while logging in. Please try again later.",
          "error"
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast(
        "We couldn’t connect to the server. Please check your connection.",
        "error"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">
          Login
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Access your account and keep your playlists in sync.
        </p>

        {/* Identifier */}
        <label className="block text-sm font-medium mb-1">
          Email or Username
        </label>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your email or username"
          className="mb-4 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
        />

        {/* Password */}
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="mb-4 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
        />

        {/* Remember me */}
        <label className="inline-flex items-center mb-4">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2"
          />
          Remember me
        </label>

        {/* Turnstile */}
        {TURNSTILE_SITE_KEY && <div id="captcha-login" className="mb-4"></div>}

        {/* Login */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600"
        >
          Login
        </Button>

        {/* Google login */}
        <Button
          type="button"
          onClick={() => {
            document.cookie =
              "PS_OAUTH_INTENT=login; Path=/; Max-Age=300; SameSite=Lax";
            window.location.assign(`${API_BASE}/oauth2/authorization/google`);
          }}
          className="mt-3 w-full border border-gray-300 bg-white text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50"
        >
          Login with Google
        </Button>

        {/* Links */}
        <div className="mt-4 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/auth?mode=register"
            className="text-blue-600 hover:underline"
          >
            Register now
          </Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link
            to="/auth?mode=forgot"
            className="text-blue-600 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        {Toast}
      </form>
    </div>
  );
}
