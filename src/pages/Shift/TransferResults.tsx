// src/pages/Shift/TransferResults.tsx
// --------------------------------------------------------------------
// Shows transfer progress and results; handles downloads. Typed safely.
// --------------------------------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  Download,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { useShift } from "@/components/shift/ShiftContext";
import {
  getTransferStatus,
  downloadFile,
  downloadUnmatched,
} from "@/components/shift/apiClient";

// Result type
type TransferResult = {
  transferId: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress?: {
    percent: number;
    processed: number;
    total: number;
    phase: string;
  };
  summary?: {
    matched: number;
    unmatched: number;
    destinationPlaylistId?: string;
  };
};

export default function TransferResults() {
  const navigate = useNavigate();
  const { transferId, resetState } = useShift();
  const { showToast } = useToast();

  const [transfer, setTransfer] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollHandle = useRef<number | null>(null);

  if (transferId == null) {
    navigate(createPageUrl("SelectPlaylist"));
    return null;
  }
  const transferIdNum: number = transferId;

  // -------------------------------
  // Poll transfer status
  // -------------------------------
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = (await getTransferStatus(
          transferIdNum
        )) as TransferResult;
        setTransfer(result);

        if (result.status === "FAILED") {
          setError("Your playlist shift failed. Please try again.");
          showToast(
            "Your playlist shift failed. Please reconnect Spotify and try again.",
            "error"
          );
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }
        } else if (result.status === "COMPLETED") {
          showToast("Your playlist transfer finished successfully!", "success");
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }
        }
      } catch (err: any) {
        console.error("Error polling transfer status:", err);

        const msg = String(err?.message || "");

        // --- Detect expired Spotify token or auth error ---
        if (
          msg.includes("401") ||
          msg.toLowerCase().includes("spotify authorization") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          // clear any stale tokens
          localStorage.removeItem("authToken");
          localStorage.removeItem("jwt");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("jwt");

          setError(
            "Your Spotify connection has expired. Please reconnect your account."
          );
          showToast(
            "Your Spotify connection expired. Please reconnect.",
            "error"
          );

          // stop polling
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }

          // redirect user to reconnect page
          navigate(createPageUrl("Reconnect"));
          return;
        }

        // --- Generic network or unknown error fallback ---
        setError(
          "We couldn’t update your transfer status. Please check your connection or try again shortly."
        );
        if (pollHandle.current) {
          clearInterval(pollHandle.current);
          pollHandle.current = null;
        }
      }
    };

    poll();

    // ⬇️ then keep polling
    pollHandle.current = window.setInterval(poll, 2000);

    return () => {
      cancelled = true;
      if (pollHandle.current) clearInterval(pollHandle.current);
    };
  }, [transferIdNum, showToast, navigate]);
  // -------------------------------
  // Handlers
  // -------------------------------
  const handleDownload = async (type: "csv" | "pdf") => {
    try {
      await downloadFile(transferIdNum, type);
    } catch (err) {
      console.error(`Error downloading ${type}:`, err);
      setError(
        `We couldn’t download the ${type.toUpperCase()} file right now. Please try again later.`
      );
    }
  };

  const handleDownloadUnmatched = async () => {
    try {
      await downloadUnmatched(transferIdNum);
    } catch (err) {
      console.error("Error downloading unmatched songs:", err);
      setError(
        "We couldn’t download the unmatched songs list right now. Please try again later."
      );
    }
  };

  const handleNewShift = () => {
    resetState();
    navigate(createPageUrl("SelectPlaylist"));
  };

  // -------------------------------
  // UI States
  // -------------------------------
  if (error && !transfer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Transfer Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleNewShift} variant="outline">
              Start New Transfer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  const isInProgress =
    transfer.status === "PENDING" || transfer.status === "RUNNING";
  const isCompleted = transfer.status === "COMPLETED";
  const isFailed = transfer.status === "FAILED";

  const banner =
    transfer.status === "FAILED" ? (
      <div
        role="alert"
        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
      >
        Your playlist shift failed. Please reconnect your Spotify account and
        try again.
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Reconnect"))}
          >
            Reconnect Spotify
          </Button>
        </div>
      </div>
    ) : transfer.status === "COMPLETED" ? (
      <div
        role="status"
        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
      >
        ✅ Your playlist transfer finished successfully.
        {transfer.summary && (
          <span className="ml-2">
            Matched {transfer.summary.matched} /{" "}
            {transfer.summary.matched + transfer.summary.unmatched} songs.
          </span>
        )}
      </div>
    ) : null;

  // -------------------------------
  // Main render
  // -------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isInProgress
              ? "Transfer in Progress"
              : isCompleted
              ? "Transfer Complete"
              : "Transfer Failed"}
          </h1>
          <p className="text-gray-600">
            {isInProgress
              ? "Your playlists are being transferred..."
              : "Transfer Summary & Results"}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {banner}
          {transfer.status === "FAILED" && (
            <div
              role="alert"
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {" "}
              Your playlist shift failed. Please reconnect your Spotify account
              and try again.{" "}
              <div className="mt-3">
                {" "}
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Reconnect"))}
                >
                  {" "}
                  Reconnect Spotify{" "}
                </Button>{" "}
              </div>{" "}
            </div>
          )}

          {isInProgress && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <div>
                    <p className="font-semibold text-lg">
                      {transfer.progress?.phase || "Processing"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transfer.progress?.processed || 0} of{" "}
                      {transfer.progress?.total || 0} songs
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${transfer.progress?.percent || 0}%` }}
                />
              </div>
              <p className="text-center text-gray-600 text-sm">
                {transfer.progress?.percent || 0}% complete
              </p>
            </>
          )}

          {isCompleted && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎵</div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-4xl">🎬</div>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              {transfer.summary && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-xl font-semibold mb-2">
                      Transfer Complete
                    </p>
                    <p className="text-gray-600">
                      {transfer.summary.matched + transfer.summary.unmatched}{" "}
                      Songs
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {transfer.summary.matched}
                      </p>
                      <p className="text-sm text-gray-600">Matched</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">
                        {transfer.summary.unmatched}
                      </p>
                      <p className="text-sm text-gray-600">Unmatched</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {transfer.summary.matched + transfer.summary.unmatched}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload("csv")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload("pdf")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    {transfer.summary.unmatched > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleDownloadUnmatched}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Unmatched Songs
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            onClick={handleNewShift}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            New Transfer
          </Button>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
