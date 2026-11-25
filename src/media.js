// Vidéo et message vocal d'annonce, comme sur le site : vidéo de 2 minutes au plus (20 Mo après allègement),
// envoyée par morceaux ; message vocal de 1 minute au plus, envoyé avec l'annonce (data URL, 1,5 Mo au plus).
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { api } from './api';

export const MAX_VIDEO_SEC = 120;
export const MAX_VIDEO_BYTES = 20000000;
export const MAX_VOICE_BYTES = 1500000;

function codeErr(code) {
  const e = new Error(code); e.code = code; return e;
}

// Ouvre la caméra ou la galerie (vidéo de 2 minutes au plus, allégée à l'enregistrement) → { uri } ou null
export async function pickVideo(source) {
  const perm = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw codeErr('permission');
  const opts = {
    mediaTypes: ['videos'],
    videoMaxDuration: MAX_VIDEO_SEC,
    videoExportPreset: ImagePicker.VideoExportPreset.LowQuality,
  };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (r.canceled || !r.assets?.[0]) return null;
  return { uri: r.assets[0].uri };
}

// Envoi de la vidéo par morceaux → renvoie l'adresse /api/videos/ID (code « big » si plus de 20 Mo)
export async function uploadVideo(uri, onProgress) {
  const bytes = new Uint8Array(await new File(uri).arrayBuffer());
  if (bytes.byteLength > MAX_VIDEO_BYTES) throw codeErr('big');
  const d = await api.videoStart('video/mp4', bytes.byteLength);
  for (let i = 0; i < d.n; i++) {
    onProgress?.(Math.round((i / d.n) * 100));
    await api.videoChunk(d.id, i, bytes.slice(i * d.chunk, (i + 1) * d.chunk));
  }
  return '/api/videos/' + d.id;
}

// Message vocal enregistré sur le téléphone → data URL comme sur le site (code « voiceBig » si trop lourd)
export async function voiceDataUrl(uri) {
  const b64 = await readAsStringAsync(uri, { encoding: 'base64' });
  if ((b64.length * 3) / 4 > MAX_VOICE_BYTES) throw codeErr('voiceBig');
  return 'data:audio/mp4;base64,' + b64;
}
