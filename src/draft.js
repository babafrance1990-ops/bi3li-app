// Brouillon d'annonce gardé sur le téléphone (si le vendeur quitte l'écran, rien n'est perdu)
// + mémoire de la dernière ville / quartier / contacts, repris dans l'annonce suivante (comme sur le site).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bi3li_draft';
const LAST = 'bi3li_last_place';
const PHOTO_TTL = 24 * 3600 * 1000; // le serveur efface les photos non publiées après 48 h : on les renvoie après 24 h

export function newDraft(last = {}) {
  return {
    step: 1, cat: '', sub: '', title: '', desc: '', photos: [],
    price: '', punit: '', nego: true, hidep: false, // comme le site : « à discuter » coché par défaut
    city: last.city || 'Nouakchott', hood: last.hood || '', near: '',
    deliv: false, delivNote: '',
    wa: last.wa ?? true, call: last.call ?? true, msg: last.msg ?? false,
    // Immobilier
    deal: '', kind: '', surface: '',
    // Vidéo et message vocal : adresse du serveur (annonce existante) ou fichier sur le téléphone (nouveau)
    video: '', videoUri: '', voice: '', voiceUri: '',
    // Animaux (espèce = sous-catégorie)
    count: '1', sex: '', age: '', breed: '', tabaski: false,
  };
}

export async function loadDraft() {
  let last = {};
  try { last = JSON.parse((await AsyncStorage.getItem(LAST)) || '{}'); } catch {}
  try {
    const d = JSON.parse(await AsyncStorage.getItem(KEY));
    if (d && d.cat !== undefined) {
      // Photos : on garde celles déjà envoyées depuis moins de 24 h ; les autres seront renvoyées si le fichier existe encore
      d.photos = (d.photos || []).map((p) => (p.url && Date.now() - (p.at || 0) < PHOTO_TTL ? { ...p, status: 'ok' } : { ...p, url: null, status: 'todo' }));
      return { draft: d, restored: true, last };
    }
  } catch {}
  return { draft: newDraft(last), restored: false, last };
}

export const saveDraft = (d) => AsyncStorage.setItem(KEY, JSON.stringify(d)).catch(() => {});
export const clearDraft = () => AsyncStorage.removeItem(KEY).catch(() => {});
export const saveLast = (d) =>
  AsyncStorage.setItem(LAST, JSON.stringify({ city: d.city, hood: d.hood, wa: d.wa, call: d.call, msg: d.msg })).catch(() => {});
