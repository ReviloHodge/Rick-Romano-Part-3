import Link from 'next/link';

export default function Home() {
  return (
codex/build-mvp-fantasy-football-podcast-app
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="container space-y-6">
          <h1 className="text-4xl font-extrabold">
            Your League. Your Drama. Rick Tells It Like It Is.
          </h1>
          <p className="text-lg text-gray-600">
            Weekly podcast recaps for Sleeper and Yahoo fantasy football leagues.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/api/auth/sleeper" prefetch={false} className="btn">
              Connect Sleeper
            </Link>
            <Link
              href="/api/auth/yahoo"
              prefetch={false}
              className="rounded-xl px-5 py-3 border hover:bg-gray-50"
            >
              Connect Yahoo
            </Link>
          </div>

    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="container text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          Your League. Your Drama. Rick Tells It Like It Is.
        </h1>
        <p className="text-lg text-gray-600">
          Connect Sleeper or Yahoo. Get a weekly podcast that roasts your rivals and recaps every clutch move.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/api/auth/sleeper" className="btn">Connect Sleeper</a>
          <a
            href="/api/auth/yahoo"
            className="rounded-xl px-5 py-3 border hover:bg-gray-50"
          >
            Connect Yahoo
          </a>
 main
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="container grid sm:grid-cols-4 gap-6 text-center">
          {['Connect league', 'Fetch last week', 'Rick writes', 'Share episode'].map(
            (step, i) => (
              <div key={i} className="space-y-2">
                <div className="text-3xl font-bold">{i + 1}</div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            )
          )}
        </div>
      </section>
      <footer className="py-6 text-center text-sm text-gray-500 space-x-4">
        <span>We only read public fantasy data. Disconnect anytime.</span>
        <a href="#" className="underline">
          Terms
        </a>
        <a href="#" className="underline">
          Privacy
        </a>
      </footer>
    </main>
  );
}
