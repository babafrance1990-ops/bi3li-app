// Discussion entre un acheteur et un vendeur à propos d'une annonce.
// - Nouvelle conversation (ouverte depuis une annonce) : le vendeur ne voit rien tant que le 1er message n'est pas envoyé.
// - Phrases rapides comme sur le site (acheteur : disponible ? dernier prix ? où ? / vendeur : réponses toutes prêtes).
// - Photo dans un message, « ✓✓ vu » quand l'autre a lu, rafraîchissement toutes les 4 secondes.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adCache, api, mediaUrl, priceText } from '../../src/api';
import { addLocalMessage, markReadLocal, refreshConvs, shortTime, useConvs } from '../../src/chat';
import { useLang } from '../../src/i18n';
import { notify } from '../../src/notify';
import { pickPhotos, preparePhoto } from '../../src/photos';
import { cityName } from '../../src/places';
import { getAllAds } from '../../src/store';
import { colors, radius } from '../../src/theme';

const T = {
  fr: {
    ph: 'Écrire un message…', send: 'Envoyer', seen: 'Vu', sent: 'Envoyé', sending: 'Envoi…', failed: 'Non envoyé — toucher pour réessayer',
    q1: 'Bonjour, est-ce toujours disponible ?', q2: 'Quel est votre dernier prix ?', q3: 'Où peut-on se voir ?',
    r1: 'Oui, c’est toujours disponible. Vous pouvez passer le voir.', r2: 'Mon dernier prix est {p}. On peut en discuter sur place.',
    r3: 'On peut se voir près de : {l}. Appelez-moi avant de venir.',
    first: 'Le vendeur verra la conversation dès votre premier message.', safety: '🔒 Ne payez jamais avant d’avoir vu l’article.',
    perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.', err: 'Message non envoyé. Vérifiez votre connexion.',
  },
  ar: {
    ph: 'اكتب رسالة…', send: 'إرسال', seen: 'تمت القراءة', sent: 'أُرسلت', sending: 'جارٍ الإرسال…', failed: 'لم تُرسل — اضغط لإعادة المحاولة',
    q1: 'السلام عليكم، هل ما زال متاحاً؟', q2: 'ما هو آخر سعر؟', q3: 'أين يمكن أن نلتقي؟',
    r1: 'نعم، ما زال متاحاً. يمكنك المرور لرؤيته.', r2: 'آخر سعر هو {p}. يمكننا التفاهم عند اللقاء.',
    r3: 'يمكن أن نلتقي قرب: {l}. اتصل بي قبل المجيء.',
    first: 'سيرى البائع المحادثة بعد رسالتك الأولى.', safety: '🔒 لا تدفع أبداً قبل رؤية السلعة.',
    perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.', err: 'لم تُرسل الرسالة. تحقق من الاتصال.',
  },
};

