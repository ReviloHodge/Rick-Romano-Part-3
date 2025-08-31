"use client";

import { useState } from "react";

export default function SleeperLeagueForm() {
  const [leagueId, setLeagueId] = useState("");
  return (
    <form className="space-y-2">
      <input
        type="text"
        placeholder="Sleeper League ID"
        value={leagueId}
        onChange={(e) => setLeagueId(e.target.value)}
        className="border rounded p-2 w-full"
      />
      <button className="btn w-full" formAction="/api/episode/generate">
        Generate Week Recap
      </button>
    </form>
  );
}
