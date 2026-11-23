// Carte d'annonce (2 par ligne sur l'accueil)
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { adCache, mediaUrl, priceText } from '../api';
import { useLang } from '../i18n';
import { cityName } from '../places';
import FavButton from './FavButton';
import { colors, radius } from '../theme';

export default function AdCard({ ad, preview }) {
  const { lang, rtl, t } = useLang();
  const photo = mediaUrl(ad.photos?.[0]);
  const place = [ad.hood, cityName(ad.city, lang)].filter(Boolean).join(' · ');

  function open() {
    if (preview) return; // aperçu dans le formulaire de dépôt
    adCache.set(ad.id, ad);
    router.push('/annonce/' + ad.id);
  }

  return (
    <Pressable onPress={open} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
      <View style={s.photoBox}>
        {photo ? <Image source={photo} style={s.photo} contentFit="cover" transition={150} /> : <Text style={s.noPhoto}>📷</Text>}
        {ad.status === 'sold' && <Text style={s.sold}>{t('sold')}</Text>}
        {ad.photos?.length > 1 && <Text style={s.count}>📷 {ad.photos.length}</Text>}
        {!preview && <FavButton adId={ad.id} size={18} style={s.fav} />}
      </View>
      <View style={s.body}>
        <Text style={[s.title, rtl && s.rtl]} numberOfLines={2}>{ad.title}</Text>
        <Text style={[s.price, rtl && s.rtl]} numberOfLines={1}>{priceText(ad, lang)}</Text>
        {!!place && <Text style={[s.place, rtl && s.rtl]} numberOfLines={1}>📍 {place}</Text>}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, margin: 5, backgroundColor: colors.white, borderRadius: radius.m, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  photoBox: { aspectRatio: 1, backgroundColor: '#eef2ef', alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  noPhoto: { fontSize: 32, opacity: 0.4 },
  fav: { position: 'absolute', top: 6, right: 6 },
  sold: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.danger, color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: '700', fontSize: 12 },
  count: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 6, borderRadius: 6, fontSize: 11 },
  body: { padding: 8, gap: 3 },
  title: { fontSize: 14, color: colors.text, fontWeight: '600' },
  price: { fontSize: 14, color: colors.primaryDark, fontWeight: '800' },
  place: { fontSize: 12, color: colors.muted },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
});
