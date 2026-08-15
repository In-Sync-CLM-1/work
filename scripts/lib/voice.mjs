// Riya voiceover via ElevenLabs.
// Output format is negotiated, not assumed: the highest bitrates are gated
// behind paid tiers and the account's tier has changed under us before, which
// fails the whole render with a 403 that reads like a bad key. Walk down the
// ladder until one is allowed.
import { writeFileSync } from 'fs';
import { loadEnv } from './env.mjs';

const env = loadEnv(new URL('../../.env', import.meta.url));
const RIYA = 'vYENaCJHl4vFKNDYPr8y';
// Default narrator for demo videos (Indian professional voice). Override per-call with opts.voiceId.
export const NARRATOR = 'Pc57DSBXmCXyEAmow7lW';

const FORMATS = ['mp3_44100_192', 'mp3_44100_128', 'mp3_44100_96', 'mp3_22050_32'];

// Calls `attempt(format)` down the quality ladder, stepping past any format the
// account's plan does not allow. Any other failure is thrown as-is.
async function withAllowedFormat(attempt) {
  let lastErr;
  for (const fmt of FORMATS) {
    const res = await attempt(fmt);
    if (res.ok) return res;
    const body = await res.text();
    lastErr = new Error(`TTS ${res.status}: ${body}`);
    if (!/output_format_not_allowed|subscription_required/.test(body)) throw lastErr;
    console.log(`  ${fmt} not available on this plan, trying the next one down`);
  }
  throw lastErr;
}

export async function synth(text, outPath, opts = {}) {
  const voiceId = opts.voiceId || NARRATOR;
  const res = await withAllowedFormat((fmt) => fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${fmt}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, speed: 1.0 },
      }),
    },
  ));
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return outPath;
}

// Synthesize AND return character-level timing, so beats/scenes can lock to words.
// Returns { duration, find, chars, starts, ends, timeAtChar, outPath }.
export async function synthTimed(text, outPath, opts = {}) {
  const voiceId = opts.voiceId || NARRATOR;
  const speed = opts.speed ?? 1.0; // natural 1x pace
  const res = await withAllowedFormat((fmt) => fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${fmt}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, speed },
      }),
    },
  ));
  const j = await res.json();
  writeFileSync(outPath, Buffer.from(j.audio_base64, 'base64'));
  const al = j.alignment || j.normalized_alignment;
  const chars = al.characters;
  const starts = al.character_start_times_seconds;
  const ends = al.character_end_times_seconds;
  const joined = chars.join('').toLowerCase();
  const find = (phrase) => {
    const i = joined.indexOf(phrase.toLowerCase());
    return i < 0 ? null : starts[i];
  };
  const timeAtChar = (i) => starts[Math.max(0, Math.min(i, starts.length - 1))];
  return { duration: ends[ends.length - 1], find, chars, starts, ends, timeAtChar, joined, outPath };
}
