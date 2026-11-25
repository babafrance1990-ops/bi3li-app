// Message vocal d'une annonce : il est gardé dans l'annonce sous forme de texte (data URL, comme sur le site),
// on l'écrit dans un fichier du téléphone pour pouvoir le lire.
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';

export async function voiceFile(adId, dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return null;
  const ext = m[1].includes('webm') ? 'webm' : m[1].includes('ogg') ? 'ogg' : 'm4a';
  const uri = cacheDirectory + 'voice-' + String(adId).replace(/[^a-z0-9]/gi, '') + '.' + ext;
  await writeAsStringAsync(uri, m[2], { encoding: 'base64' });
  return uri;
}
