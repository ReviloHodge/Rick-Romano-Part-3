// app/dashboard/page.tsx
import Link from 'next/link';

export default function Dashboard({
  searchParams,
}: {
  searchParams?: { connected?: string };
}) {
  const connected = searchParams?.connected;

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>

        {connected === 'yahoo' ? (
          <div className="card">
            <p className="text-green-700 font-semibold">
              ✅ Yahoo connected successfully.
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
            <p className="text-sm text-gray-600">
              Start with Yahoo below.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <a href="/api/yahoo/start" className="btn">Connect Yahoo</a>
          <Link href="/" className="rounded-xl px-5 py-3 border hover:bg-gray-50">
            Back to Home
          </Link>
        </div>

        <p className="text-sm text-gray-400">Health: <a className="underline" href="/ok">/ok</a></p>
      </div>
    </main>
  );
}
