// src/main.tsx
// ------------------------------------------------------------
// Entry point for the PenguinShift React application.
// Wraps the entire app with BrowserRouter, AuthProvider, and ToastProvider.
// ------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "@/components/ui/toast-provider"; //  Toast system wrapper

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Global Auth Context (manages user session + tokens) */}
      <AuthProvider>
        {/* Global Toast Provider (for success/error/info messages) */}
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
