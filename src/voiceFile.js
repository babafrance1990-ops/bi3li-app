// Message vocal d'une annonce, prêt à lire sur le téléphone.
// - Enregistré sur ce téléphone : fichier déjà prêt.
// - Ancien format (données dans l'annonce) : écrit une fois dans un fichier.
// - Fichier sur le serveur (/api/media/…) : téléchargé en entier, car iPhone ne lit pas en flux depuis ce serveur.
import { cacheDirectory, downloadAsync, getInfoAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { mediaUrl } from './api';

const done = new Map(); // clé → adresse du fichier (ou promesse en cours)

const name = (s) => String(s).replace(/[^a-z0-9]/gi, '').slice(-60);

function once(key, make) {
  if (!done.has(key)) done.set(key, make().catch(() => { done.delete(key); return null; }));
  return done.get(key);
}

export function voiceFile(adId, dataUrl) {
  if (!dataUrl) return Promise.resolve(null);
  const m = /^data:([^,]*);base64,(.*)$/.exec(dataUrl);

  if (!m) {
    if (!/^(\/|https?:)/.test(dataUrl)) return Promise.resolve(null);
    const url = mediaUrl(dataUrl);
    const uri = cacheDirectory + 'voice-' + name(url) + '.m4a';
    return once(url, () => getInfoAsync(uri).then((info) =>
      info.exists && info.size > 0 ? uri : downloadAsync(url, uri).then((r) => r.uri)));
  }

  const key = String(adId) + ':' + m[2].length;
  const mime = m[1].split(';')[0];
  const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'm4a';
  const uri = cacheDirectory + 'voice-' + name(adId) + '-' + m[2].length + '.' + ext;
  return once(key, () => getInfoAsync(uri).then((info) =>
    info.exists ? uri : writeAsStringAsync(uri, m[2], { encoding: 'base64' }).then(() => uri)));
}
