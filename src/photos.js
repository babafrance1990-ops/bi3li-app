// Photos d'annonce : choix (galerie ou appareil photo), allègement, envoi au serveur dès l'ajout
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { api } from './api';

export const MAX_PHOTOS = 6; // limite du serveur (les photos au-delà de 6 ne sont pas gardées)
const MAX_SIDE = 1280; // comme le site : photo allégée avant l'envoi (limite serveur 1,5 Mo)

// Ouvre la galerie (plusieurs photos) ou l'appareil photo. Renvoie une liste d'images { uri, width, height }.
export async function pickPhotos(source, left) {
  if (left <= 0) return [];
  const perm = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('permission');
  const opts = { mediaTypes: ['images'], quality: 1 };
  const r = source === 'camera'
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true, selectionLimit: left, orderedSelection: true });
  if (r.canceled) return [];
  return r.assets.slice(0, left).map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

// Réduit la photo (1280 px au plus grand côté), JPEG 70 % → renvoie une image « data:image/jpeg;base64,… »
export async function preparePhoto(p, maxSide = MAX_SIDE, quality = 0.7) {
  const ctx = ImageManipulator.manipulate(p.uri);
  const big = Math.max(p.width || 0, p.height || 0);
  if (!big || big > maxSide) {
    ctx.resize((p.width || 0) >= (p.height || 0) ? { width: maxSide } : { height: maxSide });
  }
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  return 'data:image/jpeg;base64,' + out.base64;
}

// Photo d'annonce : allégée puis envoyée → renvoie l'adresse /api/media/ID
export async function uploadPhoto(p) {
  const r = await api.uploadMedia(await preparePhoto(p));
  return r.url;
}
