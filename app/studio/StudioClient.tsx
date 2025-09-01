'use client';

import { useState, useTransition } from 'react';
import type { LeagueMeta, MatchupWeek } from '../../types/domain';
import { selectLeague, loadLastWeek } from './actions';

interface Props {
  demoUsername?: string;
}

export default function StudioClient({ demoUsername = '' }: Props) {
  const [username, setUsername] = useState(demoUsername);
  const [leagues, setLeagues] = useState<LeagueMeta[]>([]);
  const [selected, setSelected] = useState<LeagueMeta | null>(null);
  const [week, setWeek] = useState<MatchupWeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchLeagues = async () => {
    try {
      setError(null);
      const res = await fetch('/api/providers/sleeper/leagues', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error('failed');
      const data: LeagueMeta[] = await res.json();
      setLeagues(data);
    } catch (e) {
      setError('Failed to load leagues');
    }
  };

  const handleSelect = (leagueId: string) => {
    const meta = leagues.find((l) => l.leagueId === leagueId);
    if (meta) {
      startTransition(() => selectLeague(meta));
      setSelected(meta);
    }
  };

  const handleFetchWeek = () => {
    if (!selected) return;
    startTransition(async () => {
      const data = await loadLastWeek(selected.leagueId);
      setWeek(data);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <input
          className="border px-3 py-2"
          placeholder="Sleeper username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={fetchLeagues} className="btn">Fetch leagues</button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {leagues.length > 0 && (
        <select
          className="border px-3 py-2"
          onChange={(e) => handleSelect(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Select a league
          </option>
          {leagues.map((l) => (
            <option key={l.leagueId} value={l.leagueId}>
              {l.name} ({l.season})
            </option>
          ))}
        </select>
      )}
      {selected && (
        <div className="space-y-2">
          <div className="sticky top-0 bg-white py-2 font-medium">
            {selected.name} – {selected.season}
          </div>
          <button onClick={handleFetchWeek} className="btn">
            Fetch last week
          </button>
        </div>
      )}
      {week && (
        <div className="border p-4 rounded space-y-1">
          <div>Week {week.week}</div>
          <div>Top scorer: {week.summary.topScorerTeamId} ({week.summary.topScorerPoints})</div>
          <div>Biggest blowout: {week.summary.biggestBlowoutGameId}</div>
          <div>Closest game: {week.summary.closestGameId}</div>
          <button
            onClick={() => {
              fetch('/api/rick/draft', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(week),
              });
            }}
            className="btn"
          >
            Send to Rick
          </button>
        </div>
      )}
    </div>
  );
}
