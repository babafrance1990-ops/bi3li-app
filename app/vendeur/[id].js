// Page d'un vendeur ou d'une boutique : identité, note, abonnés, « répond vite », boutique (adresse, horaires),
// suivre, WhatsApp de la boutique, laisser un avis (seulement après un échange de messages), ses annonces, les avis.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api, mediaUrl } from '../../src/api';
import { useAuth } from '../../src/auth';
import AdCard from '../../src/components/AdCard';
import { useLang } from '../../src/i18n';
import { notify } from '../../src/notify';
import { cityName } from '../../src/places';
import { getAllAds } from '../../src/store';
import { colors, radius } from '../../src/theme';

const T = {
  fr: {
    since: 'Membre depuis {d}', verified: 'Numéro vérifié ✓', shopOk: 'Boutique vérifiée ✓', agency: 'Agence immobilière', reactive: '⚡ Répond vite',
    followers: '{n} abonné(s)', follow: '+ Suivre', following: '✓ Abonné', ads: 'Annonces ({n})', noAds: 'Aucune annonce en ligne.',
    reviews: 'Avis ({n})', noRev: 'Pas encore d’avis.', more: 'Voir tous les avis', less: 'Réduire', rate: '⭐ Laisser un avis', myRate: '⭐ Modifier mon avis',
    rateT: 'Votre avis sur {n}', ratePh: 'Votre commentaire (facultatif)', send: 'Envoyer', cancel: 'Annuler', thanks: 'Merci pour votre avis !',
    noContact: 'Vous pouvez donner un avis après avoir échangé des messages avec ce vendeur.', err: 'Action impossible. Vérifiez votre connexion.',
    wa: 'WhatsApp de la boutique', addr: 'Adresse', hours: 'Horaires', market: 'Marché', deliv: '🚚 Livraison possible', share: 'Partager la boutique',
  },
  ar: {
    since: 'عضو منذ {d}', verified: 'رقم مؤكَّد ✓', shopOk: 'متجر موثّق ✓', agency: 'وكالة عقارية', reactive: '⚡ يرد بسرعة',
    followers: 'المتابعون: {n}', follow: '+ متابعة', following: '✓ تتابعه', ads: 'الإعلانات ({n})', noAds: 'لا توجد إعلانات منشورة.',
    reviews: 'التقييمات ({n})', noRev: 'لا توجد تقييمات بعد.', more: 'عرض كل التقييمات', less: 'إخفاء', rate: '⭐ قيّم هذا البائع', myRate: '⭐ تعديل تقييمي',
    rateT: 'تقييمك لـ {n}', ratePh: 'تعليقك (اختياري)', send: 'إرسال', cancel: 'إلغاء', thanks: 'شكراً على تقييمك!',
    noContact: 'يمكنك التقييم بعد تبادل الرسائل مع هذا البائع.', err: 'تعذّر تنفيذ العملية. تحقق من الاتصال.',
    wa: 'واتساب المتجر', addr: 'العنوان', hours: 'أوقات العمل', market: 'السوق', deliv: '🚚 التوصيل ممكن', share: 'مشاركة المتجر',
  },
};
const Stars = ({ n, size = 14 }) => <Text style={{ fontSize: size, color: '#f59e0b' }}>{'★'.repeat(Math.round(n))}<Text style={{ color: '#d1d5db' }}>{'★'.repeat(5 - Math.round(n))}</Text></Text>;

