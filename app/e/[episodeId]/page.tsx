import { getSupabase } from '@/lib/db';

export default async function EpisodePage({
  params,
}: {
  params: { episodeId: string };
}) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('episode')
    .select('*')
    .eq('id', params.episodeId)
    .single();
  if (!data) {
    return <div className="p-10">Episode not found.</div>;
  }
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="container space-y-6">
        <h1 className="text-3xl font-extrabold">
          Week {data.week} Recap
        </h1>
        {data.audio_url && (
          <audio
            controls
            className="w-full"
            src={data.audio_url}
            onPlay={() => {
              fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'episode_played',
                  userId: data.user_id,
                  properties: { episode_id: data.id },
                }),
              }).catch((err) => console.error('track error', err));
            }}
          />
        )}
        <button
          className="btn"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          Copy Link
        </button>
        {data.script_md && (
          <section className="prose max-w-none">
            <h2>Show Notes</h2>
            <pre>{data.script_md}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
