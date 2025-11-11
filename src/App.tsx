// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import MyProfile from "./pages/Profile/MyProfile";
import LoginPage from "./pages/Auth/LoginPage";
import Layout from "./Layout";
import Landing from "./pages/LandingPage/LandingPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ContactPage from "./pages/Contact/ContactPage";
import AuthRouter from "./pages/Auth/AuthRouter/AuthRouter";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyEmailPage from "./pages/Auth/VerifyEmailPage";
import ResendVerificationPage from "./pages/Auth/ResendVerificationPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import { useToast } from "@/hooks/useToast";
import * as RadixToast from "@radix-ui/react-toast";

// Shift pages
import SelectPlaylist from "@/pages/Shift/SelectPlaylist";
import SelectDestination from "@/pages/Shift/SelectDestination";
import TransferResults from "@/pages/Shift/TransferResults";

// Context
import { ShiftProvider } from "@/components/shift/ShiftContext";

export default function App() {
  // Mount the UI component once
  const { Toast: ToastUI } = useToast();

  return (
    <RadixToast.Provider swipeDirection="right" duration={3500}>
      <ShiftProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Layout currentPageName="LandingPage">
                <Landing />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout currentPageName="Auth">
                <LoginPage />
              </Layout>
            }
          />
          <Route
            path="/auth"
            element={
              <Layout currentPageName="Auth">
                <AuthRouter />
              </Layout>
            }
          />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/auth/resend-verification"
            element={
              <Layout currentPageName="Auth">
                <ResendVerificationPage />
              </Layout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Layout currentPageName="Auth">
                <ResetPasswordPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Profile">
                  <MyProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Dashboard">
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Shift flow */}
          <Route
            path="/shift/select"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Shift">
                  <SelectPlaylist />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shift/destination"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Shift">
                  <SelectDestination />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shift/results"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Shift">
                  <TransferResults />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ShiftProvider>
      {/* Render the element (NOT <ToastUI />) */}
      {ToastUI}

      {/* Radix viewport (where toasts are placed) */}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] w-[360px] max-w-[90vw] outline-none" />
    </RadixToast.Provider>
  );
}
