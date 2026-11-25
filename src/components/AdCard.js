// Carte d'annonce (2 par ligne sur l'accueil)
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { adCache, mediaUrl, priceText } from '../api';
import { videoPoster } from '../videoPoster';
import { useVoiceUri } from '../voiceHooks';
import VoicePlayer from './VoicePlayer';
import { useLang } from '../i18n';
import { cityName } from '../places';
import FavButton from './FavButton';
import { colors, radius } from '../theme';

export default function AdCard({ ad, preview }) {
  const { lang, rtl, t } = useLang();
  const photo = mediaUrl(ad.photos?.[0]);
  // Sans photo : la vidéo (image prise dans la vidéo) ou le message vocal remplacent la photo
  const videoUrl = !photo && ad.video ? mediaUrl(ad.video) : null;
  const voiceOnly = !photo && !ad.video && !!ad.voice;
  const voiceUri = useVoiceUri(ad.id, ad.voice);
  const [poster, setPoster] = useState(null);
  useEffect(() => {
    if (!videoUrl) return undefined;
    let on = true;
    videoPoster(videoUrl).then((u) => { if (on) setPoster(u); });
    return () => { on = false; };
  }, [videoUrl]);
  const place = [ad.hood, cityName(ad.city, lang)].filter(Boolean).join(' · ');

  function open() {
    if (preview) return; // aperçu dans le formulaire de dépôt
    adCache.set(ad.id, ad);
    router.push('/annonce/' + ad.id);
  }

  return (
    <Pressable onPress={open} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
      <View style={s.photoBox}>
        {photo && <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
        {!photo && videoUrl && (poster
          ? <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          : <View style={[StyleSheet.absoluteFill, s.plain]}><Text style={s.bigIcon}>🎬</Text></View>)}
        {!photo && voiceOnly && <View style={[StyleSheet.absoluteFill, s.plain]}><Text style={s.bigIcon}>🎙️</Text></View>}
        {!photo && !videoUrl && !voiceOnly && <View style={[StyleSheet.absoluteFill, s.plain]}><Text style={s.bigIcon}>📷</Text></View>}
        {!!videoUrl && !!poster && <View style={s.playWrap} pointerEvents="none"><View style={s.play}><Text style={s.playTxt}>▶</Text></View></View>}
        {ad.status === 'sold' && <Text style={s.sold}>{t('sold')}</Text>}
        {ad.photos?.length > 1 && <Text style={[s.count, !!ad.voice && { bottom: 44 }]}>📷 {ad.photos.length}</Text>}
        {/* Vidéo : pastille comme sur le site */}
        {!!photo && !!ad.video && <View style={[s.flags, !!ad.voice && { bottom: 44 }]}><Text style={s.flag}>🎬</Text></View>}
        {/* Message vocal : lecteur en bas de la photo (pause, 10 s, barre) */}
        {!!ad.voice && (
          <View style={s.voiceBar}>
            <VoicePlayer uri={voiceUri} dark compact />
          </View>
        )}
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
  photoBox: { aspectRatio: 1, backgroundColor: '#EEF5F0', overflow: 'hidden' },
  plain: { alignItems: 'center', justifyContent: 'center' },
  bigIcon: { fontSize: 44, opacity: 0.55 },
  voiceBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  fav: { position: 'absolute', top: 6, right: 6 },
  playWrap: { position: 'absolute', top: '50%', left: '50%', width: 52, height: 52, marginLeft: -26, marginTop: -26 },
  play: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  playTxt: { color: '#fff', fontSize: 20, marginLeft: 3 },
  sold: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.danger, color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: '700', fontSize: 12 },
  flags: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 4 },
  flag: { backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 11, overflow: 'hidden' },
  count: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 6, borderRadius: 6, fontSize: 11 },
  body: { padding: 8, gap: 3 },
  title: { fontSize: 14, color: colors.text, fontWeight: '600' },
  price: { fontSize: 14, color: colors.primaryDark, fontWeight: '800' },
  place: { fontSize: 12, color: colors.muted },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
});
