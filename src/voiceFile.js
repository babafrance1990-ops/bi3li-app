// Message vocal d'une annonce : il est gardé dans l'annonce sous forme de texte (data URL, comme sur le site).
// On l'écrit une seule fois dans un fichier du téléphone pour pouvoir le lire.
import { cacheDirectory, getInfoAsync, writeAsStringAsync } from 'expo-file-system/legacy';

const done = new Map(); // annonce → adresse du fichier (ou promesse en cours)

export function voiceFile(adId, dataUrl) {
  const m = /^data:([^,]*);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return Promise.resolve(null);
  const key = String(adId) + ':' + m[2].length;
  if (!done.has(key)) {
    const mime = m[1].split(';')[0];
    const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'm4a';
    const uri = cacheDirectory + 'voice-' + String(adId).replace(/[^a-z0-9]/gi, '') + '-' + m[2].length + '.' + ext;
    const p = getInfoAsync(uri)
      .then((info) => (info.exists ? uri : writeAsStringAsync(uri, m[2], { encoding: 'base64' }).then(() => uri)))
      .catch(() => { done.delete(key); return null; });
    done.set(key, p);
  }
  return done.get(key);
}
