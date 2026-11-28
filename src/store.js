// Toutes les annonces en ligne, gardées en mémoire 2 minutes (la recherche se fait dessus, comme sur le site)
import { adCache, api } from './api';

let all = null;
let at = 0;
let loading = null;

export async function getAllAds({ force = false } = {}) {
  if (!force && all && Date.now() - at < 120000) return all;
  if (loading) return loading;
  loading = (async () => {
    let out = [];
    let before;
    for (let page = 0; page < 5; page++) { // 5 × 300 = 1 500 annonces au maximum
      const r = await api.ads({ limit: 300, before });
      out = out.concat(r.ads);
      if (!r.more || !r.ads.length) break;
      before = r.ads[r.ads.length - 1].t;
    }
    out.forEach((a) => adCache.set(a.id, a));
    all = out;
    at = Date.now();
    return out;
  })();
  try { return await loading; } finally { loading = null; }
}

// Recherche serveur ; renvoie null si le serveur ne répond pas (l'appli cherche alors dans la liste locale)
export async function searchServer(params) {
  try { const r = await api.searchAds(params); return r.ads || []; } catch { return null; }
}

// À appeler après une publication, une modification ou une suppression : la prochaine lecture redemande la liste
export function invalidateAds() { at = 0; }
