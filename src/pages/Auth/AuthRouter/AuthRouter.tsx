// src/pages/Auth/AuthRouter/AuthRouter.tsx
/**
 * Auth router:
 * - Handles Google OAuth cookie callback via mode=oauth-success
 * - Falls back to normal auth pages (login/register/forgot/resend)
 */

import React, { useEffect } from "react";
import LoginPage from "../LoginPage";
import RegisterPage from "../RegisterPage";
import ForgotPassword from "../ForgotPasswordPage";
import ResendVerificationPage from "../ResendVerificationPage";
import { useAuth } from "@/context/useAuth";
import { useNavigate, Navigate, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8080";

export default function AuthRouter() {
  const { isAuthenticated, loading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "login";

  useEffect(() => {
    const status = new URLSearchParams(location.search).get("status");

    // Helper to refresh session from cookies and land on profile
    const finishAndGoProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          login(
            {
              name: data.username || data.name || "User",
              email: data.email,
              username: data.username || data.name || "user",
            },
            undefined
          );
          navigate("/profile", { replace: true });
        } else {
          navigate("/auth?mode=login", { replace: true });
        }
      } catch {
        navigate("/auth?mode=login", { replace: true });
      }
    };

    if (mode === "oauth-success") {
      finishAndGoProfile();
    }

    if (mode === "email-change" && status === "success") {
      // After confirming the link, server updated the email — refetch /me
      finishAndGoProfile();
    }
  }, [mode, location.search, login, navigate]);

  if (loading) return null;

  if (isAuthenticated && mode !== "oauth-success") {
    return <Navigate to="/profile" replace />;
  }

  switch (mode) {
    case "register":
      return <RegisterPage />;
    case "forgot":
      return <ForgotPassword />;
    case "resend":
      return <ResendVerificationPage />;
    case "login":
    default:
      return <LoginPage />;
  }
}
