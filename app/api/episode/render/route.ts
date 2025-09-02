import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';
import { track, flush } from '@/lib/metrics';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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

    // Synthesize the episode using Play.ht
    const apiKey = process.env.PLAYHT_API_KEY;
    const playUser = process.env.PLAYHT_USER_ID;
    if (!apiKey || !playUser) {
      throw new Error('Missing Play.ht credentials');
    }

    const ttsResp = await fetch('https://play.ht/api/v2/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-User-Id': playUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: ep.script_md,
        voice: 'en-US-1',
        format: 'mp3',
      }),
    });
    if (!ttsResp.ok) {
      throw new Error('playht_request_failed');
    }
    const { id } = await ttsResp.json();

    let audioUrl: string | null = null;
    let duration = 0;
    for (let i = 0; i < 20; i++) {
      const statusResp = await fetch(`https://play.ht/api/v2/tts/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'X-User-Id': playUser },
      });
      const statusJson = await statusResp.json();
      if (statusJson.status === 'completed') {
        audioUrl = statusJson.audio_url || statusJson.audioUrl;
        duration = statusJson.duration || statusJson.audio_duration || 0;
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (!audioUrl) {
      throw new Error('playht_timeout');
    }

    const audioRes = await fetch(audioUrl);
    const buffer = Buffer.from(await audioRes.arrayBuffer());
    const path = `episodes/${episodeId}.mp3`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('episodes')
      .upload(path, buffer, { upsert: true, contentType: 'audio/mpeg' });
    if (uploadError) throw uploadError;

    const { data: pub } = supabaseAdmin.storage.from('episodes').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    await supabaseAdmin
      .from('episode')
      .update({ audio_url: publicUrl, duration_s: duration, status: 'rendered' })
      .eq('id', episodeId);

    track('episode_rendered', userId, { episode_id: episodeId, duration_s: duration });
    await flush();
    return NextResponse.json({ ok: true, audio_url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
