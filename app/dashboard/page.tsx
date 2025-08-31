interface Props {
  searchParams?: { provider?: string };
}

import Link from 'next/link';

export default function Dashboard({ searchParams }: Props) {
  const provider = searchParams?.provider;
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
 codex/build-mvp-fantasy-football-podcast-app
        {!provider ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Connect your fantasy provider to get started.


        {connected ? (
          <div className="card">
            <p className="text-green-700 font-semibold">
              ✅ {connected === 'yahoo' ? 'Yahoo' : 'Sleeper'} connected successfully.
            </p>
            <p className="text-sm text-gray-600">
              You can re-connect or fetch last week&apos;s snapshot next.
 main
            </p>
            <div className="flex gap-3">
              <Link href="/api/auth/sleeper" prefetch={false} className="btn">
                Connect Sleeper
              </Link>
              <Link href="/api/auth/yahoo" prefetch={false} className="btn">
                Connect Yahoo
              </Link>
            </div>
          </div>
        ) : (
 codex/build-mvp-fantasy-football-podcast-app
          <div className="space-y-4">
            <p className="text-gray-600">Provider connected: {provider}</p>
            <form className="space-y-2">
              <select className="border rounded p-2 w-full">
                <option>TODO: load leagues</option>
              </select>
              <button className="btn w-full" formAction="/api/episode/generate">
                Generate Week Recap
              </button>
            </form>
          </div>
        )}

          <div className="card">
            <p className="text-amber-700 font-semibold">
              No provider connected yet.
            </p>
            <p className="text-sm text-gray-600">Start below.</p>
          </div>
        )}

        <div className="flex gap-3">
          <a href="/api/auth/sleeper" className="btn">Connect Sleeper</a>
          <a href="/api/auth/yahoo" className="btn">Connect Yahoo</a>
          <Link href="/" className="rounded-xl px-5 py-3 border hover:bg-gray-50">
            Back to Home
          </Link>
        </div>

        <p className="text-sm text-gray-400">Health: <a className="underline" href="/ok">/ok</a></p>
 main
      </div>
    </main>
  );
}
