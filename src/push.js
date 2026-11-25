// Notifications sur le téléphone (nouveau message, nouvelle annonce d'une alerte).
// Le serveur de bi3li.net les envoie par le service gratuit d'Expo ; ici on enregistre le téléphone
// et on ouvre le bon écran quand on touche une notification.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { api } from './api';

const WEB = Platform.OS === 'web';
let current = null; // jeton de ce téléphone (ExponentPushToken[…])

if (!WEB) {
  // Application ouverte : la notification s'affiche quand même en haut de l'écran
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

// Identifiant du projet Expo (écrit dans app.json par « npx eas-cli init »)
const projectId = () => Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

// Demande l'autorisation puis enregistre le téléphone sur le compte connecté. Ne fait rien si c'est impossible.
export async function registerPush(lang) {
  try {
    if (WEB || !Device.isDevice) return null; // pas sur le web ni sur un simulateur
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Bi3li', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200], lightColor: '#0B6B3A',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    const id = projectId();
    if (!id) { console.warn('Notifications : projectId manquant — lancer « npx eas-cli init » dans le dossier'); return null; }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
    await api.pushRegister(token, Platform.OS, lang);
    current = token;
    return token;
  } catch (e) {
    console.warn('Notifications indisponibles :', e?.message || e);
    return null;
  }
}

// À la déconnexion : ce téléphone ne doit plus recevoir les notifications de ce compte
export async function unregisterPush() {
  if (!current) return;
  try { await api.pushUnregister(current); } catch {}
  current = null;
}

// Toucher une notification → ouvrir la discussion ou l'annonce
function openFrom(response) {
  const d = response?.notification?.request?.content?.data || {};
  if (d.type === 'msg' && d.conv) router.push('/conversation/' + d.conv);
  else if (d.type === 'ad' && d.ad) router.push('/annonce/' + d.ad);
}

export function usePushNavigation() {
  useEffect(() => {
    if (WEB) return undefined;
    let done = false;
    // application ouverte par une notification alors qu'elle était fermée
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r && !done) { done = true; setTimeout(() => openFrom(r), 300); }
    }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((r) => { done = true; openFrom(r); });
    return () => sub.remove();
  }, []);
}
