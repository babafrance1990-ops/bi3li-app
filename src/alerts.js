// Alertes « 🔔 نبّهني » = recherches enregistrées dans le compte (même format que le site : user.searches).
// Une alerte compte les annonces publiées après sa date « seen » qui correspondent à la recherche (hors mes annonces).
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from './auth';
import { EMPTY_FILTERS, search } from './search';
import { getAllAds } from './store';

// Recherche de l'écran « Recherche » → alerte enregistrable
export function toSaved({ q, cat, f }) {
  const now = Date.now();
  const s = {
    q: (q || '').trim(), cat: cat || '', city: f.city || '', hood: f.hood || '',
    pmin: f.pmin || '', pmax: f.pmax || '', seller: f.seller || '', tonly: false, t: now, seen: now, alert: true,
  };
  // immobilier : mêmes clés que le site (mode = rent / buy, kind)
  if (cat === 'immo' && (f.deal || f.kind)) s.f = { ...(f.deal ? { mode: f.deal === 'rent' ? 'rent' : 'buy' } : {}), ...(f.kind ? { kind: f.kind } : {}) };
  return s;
}

// Alerte → recherche (pour l'écran « Recherche » et pour compter les nouveautés)
export function fromSaved(s) {
  const f = { ...EMPTY_FILTERS, city: s.city || '', hood: s.hood || '', pmin: s.pmin || '', pmax: s.pmax || '', seller: s.seller || '' };
  if (s.f?.mode) f.deal = s.f.mode === 'rent' ? 'rent' : 'sale';
  if (s.f?.kind) f.kind = s.f.kind;
  return { q: s.q || '', cat: s.cat || null, f };
}

export const sKey = (x) => [x.q || '', x.cat || '', x.city || '', x.hood || '', x.pmin || '', x.pmax || '', x.seller || '', JSON.stringify(x.f || null)].join('|');

export function newFor(ads, s, meId) {
  if (!ads || s.alert === false) return 0;
  const seen = +s.seen || +s.t || 0;
  return search(ads, fromSaved(s)).filter((a) => a.t > seen && a.owner !== meId).length;
}

// Hook : nombre total de nouvelles annonces pour mes alertes (pastille), recalculé à l'affichage de l'écran
export function useAlertCount() {
  const { user } = useAuth();
  const [n, setN] = useState(0);
  useFocusEffect(useCallback(() => {
    const list = user?.searches || [];
    if (!list.length) { setN(0); return; }
    getAllAds().then((ads) => setN(list.reduce((t, s) => t + newFor(ads, s, user.id), 0))).catch(() => {});
  }, [user?.id, user?.searches]));
  return n;
}

// Recherche à lancer à l'ouverture de l'écran « Recherche » (depuis « Mes alertes »)
let pending = null;
export const setPendingSearch = (x) => { pending = x; };
export const takePendingSearch = () => { const x = pending; pending = null; return x; };
