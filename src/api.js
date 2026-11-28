// Client du serveur Bi3li : l'application utilise exactement la même API que le site bi3li.net
// (routes lues dans src/api.js du dépôt Souki).
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const WEB = Platform.OS === 'web';
// Sur le web (bi3li.net/app) : même adresse que la page, donc API_URL vide (bi3li.net ou www.bi3li.net)
export const API_URL = WEB ? '' : Constants.expoConfig?.extra?.apiUrl || 'https://bi3li.net';
const TOKEN_KEY = 'bi3li_token';

// Téléphone : coffre-fort sécurisé ; navigateur : localStorage (le coffre-fort n'existe pas sur le web)
export async function getToken() {
  try { return WEB ? window.localStorage.getItem(TOKEN_KEY) : await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}
export async function setToken(t) {
  try {
    if (WEB) { if (t) window.localStorage.setItem(TOKEN_KEY, t); else window.localStorage.removeItem(TOKEN_KEY); return; }
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

async function request(path, { method = 'GET', body } = {}) {
  const token = await getToken();
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || 'http_' + res.status);
    err.code = data?.error;   // ex. nouser, badpass, locked, pin_weak, exists…
    err.data = data;          // ex. { left: 3 } ou { min: 15 }
    err.status = res.status;
    throw err;
  }
  return data;
}

// Ne garde que les 8 chiffres du numéro mauritanien
export const cleanPhone = (p) => String(p || '').replace(/\D/g, '').slice(-8);

export const api = {
  health: () => request('/api/health'),
  config: () => request('/api/config'),

  // Comptes : téléphone (8 chiffres) + code à 4 chiffres (champ « password » côté serveur)
  check: (phone) => request('/api/auth/check', { method: 'POST', body: { phone: cleanPhone(phone) } }),
  login: (phone, code) => request('/api/auth/login', { method: 'POST', body: { phone: cleanPhone(phone), password: code } }),
  register: (phone, code, name) => request('/api/auth/register', { method: 'POST', body: { phone: cleanPhone(phone), password: code, name } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // WhatsApp : l'utilisateur envoie lui-même un code au numéro de Bi3li, le serveur le reçoit et confirme
  // purpose : verify (vérifier mon numéro, connecté) | reset (code oublié, avec phone) | login
  waStart: (purpose, phone) => request('/api/wa/start', { method: 'POST', body: { purpose, phone: phone ? cleanPhone(phone) : undefined } }), // → { code, nonce, wa } ; erreurs wa_off, too_many, nouser, blocked
  waStatus: (code, nonce) => request('/api/wa/status', { method: 'POST', body: { code, nonce } }), // → { done, expired } ou { done: true, user, token? }
  setPin: (pin) => request('/api/me/pin', { method: 'POST', body: { pin } }), // nouveau code secret ; erreurs pin_format, pin_weak
  me: () => request('/api/me'), // → { user } (avec user.searches = recherches enregistrées / alertes)
  // Notifications : enregistrer / oublier ce téléphone (jeton Expo)
  pushRegister: (token, platform, lang) => request('/api/push', { method: 'POST', body: { token, platform, lang } }),
  pushUnregister: (token) => request('/api/push', { method: 'DELETE', body: { token } }),
  updateMe: (body) => request('/api/me', { method: 'PUT', body }), // ex. { searches: [...] }

  // Annonces : liste paginée → { ads, more } ; « before » = date de la dernière annonce reçue
  ads: ({ limit = 40, before } = {}) => request('/api/ads?limit=' + limit + (before ? '&before=' + before : '')),
  view: (id) => request('/api/ads/' + id + '/view', { method: 'POST' }),
  // Recherche faite par le serveur : une page de résultats (paramètres déjà nettoyés)
  searchAds: (params) => request('/api/ads/search?' + Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 0 && v !== false).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')),
  contact: (id, kind) => request('/api/ads/' + id + '/contact', { method: 'POST', body: { kind } }), // wa | call | msg

  // Dépôt : photo envoyée dès l'ajout → { url: '/api/media/ID' } ; puis annonce → { ad }
  // Erreurs possibles : limit (300 photos/jour), bad_image, too_big, invalid, too_many (60 annonces/jour), verify_needed (+limit)
  uploadMedia: (img) => request('/api/media', { method: 'POST', body: { img } }),
  publish: (ad) => request('/api/ads', { method: 'POST', body: { ad } }),
  // Vidéo d'annonce (comme le site) : on annonce la taille → { id, n, chunk }, puis on envoie les morceaux un par un
  videoStart: (mime, size) => request('/api/videos', { method: 'POST', body: { mime, size } }),
  videoChunk: async (id, i, bytes) => {
    const token = await getToken();
    const res = await fetch(API_URL + '/api/videos/' + id + '/' + i, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: bytes,
    });
    if (!res.ok) { const e = new Error('netErr'); e.code = 'netErr'; throw e; }
  },

  // Mes annonces : modifier → { ad } ; vendu ; remonter (1 fois tous les 7 jours, erreur too_soon + next) ; supprimer ; statistiques
  updateAd: (id, ad) => request('/api/ads/' + id, { method: 'PUT', body: { ad } }),
  soldAd: (id) => request('/api/ads/' + id + '/sold', { method: 'POST' }),
  bumpAd: (id) => request('/api/ads/' + id + '/bump', { method: 'POST' }),
  deleteAd: (id) => request('/api/ads/' + id, { method: 'DELETE' }),
  adStats: (id) => request('/api/ads/' + id + '/stats'), // → { views, contacts, people: [{ kind, t, id, name, avatar }] }

  user: (id) => request('/api/users/' + id), // → { user: { name, city, since, lastSeen, avatar, shop, followers, rating {n, avg}, reactive, verified, following, canReview, myReview } }
  userReviews: (id) => request('/api/users/' + id + '/reviews'), // → { reviews: [{ stars, txt, t, name }] }
  follow: (id, on) => request('/api/users/' + id + '/follow', { method: 'POST', body: { on } }),
  review: (id, stars, txt) => request('/api/users/' + id + '/reviews', { method: 'POST', body: { stars, txt } }), // erreur no_contact si jamais échangé
  reportAd: (id, reason) => request('/api/ads/' + id + '/report', { method: 'POST', body: { reason } }),
  // Messagerie : liste (seulement les conversations avec au moins un message), ouverture, envoi, lu
  convs: () => request('/api/convs'), // → { convs: [{ id, adId, title, seller (= l'autre personne), otherId, otherAvatar, otherRead, buyer, updated, msgs: [{ me, txt, t, img }], unread }] }
  openConv: (adId) => request('/api/convs', { method: 'POST', body: { adId } }), // → { id } ; erreur own_ad
  sendMsg: (id, txt, img) => request('/api/convs/' + id + '/messages', { method: 'POST', body: { txt, img } }), // → { ok, t, img }
  readConv: (id) => request('/api/convs/' + id + '/read', { method: 'POST' }),

  // Administration (compte administrateur) : mêmes routes que le site
  adminOverview: () => request('/api/admin/overview'), // → { counts, reports: [{ adId, title, n, last, reasons, ownerName, ownerPhone }] }
  adminUsers: (q = '') => request('/api/admin/users?q=' + encodeURIComponent(q)), // → { users: [{ id, name, phone, ads, since, blocked, verified, role }] }
  adminShops: () => request('/api/admin/shops'), // → { shops: [{ id, name, phone, ads, shop: { name, verified } }] }
  adminDismissReport: (adId) => request('/api/admin/reports/' + adId, { method: 'DELETE' }),
  adminVerify: (id, verified) => request('/api/admin/users/' + id + '/verify', { method: 'POST', body: { verified } }),
  adminShopVerify: (id, verified) => request('/api/admin/users/' + id + '/shopverify', { method: 'POST', body: { verified } }),
  adminRole: (id, role) => request('/api/admin/users/' + id + '/role', { method: 'POST', body: { role } }), // '' ou 'recruiter'
  adminBlock: (id, blocked) => request('/api/admin/users/' + id + '/block', { method: 'POST', body: { blocked } }),
  adminPassword: (id, password) => request('/api/admin/users/' + id + '/password', { method: 'POST', body: { password } }), // 4 chiffres
  adminLookup: (phone) => request('/api/admin/lookup?phone=' + cleanPhone(phone)), // → { user } ou { user: null }
  adminPublish: ({ phone, name, verify, ad }) => request('/api/admin/publish', { method: 'POST', body: { phone: cleanPhone(phone), name, verify: !!verify, ad } }), // → { ad, pass?, phone, name, verified }
  adminProspects: () => request('/api/admin/prospects'), // → { prospects, posted }
  adminAddProspect: (body) => request('/api/admin/prospects', { method: 'POST', body }), // { phone, name, src, note, item, txt, thumb, photos }
  adminUpdateProspect: (id, body) => request('/api/admin/prospects/' + id, { method: 'PUT', body }), // { status } ou { contacted: true } ou { nowa } ou { name, phone, item }
  adminDeleteProspect: (id) => request('/api/admin/prospects/' + id, { method: 'DELETE' }),
  adminVerifyProspect: (id) => request('/api/admin/prospects/' + id + '/verify', { method: 'POST' }),
  adminProspectPublish: (id, ad) => request('/api/admin/prospects/' + id + '/publish', { method: 'POST', body: { ad } }), // → { ad, prospect }
};

// Adresse complète d'une photo (/api/media/ID → https://bi3li.net/api/media/ID)
export function mediaUrl(u) {
  if (!u) return null;
  return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : API_URL + (u.startsWith('/') ? u : '/' + u); // http(s), file:, content:, data: tels quels
}

// Prix comme sur le site : nouvelles ouguiyas (MRU) ou anciennes ouguiyas
export function priceText(a, lang) {
  if (a.hidep) return lang === 'ar' ? 'راسل البائع لمعرفة السعر' : 'Contactez le vendeur pour le prix';
  if (!(a.price > 0)) return lang === 'ar' ? 'السعر عند الاتصال' : 'Prix sur demande';
  // \u2066…\u2069 : le nombre garde son ordre dans une phrase arabe (sinon « 150 000 » devient « 000 150 »)
  const n = (x) => '\u2066' + Math.round(x).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ') + '\u2069';
  if (a.punit === 'old') return n(a.priceOld || a.price * 10) + (lang === 'ar' ? ' أوقية قديمة' : ' anciennes UM');
  return n(a.price) + (lang === 'ar' ? ' أوقية جديدة' : ' MRU');
}

// Petit cache : la liste contient déjà toutes les informations de chaque annonce
// (le serveur n'a pas de route « une seule annonce »).
export const adCache = new Map();