export default function Conversation() {
  const { id, adId: adIdParam } = useLocalSearchParams();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const insets = useSafeAreaInsets();
  const { convs } = useConvs(4000);
  const conv = convs?.find((c) => c.id === id);
  const [ad, setAd] = useState(null);
  const [txt, setTxt] = useState('');
  const [pending, setPending] = useState([]); // messages en cours d'envoi ou échoués
  const list = useRef(null);
  const adId = conv?.adId || adIdParam;

  // Annonce liée (titre, photo, prix, lieu pour les phrases rapides)
  useEffect(() => {
    if (!adId) return;
    const a = adCache.get(adId);
    if (a) setAd(a);
    else getAllAds().then((all) => setAd(all.find((x) => x.id === adId) || null)).catch(() => {});
  }, [adId]);

  // Marquer comme lu à l'ouverture et à chaque nouveau message reçu
  const unread = conv?.unread || 0;
  useEffect(() => {
    if (!conv) return;
    api.readConv(id).catch(() => {});
    markReadLocal(id);
  }, [id, unread, !!conv]);

  const msgs = useMemo(() => [...(conv?.msgs || []), ...pending], [conv?.msgs, pending]);
  const isBuyer = conv ? conv.buyer : true; // nouvelle conversation = ouverte par l'acheteur
  const otherName = conv?.seller || ad?.shop?.name || ad?.seller || '';

  useEffect(() => { setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80); }, [msgs.length]);

  // ---------- Envoi ----------
  async function send(text, photo) {
    const body = (text || '').trim();
    if (!body && !photo) return;
    const local = { key: 'l' + Date.now() + Math.random(), me: true, txt: body, t: Date.now(), localImg: photo?.uri, status: 'sending', photo };
    setPending((p) => [...p, local]);
    if (!photo) setTxt('');
    try {
      const img = photo ? await preparePhoto(photo) : undefined;
      const r = await api.sendMsg(id, body, img);
      setPending((p) => p.filter((m) => m.key !== local.key));
      if (conv) addLocalMessage(id, { me: true, txt: body, t: r.t, img: r.img || '' });
      refreshConvs().catch(() => {});
    } catch {
      setPending((p) => p.map((m) => (m.key === local.key ? { ...m, status: 'failed' } : m)));
    }
  }
  const retry = (m) => { setPending((p) => p.filter((x) => x.key !== m.key)); send(m.txt, m.photo); };

  async function addPhoto() {
    try {
      const [p] = await pickPhotos('library', 1);
      if (p) send(txt, p).then(() => setTxt(''));
    } catch (e) { if (e.message === 'permission') notify(t('perm')); }
  }

  // Phrases rapides
  const place = [ad?.near, ad?.hood, cityName(ad?.city, lang)].filter(Boolean).join('، ');
  const quick = isBuyer
    ? [t('q1'), t('q2'), t('q3')]
    : [t('r1'), ad?.price > 0 ? t('r2', { p: priceText(ad, lang) }) : null, place ? t('r3', { l: place }) : null].filter(Boolean);
  const showQuick = !txt && (msgs.length === 0 || (!isBuyer && msgs.length < 6) || (isBuyer && msgs.length < 2));

  const lastMine = [...(conv?.msgs || [])].reverse().find((m) => m.me);
  const al = rtl ? { textAlign: 'right', writingDirection: 'rtl' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#EEF5F0' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
      <Stack.Screen options={{ title: otherName }} />

      {/* Rappel de l'annonce (toucher = ouvrir l'annonce) */}
      {(ad || conv) && (
        <Pressable style={[s.adBar, row]} onPress={() => ad && router.push('/annonce/' + ad.id)}>
          {ad?.photos?.[0] ? <Image source={mediaUrl(ad.photos[0])} style={s.adImg} /> : <View style={[s.adImg, { backgroundColor: colors.border }]} />}
          <View style={{ flex: 1 }}>
            <Text style={[s.adTitle, al]} numberOfLines={1}>{ad?.title || conv?.title}</Text>
            {ad && <Text style={[s.adPrice, al]} numberOfLines={1}>{priceText(ad, lang)}</Text>}
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>{rtl ? '‹' : '›'}</Text>
        </Pressable>
      )}

      {!conv && !convs ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : (
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m, i) => m.key || String(m.t) + i}
          contentContainerStyle={{ padding: 12, gap: 6, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={(
            <View style={{ alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {!conv && <Text style={s.info}>{t('first')}</Text>}
              <Text style={s.info}>{t('safety')}</Text>
            </View>
          )}
          renderItem={({ item: m }) => {
            const mine = m.me;
            const side = mine === !rtl ? 'flex-end' : 'flex-start';
            const img = m.localImg || (m.img ? mediaUrl(m.img) : null);
            return (
              <Pressable onPress={() => m.status === 'failed' && retry(m)} style={{ alignSelf: side, maxWidth: '80%' }}>
                <View style={[s.bubble, mine ? s.mine : s.theirs, m.status === 'failed' && { opacity: 0.6 }]}>
                  {img && <Image source={img} style={s.msgImg} contentFit="cover" />}
                  {!!m.txt && <Text style={[s.msgTxt, mine && { color: '#fff' }]}>{m.txt}</Text>}
                  <Text style={[s.msgTime, mine && { color: '#EEF5F0' }]}>
                    {m.status === 'sending' ? t('sending') : shortTime(m.t, lang)}
                    {mine && !m.status && m === lastMine ? (conv.otherRead >= m.t ? '  ✓✓ ' + t('seen') : '  ✓ ' + t('sent')) : ''}
                  </Text>
                </View>
                {m.status === 'failed' && <Text style={[s.failed, { alignSelf: side }]}>⚠︎ {t('failed')}</Text>}
              </Pressable>
            );
          }}
        />
      )}

      {/* Phrases rapides : elles remplissent la zone de texte (on peut les modifier avant d'envoyer) */}
      {showQuick && (
        <FlatList
          horizontal inverted={rtl} data={quick} keyExtractor={(q) => q} showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0, height: 62 }} contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, gap: 8 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={s.quick} onPress={() => setTxt(item)}><Text style={s.quickTxt} numberOfLines={1}>{item}</Text></Pressable>
          )}
        />
      )}

      {/* Zone d'écriture */}
      <View style={[s.inputBar, row, { paddingBottom: 8 + (Platform.OS === 'ios' ? insets.bottom : 0) }]}>
        <Pressable onPress={addPhoto} hitSlop={8} style={s.iconBtn}><Text style={{ fontSize: 22 }}>📷</Text></Pressable>
        <TextInput style={[s.input, al]} value={txt} onChangeText={setTxt} placeholder={t('ph')} placeholderTextColor={colors.muted}
          multiline maxLength={500} />
        <Pressable onPress={() => send(txt)} disabled={!txt.trim()} style={[s.sendBtn, !txt.trim() && { opacity: 0.4 }]}>
          <Text style={s.sendTxt}>{rtl ? '◀' : '▶'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  adBar: { alignItems: 'center', gap: 10, padding: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  adImg: { width: 44, height: 44, borderRadius: 8 },
  adTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  adPrice: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  info: { fontSize: 12, color: colors.muted, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, textAlign: 'center' },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  msgTxt: { fontSize: 15, color: colors.text, lineHeight: 21 },
  msgTime: { fontSize: 11, color: colors.muted, alignSelf: 'flex-end' },
  msgImg: { width: 220, height: 220, borderRadius: 10 },
  failed: { color: colors.danger, fontSize: 12, marginTop: 2 },
  quick: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 280 },
  quickTxt: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  inputBar: { alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingTop: 8, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border },
  iconBtn: { paddingBottom: 8 },
  input: { flex: 1, maxHeight: 110, minHeight: 42, backgroundColor: colors.bg, borderRadius: radius.l, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 16, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendTxt: { color: '#fff', fontSize: 18 },
});
