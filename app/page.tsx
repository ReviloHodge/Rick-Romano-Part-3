"use client";

export default function Home() {
  const handleYahoo = () => {
    const uid = localStorage.getItem('uid') ?? crypto.randomUUID();
    localStorage.setItem('uid', uid);
    window.location.href = `/api/auth/yahoo?userId=${encodeURIComponent(uid)}`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="container text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          Your League. Your Drama. Rick Tells It Like It Is.
        </h1>
        <p className="text-lg text-gray-600">
          Connect Sleeper or Yahoo. Get a weekly podcast that roasts your rivals and recaps every clutch move.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/dashboard?provider=sleeper" className="btn">
            Connect Sleeper
          </a>
          <button
            onClick={handleYahoo}
            className="rounded-xl px-5 py-3 border hover:bg-gray-50"
          >
            Connect Yahoo
          </button>
        </div>
        <p className="text-sm text-gray-500">You’re in control. Disconnect anytime.</p>
      </div>
    </main>
  );
}
