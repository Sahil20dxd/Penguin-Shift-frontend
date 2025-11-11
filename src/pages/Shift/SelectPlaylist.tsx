// src/pages/Shift/SelectPlaylist.tsx
// --------------------------------------------------------------------
// Select source platform, link OAuth, list playlists, and persist picks.
// Improvements:
// - Spinner fix (always stops via finally)
// - Robust OAuth polling with cleanup
// - Manual Refresh + Reconnect actions
// - Debounced search
// - Clearer error surfacing and state resets
// --------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // if you don’t have this, swap to a native input
import {
  Search,
  ArrowRight,
  Music2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PlugZap,
} from "lucide-react";
import { useShift } from "@/components/shift/ShiftContext";
import {
  checkLinkStatus,
  getLinkUrl,
  fetchPlaylists,
} from "@/components/shift/apiClient";

// platform union
type Platform = "spotify" | "youtube";

// minimal playlist shape used by UI
type SourcePlaylist = {
  id: string;
  name: string;
  platform: Platform;
  songCount: number;
  coverImage?: string;
};

type FetchResult = { items?: SourcePlaylist[] };

// simple debounce
function useDebouncedValue<T>(val: T, ms: number) {
  const [d, setD] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setD(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return d;
}

export default function SelectPlaylist() {
  const { sourcePlatform, selectedPlaylistIds, includeTracks, updateState } =
    useShift();

  const [localPlatform, setLocalPlatform] = useState<Platform>(
    sourcePlatform || "spotify"
  );
  const [isLinked, setIsLinked] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);

  const [playlists, setPlaylists] = useState<SourcePlaylist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 180);

  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // initial + on platform switch
  useEffect(() => {
    updateState({ sourcePlatform: localPlatform });
    void checkPlatformLink(localPlatform);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPlatform]);

  async function checkPlatformLink(platform: Platform) {
    setIsCheckingLink(true);
    setError(null);
    try {
      const resp = (await checkLinkStatus(platform)) as { linked: boolean };
      const linked = Boolean(resp?.linked);
      setIsLinked(linked);
      if (linked) {
        await loadPlaylists(platform);
      } else {
        setPlaylists([]);
      }
    } catch (err: any) {
      console.error("Link check failed:", err);
      setError(
        `We couldn’t verify your ${
          platform === "spotify" ? "Spotify" : "YouTube"
        } connection. Please reconnect your account.`
      );
      setIsLinked(false);
      setPlaylists([]);
    } finally {
      setIsCheckingLink(false);
    }
  }

  async function handlePlatformSwitch(platform: Platform) {
    // reset UI state on switch
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setLocalPlatform(platform);
    setIsLinked(false);
    setPlaylists([]);
    setExpandedPlaylist(null);
    setError(null);
    updateState({
      sourcePlatform: platform,
      selectedPlaylistIds: [],
      includeTracks: {},
    });
  }

  async function handleLinkPlatform() {
    setError(null);
    try {
      const resp = (await getLinkUrl(localPlatform)) as { url: string };
      const url = resp?.url;
      if (!url) {
        setError("Failed to create authorization URL.");
        return;
      }

      const popup = window.open(
        url,
        "oauth",
        "width=600,height=700,scrollbars=yes"
      );
      if (!popup) {
        setError("Popup blocked. Please allow popups for this site.");
        return;
      }

      // clear any prior poll
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        if (popup.closed) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          await checkPlatformLink(localPlatform);
          return;
        }
        try {
          const status = (await checkLinkStatus(localPlatform)) as {
            linked: boolean;
          };
          if (status?.linked) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            try {
              popup.close();
            } catch {}
            setIsLinked(true);
            await loadPlaylists(localPlatform);
          }
        } catch {
          // ignore transient polling errors
        }
      }, 1200) as unknown as number;

      window.setTimeout(() => {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (!popup.closed) {
          try {
            popup.close();
          } catch {}
          setError("OAuth connection timed out. Please try again.");
        }
      }, 120000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("OAuth connection failed:", err);
      setError(
        `Unable to connect to ${
          localPlatform === "spotify" ? "Spotify" : "YouTube Music"
        }. Please try again.`
      );
    }
  }

  async function loadPlaylists(platform: Platform) {
    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const data = (await fetchPlaylists(platform)) as FetchResult;
      setPlaylists(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("401")) {
        setError(
          "Failed to load playlists from " +
            platform +
            ": authorization expired. Please reconnect your " +
            platform +
            " account and try again."
        );
      } else {
        setError("Failed to load playlists from " + platform + ": " + msg);
      }
      setPlaylists([]);
    } finally {
      // critical: always stop spinner
      setIsLoadingPlaylists(false);
    }
  }

  function handleTogglePlaylist(playlistId: string) {
    const newSelected = selectedPlaylistIds.includes(playlistId)
      ? selectedPlaylistIds.filter((id) => id !== playlistId)
      : [...selectedPlaylistIds, playlistId];

    const newInclude = { ...includeTracks };
    if (newSelected.includes(playlistId) && !newInclude[playlistId])
      newInclude[playlistId] = "ALL";
    else if (!newSelected.includes(playlistId)) delete newInclude[playlistId];

    updateState({
      sourcePlatform: localPlatform,
      selectedPlaylistIds: newSelected,
      includeTracks: newInclude,
    });
  }

  function handleIncludeAllToggle(checked: boolean) {
    // optional helper to include/exclude all selected
    const newInclude = { ...includeTracks };
    selectedPlaylistIds.forEach((pid) => {
      if (checked) newInclude[pid] = "ALL";
      else delete newInclude[pid];
    });
    updateState({
      sourcePlatform: localPlatform,
      selectedPlaylistIds,
      includeTracks: newInclude,
    });
  }

  // ---------------------------------------------
  // Force a brand-new OAuth login (fresh consent)
  // ---------------------------------------------
  async function handleReconnect() {
    try {
      setError(null);
      setIsLinked(false);
      setPlaylists([]);

      const res = await fetch(
        `${
          (import.meta as any)?.env?.VITE_API_BASE || "https://penguinshift-production.up.railway.app"
        }/api/platforms/force-reconnect/${localPlatform}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        }
      );

      // Even if token was cleared, proceed to open new OAuth link
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        console.warn("Force reconnect: could not parse response");
      }

      if (data?.url) {
        // Directly open new OAuth window without user clicking again
        const popup = window.open(
          data.url,
          "oauth",
          "width=600,height=700,scrollbars=yes"
        );
        if (!popup) throw new Error("Popup blocked");
        const poll = window.setInterval(async () => {
          if (popup.closed) {
            clearInterval(poll);
            await checkPlatformLink(localPlatform);
          }
        }, 1200);
        window.setTimeout(() => clearInterval(poll), 120000);
      } else {
        // If no URL returned, fallback to manual link
        console.warn("No reconnect URL, falling back to normal link flow");
        await handleLinkPlatform();
      }
    } catch (err: any) {
      console.error("Reconnect failed:", err);
      setError("Reconnecting your account... Please wait.");
      await handleLinkPlatform();
    }
  }

  async function handleManualRefresh() {
    try {
      await loadPlaylists(localPlatform);
    } catch {
      setError("Could not refresh playlists. Please try again later.");
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, debouncedQuery]);

  const canContinue = selectedPlaylistIds.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Playlists
          </h1>
          <p className="text-gray-600">
            Choose playlists to transfer from your account
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm"
          >
            {error.includes("HTTP") || error.includes("401")
              ? "Something went wrong. Please reconnect your account and try again."
              : error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Source Platform</h2>

          <div className="flex gap-4 mb-6">
            <Button
              variant={localPlatform === "spotify" ? "default" : "outline"}
              onClick={() => void handlePlatformSwitch("spotify")}
              className="flex-1"
            >
              Spotify
            </Button>
            <Button
              variant={localPlatform === "youtube" ? "default" : "outline"}
              onClick={() => void handlePlatformSwitch("youtube")}
              className="flex-1"
            >
              YouTube Music
            </Button>
          </div>

          {isCheckingLink ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
              <p className="text-gray-600">Checking connection...</p>
            </div>
          ) : !isLinked ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <ExternalLink
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                aria-hidden="true"
              />
              <p className="text-gray-600 mb-4">
                Connect your{" "}
                {localPlatform === "spotify" ? "Spotify" : "YouTube Music"}{" "}
                account
              </p>
              <Button
                onClick={() => void handleLinkPlatform()}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
              >
                Connect Account
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2
                    className="w-5 h-5 text-green-600"
                    aria-hidden="true"
                  />
                  <span className="text-green-700 font-medium">
                    Connected to{" "}
                    {localPlatform === "spotify" ? "Spotify" : "YouTube Music"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleManualRefresh()}
                    disabled={isLoadingPlaylists}
                    title="Refresh playlists"
                  >
                    <RefreshCw
                      className={
                        "w-4 h-4 mr-2 " +
                        (isLoadingPlaylists ? "animate-spin" : "")
                      }
                    />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleReconnect()}
                    title="Reconnect account"
                  >
                    <PlugZap className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your playlists..."
                  className="pl-10"
                  aria-label="Search your playlists"
                />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="includeAll"
                  checked={
                    selectedPlaylistIds.every(
                      (pid) => includeTracks[pid] === "ALL"
                    ) && selectedPlaylistIds.length > 0
                  }
                  onCheckedChange={(v: any) =>
                    handleIncludeAllToggle(Boolean(v))
                  }
                />
                <label
                  htmlFor="includeAll"
                  className="text-sm text-gray-700 select-none"
                >
                  Include all tracks in selected playlists
                </label>
              </div>

              {isLoadingPlaylists ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading playlists...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">
                    {playlists.length === 0
                      ? "No playlists found"
                      : "No matching playlists"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Tip: click Refresh if you just created a playlist.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((pl) => {
                    const selected = selectedPlaylistIds.includes(pl.id);
                    return (
                      <div
                        key={pl.id}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div
                          className={
                            (selected
                              ? "bg-purple-50 border-purple-500 "
                              : "bg-white hover:bg-gray-50 ") +
                            "p-4 cursor-pointer transition-all"
                          }
                          onClick={() => handleTogglePlaylist(pl.id)}
                          role="button"
                          aria-pressed={selected}
                          aria-label={"Toggle selection for " + pl.name}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {pl.coverImage ? (
                                <img
                                  src={pl.coverImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Music2
                                  className="w-6 h-6 text-white"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {pl.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {pl.songCount} songs
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {selected && (
                                <CheckCircle2
                                  className="w-6 h-6 text-purple-600 flex-shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPlaylist(
                                    expandedPlaylist === pl.id ? null : pl.id
                                  );
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                aria-expanded={expandedPlaylist === pl.id}
                                aria-label="Toggle song panel"
                              >
                                {expandedPlaylist === pl.id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        {expandedPlaylist === pl.id && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-600 italic">
                              Individual song selection coming soon. For now,
                              all songs will be transferred.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link to={createPageUrl("LandingPage")}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link
            to={createPageUrl("SelectDestination") + `?source=${localPlatform}`}
            onClick={() => updateState({ sourcePlatform: localPlatform })}
          >
            <Button
              disabled={!canContinue}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose Destination
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
