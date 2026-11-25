// Fiche annonce : galerie qui défile, prix, lieu, description, vendeur, boutons WhatsApp / Appeler / Message
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adCache, api, mediaUrl, priceText } from '../../src/api';
import { catById } from '../../src/categories';
import { notify } from '../../src/notify';
import { useAuth } from '../../src/auth';
import BackButton from '../../src/components/BackButton';
import FavButton from '../../src/components/FavButton';
import { cityName } from '../../src/places';
import { getAllAds } from '../../src/store';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
// Raisons de signalement (le texte français est envoyé à l'équipe, comme sur le site)
const REASONS = [
  ['scam', 'Arnaque ou fausse annonce', 'احتيال أو إعلان مزيف'],
  ['sold', 'Déjà vendu', 'تم بيعه'],
  ['price', 'Prix faux', 'السعر غير صحيح'],
  ['cat', 'Mauvaise catégorie', 'فئة خاطئة'],
  ['bad', 'Contenu interdit ou choquant', 'محتوى ممنوع أو مسيء'],
  ['other', 'Autre', 'سبب آخر'],
];

export default function Annonce() {
  const { id } = useLocalSearchParams();
  const { lang, t, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [viewer, setViewer] = useState(null);       // photo ouverte en plein écran (numéro) ou null
  const [viewerIdx, setViewerIdx] = useState(null);
  const [report, setReport] = useState(null);       // { reason, txt } pendant un signalement
  const [ad, setAd] = useState(() => adCache.get(id));
  const [missing, setMissing] = useState(false);
  const [seller, setSeller] = useState(null);
  const [index, setIndex] = useState(0);
  const zoomed = useRef(false);                     // vrai quand la photo est zoomée : pas de fermeture par glissement
  // Glisser l'image vers le bas (sans zoom) ferme la photo, comme sur le site
  const swipe = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !zoomed.current && g.dy > 15 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderRelease: (_, g) => { if (g.dy > 120) { zoomed.current = false; setViewer(null); } },
  })).current;

  // Annonce ouverte directement (lien, page rechargée) : on la cherche dans la liste complète
  useEffect(() => {
    if (ad) return;
    const find = (all) => all.find((x) => x.id === id);
    getAllAds().then((all) => find(all) || getAllAds({ force: true }).then(find)) // annonce toute récente : liste rechargée
      .then((a) => { if (a) setAd(a); else setMissing(true); }).catch(() => setMissing(true));
  }, [id]);

  useEffect(() => {
    if (!ad) return;
    api.view(ad.id).catch(() => {});
    api.user(ad.owner).then((r) => setSeller(r.user)).catch(() => {});
  }, [ad?.id]);

  if (!ad) return missing ? <Text style={{ padding: 20 }}>{t('netErr')}</Text> : <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const photos = (ad.photos || []).map(mediaUrl);
  const phone = String(ad.phone || '').replace(/\D/g, '');
  const cat = catById(ad.cat);
  const link = 'https://bi3li.net/?annonce=' + ad.id; // même lien que le site (aperçu WhatsApp)
  const align = rtl ? { textAlign: 'right', writingDirection: 'rtl' } : null;

  const whatsapp = () => {
    api.contact(ad.id, 'wa').catch(() => {});
    const msg = (lang === 'ar' ? 'السلام عليكم، رأيت إعلانك على بيعلي: ' : 'Bonjour, j\'ai vu votre annonce sur Bi3li : ') + ad.title + '\n' + link;
    Linking.openURL('https://wa.me/222' + phone + '?text=' + encodeURIComponent(msg));
  };
  const call = () => { api.contact(ad.id, 'call').catch(() => {}); Linking.openURL('tel:+222' + phone); };
  async function sendReport() {
    const r = REASONS.find((x) => x[0] === report.reason);
    try {
      await api.reportAd(ad.id, (r ? r[1] : report.reason) + (report.txt ? ' — ' + report.txt.trim() : ''));
      setReport(null);
      notify(lang === 'ar' ? 'شكراً، سيراجع فريق بيعلي هذا الإعلان.' : 'Merci, l’équipe Bi3li va vérifier cette annonce.');
    } catch { notify(t('netErr')); }
  }

  // Message : ouvre (ou retrouve) la conversation avec le vendeur pour cette annonce
  async function message() {
    if (!user) { router.push('/connexion'); return; }
    if (ad.owner === user.id) { notify(lang === 'ar' ? 'هذا إعلانك.' : 'C’est votre annonce.'); return; }
    if (opening) return;
    setOpening(true);
    try {
      const r = await api.openConv(ad.id);
      router.push({ pathname: '/conversation/[id]', params: { id: r.id, adId: ad.id } });
    } catch (e) {
      notify(e.code === 'own_ad' ? (lang === 'ar' ? 'هذا إعلانك.' : 'C’est votre annonce.') : t('netErr'));
    } finally { setOpening(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Stack.Screen options={{
        title: cat ? cat[lang] : '',
        // en arabe : favori à gauche, retour à droite ; en français : favori à droite, retour natif à gauche
        headerLeft: rtl ? () => <FavButton adId={ad.id} size={22} style={{ backgroundColor: 'transparent' }} /> : undefined,
        headerRight: rtl ? () => <BackButton /> : () => <FavButton adId={ad.id} size={22} style={{ backgroundColor: 'transparent' }} />,
      }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {photos.length > 0 ? (
          <View>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => u + i}
              onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item, index: i }) => (
                <Pressable onPress={() => setViewer(i)}>
                  <Image source={item} style={{ width: W, height: W }} contentFit="cover" />
                </Pressable>
              )}
            />
            {photos.length > 1 && <Text style={s.counter}>{index + 1} / {photos.length}</Text>}
          </View>
        ) : <View style={[s.noPhoto, { height: W * 0.5 }]}><Text style={{ fontSize: 40, opacity: 0.4 }}>📷</Text></View>}

        <View style={s.box}>
          {ad.status === 'sold' && <Text style={s.sold}>{t('sold')}</Text>}
          <Text style={[s.title, align]}>{ad.title}</Text>
          <Text style={[s.price, align]}>{priceText(ad, lang)}</Text>
          <Text style={[s.muted, align]}>📍 {[ad.hood, cityName(ad.city, lang)].filter(Boolean).join(' · ')}  ·  {new Date(ad.t).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR')}</Text>

          {!!ad.desc && (
            <>
              <Text style={[s.h2, align]}>{t('description')}</Text>
              <Text style={[s.desc, align]}>{ad.desc}</Text>
            </>
          )}

          <Text style={[s.h2, align]}>{t('seller')}</Text>
          <Pressable onPress={() => router.push('/vendeur/' + ad.owner)} style={[s.seller, rtl && { flexDirection: 'row-reverse' }]}>
            {seller?.avatar ? <Image source={mediaUrl(seller.avatar)} style={s.avatar} /> : <View style={[s.avatar, s.avatarEmpty]}><Text>👤</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={[s.sellerName, align]}>{ad.shop?.name || ad.seller}</Text>
              <Text style={[s.muted, align, seller?.verified && { color: colors.primaryDark }]}>
                {seller ? (seller.verified ? t('verifiedNum') : t('notVerified')) : ' '}
                {seller?.rating?.n ? '   ⭐ ' + seller.rating.avg + ' (' + seller.rating.n + ')' : ''}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 20 }}>{rtl ? '‹' : '›'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/vendeur/' + ad.owner)}>
            <Text style={[s.link, align]}>{lang === 'ar' ? 'كل إعلانات هذا البائع ←' : 'Toutes les annonces de ce vendeur →'}</Text>
          </Pressable>

          {!(user && ad.owner === user.id) && (
            <Pressable onPress={() => (user ? setReport({ reason: '', txt: '' }) : router.push('/connexion'))} style={{ marginTop: 18 }}>
              <Text style={[s.report, align]}>🚩 {lang === 'ar' ? 'الإبلاغ عن هذا الإعلان' : 'Signaler cette annonce'}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Photos en plein écran (toucher une photo) : on fait défiler, on peut zoomer avec deux doigts sur iPhone */}
      <Modal visible={viewer !== null} transparent={false} animationType="fade" onRequestClose={() => { zoomed.current = false; setViewer(null); }}>
        <View style={{ flex: 1, backgroundColor: '#000' }} {...swipe.panHandlers}>
          <FlatList
            data={photos} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewer || 0} getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            keyExtractor={(u, i) => 'v' + i}
            onMomentumScrollEnd={(e) => setViewerIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => (
              <ScrollView style={{ width: W }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                maximumZoomScale={4} minimumZoomScale={1} centerContent showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}
                scrollEventThrottle={16} onScroll={(e) => { zoomed.current = e.nativeEvent.zoomScale > 1.01; }}>
                <Image source={item} style={{ width: W, height: H * 0.8 }} contentFit="contain" />
              </ScrollView>
            )}
          />
          {/* Retour : flèche en haut, toujours visible (sinon glisser l'image vers le bas) */}
          <Pressable onPress={() => { zoomed.current = false; setViewer(null); }} hitSlop={12}
            style={[s.back, { top: insets.top + 8 }, rtl ? { right: 12 } : { left: 12 }]}>
            <Text style={s.backTxt}>{rtl ? '›' : '‹'}  {lang === 'ar' ? 'رجوع' : 'Retour'}</Text>
          </Pressable>
          {photos.length > 1 && <Text style={[s.viewerCount, { bottom: insets.bottom + 20 }]}>{(viewerIdx ?? viewer ?? 0) + 1} / {photos.length}</Text>}
        </View>
      </Modal>

      {/* Signaler l'annonce */}
      <Modal visible={!!report} transparent animationType="fade" onRequestClose={() => setReport(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>🚩 {lang === 'ar' ? 'لماذا تبلغ عن هذا الإعلان؟' : 'Pourquoi signaler cette annonce ?'}</Text>
            {REASONS.map(([k, fr, ar]) => (
              <Pressable key={k} style={[s.reason, report?.reason === k && s.reasonOn]} onPress={() => setReport({ ...report, reason: k })}>
                <Text style={[s.reasonTxt, align, report?.reason === k && { color: '#fff' }]}>{lang === 'ar' ? ar : fr}</Text>
              </Pressable>
            ))}
            <TextInput style={[s.input, align]} value={report?.txt || ''} onChangeText={(v) => setReport({ ...report, txt: v })}
              placeholder={lang === 'ar' ? 'تفاصيل (اختياري)' : 'Détails (facultatif)'} placeholderTextColor={colors.muted} multiline maxLength={250} />
            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8 }}>
              <Pressable style={[s.sheetBtn, { backgroundColor: '#e8f5ec' }]} onPress={() => setReport(null)}>
                <Text style={[s.sheetBtnTxt, { color: colors.primaryDark }]}>{lang === 'ar' ? 'إلغاء' : 'Annuler'}</Text>
              </Pressable>
              <Pressable style={[s.sheetBtn, { backgroundColor: colors.danger }, !report?.reason && { opacity: 0.4 }]} disabled={!report?.reason} onPress={sendReport}>
                <Text style={s.sheetBtnTxt}>{lang === 'ar' ? 'إرسال البلاغ' : 'Envoyer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {user && ad.owner === user.id ? (
        <View style={[s.bar, { paddingBottom: 10 + insets.bottom }]}>
          <Pressable style={[s.action, { backgroundColor: colors.primary }]} onPress={() => router.push('/modifier/' + ad.id)}>
            <Text style={s.actionTxt}>✏️ {lang === 'ar' ? 'تعديل' : 'Modifier'}</Text>
          </Pressable>
          <Pressable style={[s.action, s.actionLight]} onPress={() => router.push('/mes-annonces')}>
            <Text style={[s.actionTxt, { color: colors.primaryDark }]}>📋 {lang === 'ar' ? 'إعلاناتي' : 'Mes annonces'}</Text>
          </Pressable>
        </View>
      ) : ad.status !== 'sold' && !!phone && (
        <View style={[s.bar, { paddingBottom: 10 + insets.bottom }]}>
          <Pressable style={[s.action, { backgroundColor: colors.whatsapp }]} onPress={whatsapp}><Text style={s.actionTxt}>🟢 {t('whatsapp')}</Text></Pressable>
          <Pressable style={[s.action, { backgroundColor: colors.primary }]} onPress={call}><Text style={s.actionTxt}>📞 {t('call')}</Text></Pressable>
          <Pressable style={[s.action, s.actionLight]} onPress={message}><Text style={[s.actionTxt, { color: colors.primaryDark }]}>💬 {t('message')}</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  noPhoto: { backgroundColor: '#eef2ef', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  box: { padding: 16, gap: 6 },
  sold: { alignSelf: 'flex-start', backgroundColor: colors.danger, color: '#fff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  price: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  muted: { color: colors.muted, fontSize: 13 },
  h2: { fontSize: 16, fontWeight: '700', marginTop: 16, color: colors.text },
  desc: { fontSize: 15, lineHeight: 23, color: colors.text },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.m, backgroundColor: colors.bg },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarEmpty: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.primaryDark, fontWeight: '700', marginTop: 8 },
  report: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  back: { position: 'absolute', zIndex: 10, elevation: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  backTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewerCount: { position: 'absolute', alignSelf: 'center', color: '#fff', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.white, borderRadius: radius.l, padding: 18, gap: 10 },
  sheetT: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: colors.text, marginBottom: 4 },
  reason: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, paddingVertical: 11, paddingHorizontal: 14 },
  reasonOn: { backgroundColor: colors.danger, borderColor: colors.danger },
  reasonTxt: { fontSize: 15, color: colors.text, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 12, minHeight: 60, fontSize: 15, backgroundColor: colors.bg, textAlignVertical: 'top', color: colors.text },
  sheetBtn: { flex: 1, borderRadius: radius.m, paddingVertical: 13, alignItems: 'center' },
  sheetBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sellerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, padding: 10, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border },
  action: { flex: 1, borderRadius: radius.m, paddingVertical: 13, alignItems: 'center' },
  actionLight: { backgroundColor: '#e8f5ec' },
  actionTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
