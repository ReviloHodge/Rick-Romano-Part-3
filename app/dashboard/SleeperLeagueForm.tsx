'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SleeperLeagueForm() {
  const [value, setValue] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let leagueId = value.trim();
    const match = leagueId.match(/\/league\/(\d+)/);
    if (match) {
      leagueId = match[1];
    }

    const snapshotRes = await fetch('/api/snapshot/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'sleeper', leagueId, week: undefined }),
    });
    const { week } = await snapshotRes.json();

    const episodeRes = await fetch('/api/episode/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'sleeper', leagueId, week }),
    });
    const { episodeId } = await episodeRes.json();

    await fetch('/api/episode/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodeId }),
    });

    router.push(`/e/${episodeId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        name="league"
        placeholder="Sleeper League URL or ID"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-xl px-5 py-3 border w-full"
      />
      <button type="submit" className="btn">
        Use League
      </button>
    </form>
  );
}

