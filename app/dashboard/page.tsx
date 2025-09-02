"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useYahooAuth } from "../hooks/useYahooAuth";

type League = { leagueId: string; name: string; season: string };

export default function Dashboard() {
  const [provider, setProvider] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setProvider(search.get("provider"));
  }, []);

  useEffect(() => {
    if (provider === "yahoo") {
      setError(null);
      setLeagues([]);

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
        });
    }
  }, [provider]);

  const handleYahoo = useYahooAuth();

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
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

            {!error && leagues.length === 0 && (
              <p className="text-gray-600">No leagues found.</p>
            )}

            {leagues.length > 0 && (
              <select
                className="rounded-xl px-5 py-3 border w-full"
                defaultValue=""
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
