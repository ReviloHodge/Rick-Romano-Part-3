"use client";

import { useEffect, useState } from "react";
import { useYahooAuth } from "./hooks/useYahooAuth";
import { useSleeperAuth } from "./hooks/useSleeperAuth";

function mapAuthError(code: string) {
  switch (code) {
    case "oauth_exchange":
      return "Yahoo authentication failed. Please try again.";
    case "db_upsert":
      return "Could not save Yahoo connection. Please try again.";
    case "no_uid":
      return "Missing user session. Please try again.";
    default:
      return "Unexpected error. Please try again.";
  }
}

export default function Home() {
  const handleYahoo = useYahooAuth();
  const handleSleeper = useSleeperAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const err = search.get("error");
    if (err) {
      const msg = err
        .split(",")
        .map((c) => mapAuthError(c))
        .join(" ");
      setAuthError(msg);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {authError && (
        <p className="bg-red-50 text-red-600 text-center py-2">{authError}</p>
      )}
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
            {/* Sleeper: no OAuth — navigate with stable uid */}
            <button
              type="button"
              onClick={handleSleeper}
              className="btn"
            >
              Connect Sleeper
            </button>

            {/* Yahoo: start OAuth using uid as state */}
            <button
              type="button"
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
