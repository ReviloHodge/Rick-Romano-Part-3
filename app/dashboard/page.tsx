"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setProvider(search.get('provider'));
  }, []);

  const handleYahoo = () => {
    const uid = localStorage.getItem('uid') ?? crypto.randomUUID();
    localStorage.setItem('uid', uid);
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

        <p className="text-sm text-gray-400">Health: <a className="underline" href="/ok">/ok</a></p>
      </div>
    </main>
  );
}