export default function Vendeur() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const [u, setU] = useState(null);
  const [ads, setAds] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [allRev, setAllRev] = useState(false);
  const [rating, setRating] = useState(null); // { stars, txt } pendant l'écriture d'un avis
  const [busy, setBusy] = useState(false);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  const load = useCallback(() => {
    api.user(id).then((r) => setU(r.user)).catch(() => setU(false));
    api.userReviews(id).then((r) => setReviews(r.reviews || [])).catch(() => {});
    getAllAds().then((all) => setAds(all.filter((a) => a.owner === id && a.status !== 'sold').sort((x, y) => y.t - x.t))).catch(() => setAds([]));
  }, [id, user?.id]);
  useEffect(() => { load(); }, [load]);

  if (u === false) return <Text style={{ padding: 20 }}>{T[lang].err}</Text>;
  if (!u) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const shop = u.shop;
  const name = shop?.name || u.name;
  const me = user && user.id === u.id;

  async function follow() {
    if (!user) { router.push('/connexion'); return; }
    const on = !u.following;
    setU({ ...u, following: on, followers: u.followers + (on ? 1 : -1) });
    try { await api.follow(u.id, on); } catch { setU(u); notify(t('err')); }
  }
  async function sendReview() {
    if (!rating?.stars) return;
    setBusy(true);
    try {
      await api.review(u.id, rating.stars, rating.txt || '');
      setRating(null); notify(t('thanks')); load();
    } catch (e) { notify(e.code === 'no_contact' ? t('noContact') : t('err')); } finally { setBusy(false); }
  }
  const shareLink = shop?.slug ? 'https://bi3li.net/?b=' + shop.slug : null;
  const shown = allRev ? reviews : reviews.slice(0, 3);

  const header = (
    <View style={{ gap: 10, padding: 5 }}>
      <View style={s.card}>
        <View style={[row, { gap: 14, alignItems: 'center' }]}>
          {u.avatar ? <Image source={mediaUrl(u.avatar)} style={s.avatar} /> : <View style={[s.avatar, s.avatarEmpty]}><Text style={s.initial}>{(name || '?').trim().charAt(0).toUpperCase()}</Text></View>}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.name, al]}>{shop ? '🏪 ' : ''}{name}</Text>
            {shop && shop.name !== u.name && <Text style={[s.muted, al]}>{u.name}</Text>}
            <Text style={[s.muted, al]}>{[u.city && '📍 ' + cityName(u.city, lang), t('since', { d: new Date(u.since).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR', { month: 'long', year: 'numeric' }) })].filter(Boolean).join('  ·  ')}</Text>
            {u.rating?.n > 0 && <View style={[row, { gap: 6, alignItems: 'center' }]}><Stars n={u.rating.avg} /><Text style={s.muted}>{u.rating.avg} ({u.rating.n})</Text></View>}
          </View>
        </View>
        <View style={[s.badges, row]}>
          {shop?.verified && <Text style={[s.badge, s.badgeOk]}>{t('shopOk')}</Text>}
          {shop?.agency && <Text style={s.badge}>🏠 {t('agency')}</Text>}
          {u.verified && <Text style={[s.badge, s.badgeOk]}>{t('verified')}</Text>}
          {u.reactive && <Text style={s.badge}>{t('reactive')}</Text>}
          <Text style={s.badge}>👥 {t('followers', { n: u.followers })}</Text>
        </View>
        {shop && (
          <View style={{ gap: 4 }}>
            {!!shop.desc && <Text style={[s.text, al]}>{shop.desc}</Text>}
            {!!shop.addr && <Text style={[s.muted, al]}>📍 {t('addr')} : {shop.addr}</Text>}
            {!!shop.market && <Text style={[s.muted, al]}>🏬 {t('market')} : {shop.market}</Text>}
            {!!shop.hours && <Text style={[s.muted, al]}>🕘 {t('hours')} : {shop.hours}</Text>}
            {shop.deliv && <Text style={[s.muted, al]}>{t('deliv')}{shop.delivNote ? ' — ' + shop.delivNote : ''}</Text>}
          </View>
        )}
        {!me && (
          <View style={[row, { gap: 8, flexWrap: 'wrap' }]}>
            <Pressable style={[s.btn, u.following ? s.btnLight : s.btnMain]} onPress={follow}>
              <Text style={[s.btnTxt, u.following && { color: colors.primaryDark }]}>{u.following ? t('following') : t('follow')}</Text>
            </Pressable>
            {shop?.wa && (
              <Pressable style={[s.btn, { backgroundColor: colors.whatsapp }]} onPress={() => Linking.openURL('https://wa.me/222' + shop.wa)}>
                <Text style={s.btnTxt}>🟢 {t('wa')}</Text>
              </Pressable>
            )}
            {u.canReview && (
              <Pressable style={[s.btn, s.btnLight]} onPress={() => setRating(u.myReview || { stars: 0, txt: '' })}>
                <Text style={[s.btnTxt, { color: colors.primaryDark }]}>{u.myReview ? t('myRate') : t('rate')}</Text>
              </Pressable>
            )}
          </View>
        )}
        {shareLink && (
          <Pressable onPress={() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(name + '\n' + shareLink))}>
            <Text style={[s.link, al]}>🔗 {t('share')}</Text>
          </Pressable>
        )}
      </View>
      <Text style={[s.h, al]}>{t('ads', { n: ads ? ads.length : '…' })}</Text>
    </View>
  );

  const footer = (
    <View style={{ padding: 5, gap: 8, marginTop: 10 }}>
      <Text style={[s.h, al]}>{t('reviews', { n: reviews.length })}</Text>
      {reviews.length === 0 ? <Text style={[s.muted, al]}>{t('noRev')}</Text> : shown.map((r, i) => (
        <View key={i} style={s.review}>
          <View style={[row, { justifyContent: 'space-between' }]}>
            <Text style={s.revName}>{r.name}</Text>
            <Stars n={r.stars} />
          </View>
          {!!r.txt && <Text style={[s.text, al]}>{r.txt}</Text>}
          <Text style={[s.muted, al, { fontSize: 11 }]}>{new Date(r.t).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR')}</Text>
        </View>
      ))}
      {reviews.length > 3 && <Pressable onPress={() => setAllRev(!allRev)}><Text style={[s.link, { textAlign: 'center' }]}>{allRev ? t('less') : t('more')}</Text></Pressable>}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: name }} />
      <FlatList
        data={ads || []}
        numColumns={2}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AdCard ad={item} />}
        contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
        ListHeaderComponent={header}
        ListEmptyComponent={ads ? <Text style={[s.muted, { textAlign: 'center', padding: 20 }]}>{t('noAds')}</Text> : <ActivityIndicator color={colors.primary} />}
        ListFooterComponent={footer}
      />

      {/* Écrire un avis */}
      <Modal visible={!!rating} transparent animationType="fade" onRequestClose={() => setRating(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>{t('rateT', { n: name })}</Text>
            <View style={[row, { justifyContent: 'center', gap: 6 }]}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} hitSlop={6} onPress={() => setRating({ ...rating, stars: n })}>
                  <Text style={{ fontSize: 38, color: n <= (rating?.stars || 0) ? '#f59e0b' : '#d1d5db' }}>★</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={[s.input, al]} value={rating?.txt || ''} onChangeText={(v) => setRating({ ...rating, txt: v })}
              placeholder={t('ratePh')} placeholderTextColor={colors.muted} multiline maxLength={500} />
            <View style={[row, { gap: 8 }]}>
              <Pressable style={[s.btn, s.btnLight, { flex: 1 }]} onPress={() => setRating(null)}><Text style={[s.btnTxt, { color: colors.primaryDark }]}>{t('cancel')}</Text></Pressable>
              <Pressable style={[s.btn, s.btnMain, { flex: 1 }, !(rating?.stars) && { opacity: 0.4 }]} disabled={!rating?.stars || busy} onPress={sendReview}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{t('send')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  avatarEmpty: { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 28, fontWeight: '800', color: colors.primaryDark },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  text: { fontSize: 14, color: colors.text, lineHeight: 21 },
  badges: { flexWrap: 'wrap', gap: 6 },
  badge: { fontSize: 12, fontWeight: '700', color: colors.text, backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#dcfce7', color: colors.primaryDark },
  btn: { borderRadius: radius.m, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnMain: { backgroundColor: colors.primary },
  btnLight: { backgroundColor: '#e8f5ec' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  link: { color: colors.primaryDark, fontWeight: '700' },
  h: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 6 },
  review: { backgroundColor: colors.white, borderRadius: radius.m, padding: 12, gap: 4, borderWidth: 1, borderColor: colors.border },
  revName: { fontWeight: '700', color: colors.text },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.white, borderRadius: radius.l, padding: 18, gap: 14 },
  sheetT: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 12, minHeight: 80, fontSize: 15, backgroundColor: colors.bg, textAlignVertical: 'top', color: colors.text },
});
