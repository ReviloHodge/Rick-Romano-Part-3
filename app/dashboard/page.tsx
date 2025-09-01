"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SleeperLeagueForm from "./SleeperLeagueForm";

type League = { league_id: string; name: string; season: string };

export default function Dashboard() {
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const p = search.get("provider");
    setProvider(p);

    if (p === "yahoo") {
      setLoading(true);
      fetch(`/api/leagues/list?provider=yahoo`)
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) {
            setLeagues(json.leagues || []);
            if ((json.leagues || []).length) {
              setSelected(json.leagues[0].league_id);
            }
          } else {
            setError(json.error || "Failed to load leagues");
          }
        })
        .catch(() => setError("Failed to load leagues"))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleYahoo = () => {
    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);
    window.location.href = `/api/auth/yahoo?userId=${encodeURIComponent(uid)}`;
  };

  const onUseLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    console.log("Selected Yahoo league:", selected);
  };

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

        <Link
          href="/"
          className="rounded-xl px-5 py-3 border hover:bg-gray-50"
        >
          Back to Home
        </Link>

        {provider === "sleeper" && (
          <div className="card space-y-3">
            <SleeperLeagueForm />
          </div>
        )}

        {provider === "yahoo" && (
          <div className="card space-y-3">
            <h2 className="text-xl font-semibold">Choose your Yahoo league</h2>
            {loading && <p>Loading leagues…</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
            {!loading && !error && leagues.length === 0 && <p>No leagues found.</p>}

            {leagues.length > 0 && (
              <form onSubmit={onUseLeague} className="space-y-2">
                <select
                  className="border rounded p-2 w-full"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {leagues.map((l) => (
                    <option key={l.league_id} value={l.league_id}>
                      {l.name} {l.season ? `(${l.season})` : ""}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn">
                  Use League
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Health: <a className="underline" href="/ok">/ok</a>
        </p>
      </div>
    </main>
  );
}
