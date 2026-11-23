// Compte connecté, gardé de façon sécurisée sur le téléphone (expo-secure-store)
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import { useLang } from './i18n';
import { registerPush, unregisterPush } from './push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const { lang } = useLang();

  // Connecté : on enregistre le téléphone pour les notifications (et de nouveau si la langue change)
  useEffect(() => { if (user?.id) registerPush(lang); }, [user?.id, lang]);

  useEffect(() => {
    (async () => {
      if (await getToken()) {
        try { setUser((await api.me()).user); } catch (e) { if (e.status === 401) await setToken(null); }
      }
      setReady(true);
    })();
  }, []);

  // Le serveur renvoie { token, user } à la connexion comme à la création du compte
  async function signIn(r) {
    await setToken(r.token);
    setUser(r.user);
  }
  const login = async (phone, code) => signIn(await api.login(phone, code));
  const signInWith = (r) => signIn(r); // connexion obtenue autrement (WhatsApp « code oublié »)
  const register = async (phone, code, name) => signIn(await api.register(phone, code, name));

  // Recherches enregistrées (alertes) : gardées dans le compte, comme sur le site
  async function saveSearches(list) {
    setUser((u) => (u ? { ...u, searches: list } : u));
    try { await api.updateMe({ searches: list }); } catch {}
  }
  // Favoris ♥ : liste d'identifiants d'annonces gardée dans le compte (même champ « favs » que le site, 500 max)
  async function toggleFav(adId) {
    if (!user) return false;
    const favs = user.favs || [];
    const list = favs.includes(adId) ? favs.filter((x) => x !== adId) : [adId, ...favs].slice(0, 500);
    setUser((u) => (u ? { ...u, favs: list } : u));
    try { await api.updateMe({ favs: list }); } catch { setUser((u) => (u ? { ...u, favs } : u)); }
    return true;
  }
  async function reloadUser() {
    try { setUser((await api.me()).user); } catch {}
  }

  async function logout() {
    await unregisterPush(); // avant la déconnexion : le serveur doit savoir de quel compte il s'agit
    try { await api.logout(); } catch {}
    await setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, signInWith, logout, saveSearches, reloadUser, toggleFav }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
