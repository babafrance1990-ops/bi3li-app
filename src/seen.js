// Annonces consultées, gardées sur le téléphone (60 au maximum, les plus récentes en premier)
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bi3li_seen';

export async function rememberSeen(ad) {
  if (!ad?.id) return;
  try {
    const list = JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
    const next = [ad, ...list.filter((x) => x.id !== ad.id)].slice(0, 60);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export async function loadSeen() {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); } catch { return []; }
}

export async function clearSeen() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
