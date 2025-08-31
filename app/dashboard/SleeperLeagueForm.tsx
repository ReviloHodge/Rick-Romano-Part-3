"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SleeperLeagueForm() {
  const [value, setValue] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let leagueId = value.trim();

    // Allow full URL input (extract /league/<id>)
    const match = leagueId.match(/\/league\/(\d+)/);
    if (match) {
      leagueId = match[1];
    }

    // 1) Snapshot last completed week
    const snapshotRes = await fetch("/api/snapshot/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "sleeper", leagueId, week: undefined }),
    });
    const { week } = await snapshotRes.json();

    // 2) Generate episode script
    const episodeRes = await fetch("/api/episode/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "sleeper", leagueId, week }),
    });
    const { episodeId } = await episodeRes.json();

    // 3) Render audio
    await fetch("/api/episode/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });

    // 4) Navigate to episode page
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
      <button type="submit" className="btn w-full">
        Use League
      </button>
    </form>
  );
}
