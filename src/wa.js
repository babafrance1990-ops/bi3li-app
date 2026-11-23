// Vérification par WhatsApp (même méthode que le site) :
// 1) le serveur crée un code ; 2) WhatsApp s'ouvre avec « تأكيد بيعلي، الرمز 123456 » adressé au numéro de Bi3li ;
// 3) l'utilisateur envoie le message ; 4) on demande au serveur toutes les 3 secondes (et au retour dans l'appli) si c'est reçu.
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { api } from './api';

export const WA_TEXT = {
  verify: { fr: 'Vérification Bi3li, code {c}', ar: 'تأكيد بيعلي، الرمز {c}' },
  login: { fr: 'Connexion Bi3li, code {c}', ar: 'دخول بيعلي، الرمز {c}' },
};

// Ouvre WhatsApp directement (application), sinon le lien wa.me
export async function openWhatsApp(num, text) {
  const app = 'whatsapp://send?phone=' + num + '&text=' + encodeURIComponent(text);
  const web = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
  try {
    if (Platform.OS !== 'web' && (await Linking.canOpenURL(app))) { await Linking.openURL(app); return; }
  } catch {}
  Linking.openURL(web);
}

// job : { purpose, code, nonce, wa, t, phone, expired? } ; onDone(réponse du serveur) appelé une seule fois
export function useWaJob(lang, onDone) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const ref = useRef(null);
  ref.current = job;

  const message = (j) => (WA_TEXT[j.purpose === 'verify' ? 'verify' : 'login'][lang] || '').replace('{c}', j.code);

  async function start(purpose, phone) {
    setError('');
    try {
      const r = await api.waStart(purpose, phone);
      const j = { purpose, code: r.code, nonce: r.nonce, wa: r.wa, t: Date.now(), phone };
      setJob(j);
      openWhatsApp(r.wa, message(j));
    } catch (e) { setError(e.code || 'net'); }
  }
  const reopen = () => job && openWhatsApp(job.wa, message(job));
  const cancel = () => setJob(null);

  useEffect(() => {
    if (!job || job.expired) return undefined;
    let stop = false;
    const poll = async () => {
      const j = ref.current;
      if (stop || !j || j.expired) return;
      if (Date.now() - j.t > 15 * 60000) { setJob({ ...j, expired: true }); return; }
      try {
        const r = await api.waStatus(j.code, j.nonce);
        if (stop) return;
        if (r.done) { stop = true; setJob(null); onDone(r, j); } else if (r.expired) setJob({ ...j, expired: true });
      } catch {}
    };
    const timer = setInterval(poll, 3000);
    // retour depuis WhatsApp : on vérifie tout de suite
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') poll(); });
    return () => { stop = true; clearInterval(timer); sub.remove(); };
  }, [job?.code, job?.expired]);

  return { job, error, start, reopen, cancel };
}
