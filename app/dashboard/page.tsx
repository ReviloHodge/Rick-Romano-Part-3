"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useYahooAuth } from "../hooks/useYahooAuth";
import { useSleeperAuth } from "../hooks/useSleeperAuth";

type League = { leagueId: string; name: string; season: string };

function Spinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-center justify-center"
    >
      <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  // Provider / data
  const [provider, setProvider] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);

  // Errors
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Loading / selection / status
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [status, setStatus] = useState("");

  // Sleeper league entry
  const [sleeperLeague, setSleeperLeague] = useState("");

  // Optional week selector ("" = auto/current)
  const [week, setWeek] = useState<string>("");

  // Map Yahoo OAuth error codes from callback to user-friendly text
  function mapAuthError(code: string) {
    switch (code) {
      case "oauth_exchange":
        return "Yahoo authentication failed. Please try again.";
      case "db_upsert":
        return "Could not save Yahoo connection. Please try again.";
      case "no_uid":
        return "Missing user session. Please try again.";
      default:
        return "Unexpected error. Please try again.";
    }
  }

  // Read provider + auth error from URL
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const p = search.get("provider");
    const err = search.get("error");

    setProvider(p);

    if (err) {
      const msg = err
        .split(",")
        .map((c) => mapAuthError(c))
        .join(" ");
      setAuthError(msg);
    } else {
      setAuthError(null);
    }
  }, []);

  // Fetch leagues when Yahoo is connected
  useEffect(() => {
    if (provider !== "yahoo") return;

    setError(null);
    setLeagues([]);
    setLoadingLeagues(true);
    setStatus("Loading leagues...");

    fetch("/api/leagues/list?provider=yahoo", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "Failed to load leagues");

        const raw = Array.isArray(json.leagues) ? json.leagues : [];

        // Normalize snake_case → camelCase for UI
        const normalized: League[] = raw.map((l: any) => ({
          leagueId:
            l.leagueId ??
            l.league_id ??
            (l.id != null ? String(l.id) : ""),
          name: l.name ?? "",
          season: l.season ?? l.year ?? "",
        }));

        setLeagues(normalized);
      })
      .catch((e) => {
        if (typeof e?.message === "string") {
          setError(e.message);
        } else {
          setError("internal_error:unknown");
        }
      })
      .finally(() => {
        setLoadingLeagues(false);
        setStatus("");
      });
  }, [provider]);

  const handleYahoo = useYahooAuth();
  const handleSleeper = useSleeperAuth();

  async function runEpisodeFlow(
    provider: string,
    leagueId: string,
    uid: string,
    week?: number
  ) {
    setStatus("Fetching league snapshot...");
    const snapshotRes = await fetch("/api/snapshot/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, leagueId, week, userId: uid }),
    });
    const snapshotJson = await snapshotRes.json();
    if (!snapshotRes.ok || snapshotJson?.ok === false) {
      throw new Error(snapshotJson?.error || "Failed to fetch snapshot");
    }

    const effectiveWeek = week ?? snapshotJson.week;

    setStatus("Generating episode...");
    const episodeRes = await fetch("/api/episode/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        leagueId,
        week: effectiveWeek,
        userId: uid,
      }),
    });
    const { episodeId, error: epError } = await episodeRes.json();
    if (!episodeRes.ok || !episodeId) {
      throw new Error(epError || "Failed to generate episode");
    }

    setStatus("Rendering episode...");
    const renderRes = await fetch("/api/episode/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });
    const renderJson = await renderRes.json();
    if (!renderRes.ok || renderJson?.ok === false) {
      throw new Error(renderJson?.error || "Failed to render episode");
    }

    return episodeId as string;
  }

  async function onGenerate() {
    if (!selectedLeague) return;

    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);

    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "cta_click", userId: uid }),
    }).catch(() => {});

    setLoadingEpisode(true);
    try {
      const requestedWeek =
        week && !Number.isNaN(Number(week)) ? Number(week) : undefined;
      const episodeId = await runEpisodeFlow(
        "yahoo",
        selectedLeague,
        uid,
        requestedWeek
      );
      setStatus("Episode ready! Redirecting...");
      router.push(`/e/${episodeId}`);
    } catch (e: any) {
      if (typeof e?.message === "string") {
        setError(e.message);
        setStatus(`Error: ${e.message}`);
      } else {
        setError("internal_error:unknown");
        setStatus("Error: internal_error:unknown");
      }
    } finally {
      setLoadingEpisode(false);
    }
  }

  async function onSleeperSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sleeperLeague.trim()) return;

    let leagueId = sleeperLeague.trim();
    const match = leagueId.match(/\/league\/(\d+)/);
    if (match) {
      leagueId = match[1];
    }

    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);

    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "cta_click", userId: uid }),
    }).catch(() => {});

    setLoadingEpisode(true);
    setError(null);
    try {
      const episodeId = await runEpisodeFlow("sleeper", leagueId, uid);
      setStatus("Episode ready! Redirecting...");
      router.push(`/e/${episodeId}`);
    } catch (e: any) {
      if (typeof e?.message === "string") {
        setError(e.message);
        setStatus(`Error: ${e.message}`);
      } else {
        setError("internal_error:unknown");
        setStatus("Error: internal_error:unknown");
      }
    } finally {
      setLoadingEpisode(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div
        className="container space-y-6"
        aria-busy={loadingLeagues || loadingEpisode}
      >
        <div aria-live="polite" className="sr-only">
          {status}
        </div>

        <h1 className="text-3xl font-extrabold">Dashboard</h1>

        {authError && <p className="text-red-600">{authError}</p>}

        {provider ? (
          <p>Provider connected: {provider}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setProvider("sleeper");
                try {
                  handleSleeper();
                } catch {}
              }}
              className="btn"
              disabled={loadingLeagues || loadingEpisode}
              aria-disabled={loadingLeagues || loadingEpisode}
            >
              Connect Sleeper
            </button>

            <button
              type="button"
              onClick={() => {
                setProvider("yahoo");
                try {
                  handleYahoo();
                } catch {}
              }}
              className="btn"
              disabled={loadingLeagues || loadingEpisode}
              aria-disabled={loadingLeagues || loadingEpisode}
            >
              Connect Yahoo
            </button>
          </div>
        )}

        <Link href="/" className="btn">
          Back to Home
        </Link>

        {provider === "yahoo" && (
          <div className="card space-y-3">
            <h2 className="text-xl font-semibold">Choose your Yahoo league</h2>

            {error && <p className="text-red-600">Error: {error}</p>}

            {!error && loadingLeagues && <Spinner label="Loading leagues" />}

            {!error && !loadingLeagues && leagues.length === 0 && (
              <p className="text-gray-600">No leagues found.</p>
            )}

            {!loadingLeagues && leagues.length > 0 && (
              <>
                <select
                  className="rounded-xl px-5 py-3 border w-full"
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  disabled={loadingEpisode}
                >
                  <option value="" disabled>
                    Select a league…
                  </option>
                  {leagues.map((l) => (
                    <option key={l.leagueId} value={l.leagueId}>
                      {l.name} {l.season ? `(${l.season})` : ""}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl px-5 py-3 border w-full"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  disabled={loadingEpisode}
                >
                  <option value="">Auto-select current week</option>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={String(w)}>
                      Week {w}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onGenerate}
                  className="btn w-full"
                  disabled={!selectedLeague || loadingEpisode}
                  aria-busy={loadingEpisode}
                >
                  {loadingEpisode ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner label="Generating episode" />
                      <span>Generating…</span>
                    </div>
                  ) : (
                    "Create Recap"
                  )}
                </button>

                {status && <p className="text-sm text-gray-600">{status}</p>}
              </>
            )}
          </div>
        )}

        {provider === "sleeper" && (
          <div className="card space-y-3">
            <h2 className="text-xl font-semibold">Enter your Sleeper league</h2>

            {error && <p className="text-red-600">Error: {error}</p>}

            <form onSubmit={onSleeperSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Sleeper League URL or ID"
                className="rounded-xl px-5 py-3 border w-full"
                value={sleeperLeague}
                onChange={(e) => setSleeperLeague(e.target.value)}
                disabled={loadingEpisode}
              />

              <button
                type="submit"
                className="btn w-full"
                disabled={!sleeperLeague || loadingEpisode}
                aria-busy={loadingEpisode}
              >
                {loadingEpisode ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner label="Generating episode" />
                    <span>Generating…</span>
                  </div>
                ) : (
                  "Create Recap"
                )}
              </button>
            </form>

            {status && <p className="text-sm text-gray-600">{status}</p>}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Health:{" "}
          <Link className="underline" href="/ok">
            /ok
          </Link>
        </p>
      </div>
    </main>
  );
}
