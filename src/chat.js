// Conversations partagées entre les écrans (liste, discussion, pastille rouge de l'onglet).
// Comme le site : on redemande la liste au serveur régulièrement (toutes les 4 s dans une discussion, 20 s ailleurs).
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from './api';
import { useAuth } from './auth';

let convs = null;
let busy = null;
const listeners = new Set();
const emit = () => listeners.forEach((f) => f(convs));

export async function refreshConvs() {
  if (busy) return busy;
  busy = api.convs()
    .then((r) => { convs = r.convs; emit(); return convs; })
    .finally(() => { busy = null; });
  return busy;
}

// Ajout immédiat d'un message envoyé (avant la réponse du serveur suivante)
export function addLocalMessage(convId, msg) {
  if (!convs) return;
  const c = convs.find((x) => x.id === convId);
  if (!c) return;
  c.msgs = [...c.msgs, msg];
  c.updated = msg.t;
  convs = [c, ...convs.filter((x) => x.id !== convId)];
  emit();
}

export function markReadLocal(convId) {
  const c = convs?.find((x) => x.id === convId);
  if (c && c.unread) { c.unread = 0; convs = [...convs]; emit(); }
}

export const resetConvs = () => { convs = null; emit(); };

// Hook : conversations + rafraîchissement automatique pendant que l'écran est affiché
export function useConvs(every = 20000) {
  const { user } = useAuth();
  const [list, setList] = useState(convs);
  const [error, setError] = useState(false);

  useEffect(() => {
    listeners.add(setList);
    return () => listeners.delete(setList);
  }, []);
  useEffect(() => { if (!user) resetConvs(); }, [user]);

  useFocusEffect(useCallback(() => {
    if (!user) return undefined;
    let active = AppState.currentState === 'active';
    const tick = () => active && refreshConvs().then(() => setError(false)).catch(() => setError(true));
    tick();
    const timer = setInterval(tick, every);
    const sub = AppState.addEventListener('change', (st) => { active = st === 'active'; if (active) tick(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [user?.id, every]));

  const unread = (list || []).reduce((n, c) => n + (c.unread || 0), 0);
  return { convs: list, unread, error, refresh: refreshConvs };
}

// Heure courte : « 14:05 », « hier », « 12/11 »
export function shortTime(t, lang) {
  const d = new Date(t);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days === 0) return d.toLocaleTimeString(lang === 'ar' ? 'ar' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return lang === 'ar' ? 'أمس' : 'hier';
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR', { day: '2-digit', month: '2-digit' });
}
