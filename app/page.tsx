"use client";

import { useYahooAuth } from "./hooks/useYahooAuth";

export default function Home() {
  const handleYahoo = useYahooAuth();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="container space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold">
            Your League. Your Drama. Rick Tells It Like It Is.
          </h1>
          <p className="text-lg text-gray-600">
            Weekly podcast recaps for Sleeper and Yahoo fantasy football leagues.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Sleeper: no OAuth — go straight to dashboard */}
            <a href="/dashboard?provider=sleeper" className="btn">
              Connect Sleeper
            </a>

            {/* Yahoo: start OAuth using uid as state */}
            <button
              onClick={handleYahoo}
              className="rounded-xl px-5 py-3 border hover:bg-gray-50"
            >
              Connect Yahoo
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-gray-50">
        <div className="container grid sm:grid-cols-4 gap-6 text-center">
          {["Connect league", "Fetch last week", "Rick writes", "Share episode"].map(
            (step, i) => (
              <div key={i} className="space-y-2">
                <div className="text-3xl font-bold">{i + 1}</div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 space-x-4">
        <span>You’re in control. Disconnect anytime.</span>
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
