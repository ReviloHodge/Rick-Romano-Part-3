"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useYahooAuth } from "../hooks/useYahooAuth";

type League = { leagueId: string; name: string; season: string };

function Spinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-center justify-center"
    >
      <svg
        className="animate-spin h-5 w-5 text-gray-500"
        viewBox="0 0 24 24"
      >
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
  const [provider, setProvider] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setProvider(search.get("provider"));
  }, []);

  useEffect(() => {
    if (provider === "yahoo") {
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
    }
  }, [provider]);

  const handleYahoo = useYahooAuth();

  async function onGenerate() {
    if (!selectedLeague) return;
    setLoadingEpisode(true);
    setStatus("Generating episode...");
    try {
      const snapshotRes = await fetch("/api/snapshot/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "yahoo", leagueId: selectedLeague, week: undefined }),
      });
      const { week } = await snapshotRes.json();

      const episodeRes = await fetch("/api/episode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "yahoo", leagueId: selectedLeague, week }),
      });
      const { episodeId } = await episodeRes.json();

      await fetch("/api/episode/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId }),
      });

      router.push(`/e/${episodeId}`);
    } catch (e: any) {
      if (typeof e?.message === "string") {
        setError(e.message);
      } else {
        setError("internal_error:unknown");
      }
    } finally {
      setLoadingEpisode(false);
      setStatus("");
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

        {provider ? (
          <p>Provider connected: {provider}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/dashboard?provider=sleeper" className="btn">
              Connect Sleeper
            </a>
            <button
              onClick={handleYahoo}
              className="rounded-xl px-5 py-3 border hover:bg-gray-50"
            >
              Connect Yahoo
            </button>
          </div>
        )}

        <Link href="/" className="rounded-xl px-5 py-3 border hover:bg-gray-50">
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
                    "Generate Episode"
                  )}
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Health:{" "}
          <a className="underline" href="/ok">
            /ok
          </a>
        </p>
      </div>
    </main>
  );
}
