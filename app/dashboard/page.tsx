"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SleeperLeagueForm from "./SleeperLeagueForm";

export default function Dashboard() {
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setProvider(search.get("provider"));
  }, []);

  const handleYahoo = () => {
    const uid = localStorage.getItem("uid") ?? crypto.randomUUID();
    localStorage.setItem("uid", uid);
    window.location.href = `/api/auth/yahoo?userId=${encodeURIComponent(uid)}`;
  };

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>

        {provider ? (
          <p>Provider connected: {provider}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Sleeper: direct link (no OAuth) */}
            <a href="/dashboard?provider=sleeper" className="btn">
              Connect Sleeper
            </a>

            {/* Yahoo: OAuth with uid as state */}
            <button
              onClick={handleYahoo}
              className="rounded-xl px-5 py-3 border hover:bg-gray-50"
            >
              Connect Yahoo
            </button>
          </div>
        )}

        {/* Back to home */}
        <Link
          href="/"
          className="rounded-xl px-5 py-3 border hover:bg-gray-50 inline-block"
        >
          Back to Home
        </Link>

        {/* Sleeper league flow */}
        {provider === "sleeper" && (
          <div className="card space-y-3">
            <SleeperLeagueForm />
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
