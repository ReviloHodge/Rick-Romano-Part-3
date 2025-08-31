interface Props {
  searchParams?: { provider?: string };
}

export default function Dashboard({ searchParams }: Props) {
  const provider = searchParams?.provider;
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        {!provider ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Connect your fantasy provider to get started.
            </p>
            <div className="flex gap-3">
              <a href="/api/auth/sleeper" className="btn">
                Connect Sleeper
              </a>
              <a href="/api/auth/yahoo" className="btn">
                Connect Yahoo
              </a>
            </div>
          </div>
        ) : (
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
      </div>
    </main>
  );
}
