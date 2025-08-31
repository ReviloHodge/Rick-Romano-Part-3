// app/dashboard/page.tsx
import Link from 'next/link';
import SleeperLeagueForm from './SleeperLeagueForm';

export default function Dashboard({
  searchParams,
}: {
  searchParams?: { connected?: string; provider?: string };
}) {
  const connected = searchParams?.connected;
  const provider = searchParams?.provider;

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>

        {connected ? (
          <div className="card">
            <p className="text-green-700 font-semibold">
              ✅ {connected === 'yahoo' ? 'Yahoo' : 'Sleeper'} connected successfully.
            </p>
            <p className="text-sm text-gray-600">
              You can re-connect or fetch last week&apos;s snapshot next.
            </p>
          </div>
        ) : (
          <div className="card">
            <p className="text-amber-700 font-semibold">
              No provider connected yet.
            </p>
            <p className="text-sm text-gray-600">Start below.</p>
          </div>
        )}

        <div className="flex gap-3">
          <a href="/dashboard?provider=sleeper" className="btn">Connect Sleeper</a>
          <a href="/api/auth/yahoo" className="btn">Connect Yahoo</a>
          <Link href="/" className="rounded-xl px-5 py-3 border hover:bg-gray-50">
            Back to Home
          </Link>
        </div>

        {provider === 'sleeper' && (
          <div className="card space-y-3">
            <SleeperLeagueForm />
          </div>
        )}

        <p className="text-sm text-gray-400">Health: <a className="underline" href="/ok">/ok</a></p>
      </div>
    </main>
  );
}
