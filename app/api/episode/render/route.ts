import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { track } from '@/lib/metrics';

export async function POST(req: NextRequest) {
  try {
    const { episodeId, userId } = await req.json();
    if (!episodeId) {
      return NextResponse.json({ ok: false, error: 'missing episodeId' }, { status: 400 });
    }
    const { data: ep, error } = await supabaseAdmin
      .from('episode')
      .select('script_md')
      .eq('id', episodeId)
      .single();
    if (error || !ep) {
      return NextResponse.json({ ok: false, error: 'episode_not_found' }, { status: 404 });
    }

    // TODO: Call Play.ht and store MP3 in Supabase Storage
    const fakeUrl = `https://example.com/episodes/${episodeId}.mp3`;
    const duration = 90;
    await supabaseAdmin
      .from('episode')
      .update({ audio_url: fakeUrl, duration_s: duration, status: 'rendered' })
      .eq('id', episodeId);

    track('episode_rendered', userId, { episode_id: episodeId, duration_s: duration });
    return NextResponse.json({ ok: true, audio_url: fakeUrl });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
