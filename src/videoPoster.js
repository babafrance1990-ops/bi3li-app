// Image de couverture d'une vidéo : une image prise dans la vidéo, pour que la carte ne soit pas noire
import { getThumbnailAsync } from 'expo-video-thumbnails';

const cache = new Map(); // adresse de la vidéo → image (une seule fois par session)

export function videoPoster(url) {
  if (!url) return Promise.resolve(null);
  if (!cache.has(url)) {
    const frame = (time) => getThumbnailAsync(url, { time }).then((r) => r.uri);
    // 1 seconde ; si la vidéo est plus courte, on prend la première image
    const p = frame(1000).catch(() => frame(0)).catch(() => null);
    cache.set(url, p);
  }
  return cache.get(url);
}
