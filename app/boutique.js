// Ouvrir / modifier ma boutique (vitrine) — mêmes champs et mêmes textes que le site.
// Enregistrée dans le compte (PUT /api/me { shop }) : nom, marché, présentation, adresse, horaires, WhatsApp, livraison, agence.
// Le logo de la boutique = la photo du compte. Le serveur met à jour le nom de boutique sur toutes mes annonces.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, mediaUrl } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { notify } from '../src/notify';
import { pickPhotos, preparePhoto } from '../src/photos';
import { invalidateAds } from '../src/store';
import { colors, radius } from '../src/theme';
import WaLabel from '../src/components/WaLabel';

const T = {
  fr: {
    createT: 'Ouvrir ma boutique', editT: 'Ma boutique', free: 'Gratuit pendant le lancement.',
    intro: 'Une boutique regroupe toutes vos annonces sur une page à partager, avec votre adresse et vos horaires.',
    logo: 'Logo ou photo de la boutique', change: 'Changer', name: 'Nom de la boutique *', market: 'Marché ou lieu', marketPh: 'Ex. : marché Capitale',
    desc: 'Présentation', descPh: 'Ex. : Vente d’électroménager neuf, garantie 6 mois, livraison à Nouakchott.',
    addr: 'Adresse ou repère', addrPh: 'Ex. : Marché Capitale, en face de la BMCI', hours: 'Horaires', hoursPh: 'Ex. : Samedi–jeudi, 9 h – 21 h',
    wa: 'Numéro WhatsApp de la boutique', waHelp: 'Laissez vide pour utiliser le numéro de votre compte.',
    deliv: 'Nous livrons', delivNote: 'Conditions de livraison', delivPh: 'Ex. : Gratuite à Tevragh Zeina, 200 MRU ailleurs',
    agency: 'Je suis une agence immobilière', agencyHelp: 'Le badge « Agence vérifiée » apparaîtra après vérification par notre équipe.',
    verified: '✓ Boutique vérifiée', pending: 'Badge « Boutique vérifiée » : en attente de vérification par notre équipe.',
    rename: '⚠️ Changer le nom (ou le type agence) retire le badge « vérifiée » jusqu’à une nouvelle vérification.',
    create: 'Créer ma boutique', save: 'Enregistrer', created: 'Votre boutique est en ligne !', saved: 'Boutique enregistrée',
    see: 'Voir ma boutique', share: 'Partager ma boutique sur WhatsApp', close: 'Fermer ma boutique', cancel: 'Annuler',
    closeQ: 'Fermer votre boutique ? Vos annonces restent en ligne, à votre nom.', closed: 'Boutique fermée.',
    errName: 'Écrivez le nom de la boutique.', errWa: 'Le numéro WhatsApp doit avoir 8 chiffres.', err: 'Enregistrement impossible. Vérifiez votre connexion.',
    perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.', login: 'Connectez-vous pour ouvrir une boutique.',
    complete: 'Boutique complète à {p} %', moreInfo: 'Plus d’informations', lessInfo: 'Masquer les informations',
    preview: 'Aperçu de ma boutique', previewClose: 'Fermer l’aperçu', verifyAsk: 'Demander la vérification', verifyMsg: 'Bonjour, je demande la vérification de ma boutique « {n} » ({p}).',
    adsT: 'Annonces de ma boutique', myAds: 'Voir mes annonces', addAd: 'Ajouter une annonce à ma boutique',
    hoursSel: 'Utiliser les sélecteurs', hoursFree: 'Saisir librement', hoursDays: 'Jours d’ouverture', hoursFrom: 'De', hoursTo: 'À', hoursWarn: 'L’heure de fermeture doit être après l’ouverture.',
    previewAddr: 'Adresse', previewHours: 'Horaires', previewWa: 'WhatsApp', previewDeliv: 'Livraison', previewMarket: 'Marché',
  },
  ar: {
    createT: 'افتح متجري', editT: 'متجري', free: 'مجاني خلال فترة الإطلاق.',
    intro: 'المتجر يجمع كل إعلاناتك في صفحة واحدة تشاركها، مع عنوانك وأوقات عملك.',
    logo: 'شعار أو صورة المتجر', change: 'تغيير', name: 'اسم المتجر *', market: 'السوق أو المكان', marketPh: 'مثال: سوق العاصمة',
    desc: 'تعريف بالمتجر', descPh: 'مثال: بيع أجهزة منزلية جديدة، ضمان 6 أشهر، توصيل في نواكشوط.',
    addr: 'العنوان أو علامة مميزة', addrPh: 'مثال: سوق العاصمة، مقابل BMCI', hours: 'أوقات العمل', hoursPh: 'مثال: من السبت إلى الخميس، 9 – 21',
    wa: 'رقم واتساب المتجر', waHelp: 'اتركه فارغاً لاستعمال رقم حسابك.',
    deliv: 'نوفر التوصيل', delivNote: 'شروط التوصيل', delivPh: 'مثال: مجاني في تفرغ زينة، 200 أوقية في غيرها',
    agency: 'أنا وكالة عقارية', agencyHelp: 'ستظهر شارة «وكالة موثّقة» بعد تحقق فريقنا.',
    verified: '✓ متجر موثّق', pending: 'شارة «متجر موثّق»: في انتظار تحقق فريقنا.',
    rename: '⚠️ تغيير الاسم (أو نوع الوكالة) يزيل شارة «موثّق» حتى يتحقق فريقنا من جديد.',
    create: 'أنشئ متجري', save: 'حفظ', created: 'متجرك على الإنترنت الآن!', saved: 'تم حفظ المتجر',
    see: 'عرض متجري', share: 'مشاركة متجري على واتساب', close: 'إغلاق متجري', cancel: 'إلغاء',
    closeQ: 'هل تريد إغلاق متجرك؟ تبقى إعلاناتك منشورة باسمك.', closed: 'تم إغلاق المتجر.',
    errName: 'اكتب اسم المتجر.', errWa: 'رقم واتساب يجب أن يكون 8 أرقام.', err: 'تعذّر الحفظ. تحقق من الاتصال.',
    perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.', login: 'سجّل الدخول لفتح متجر.',
    complete: 'اكتمال المتجر: {p} %', moreInfo: 'معلومات إضافية', lessInfo: 'إخفاء المعلومات',
    preview: 'معاينة متجري', previewClose: 'إغلاق المعاينة', verifyAsk: 'طلب التوثيق', verifyMsg: 'السلام عليكم، أطلب توثيق متجري « {n} » ({p}).',
    adsT: 'إعلانات متجري', myAds: 'عرض إعلاناتي', addAd: 'إضافة إعلان لمتجري',
    hoursSel: 'اختيار بالأزرار', hoursFree: 'كتابة حرة', hoursDays: 'أيام العمل', hoursFrom: 'من', hoursTo: 'إلى', hoursWarn: 'يجب أن يكون وقت الإغلاق بعد وقت الفتح.',
    previewAddr: 'العنوان', previewHours: 'أوقات العمل', previewWa: 'واتساب', previewDeliv: 'التوصيل', previewMarket: 'السوق',
  },
};
const digits = (v) => String(v || '').replace(/\D/g, '');
// Jours et heures choisis avec des boutons ; le texte enregistré est écrit à partir de ces choix
const DAYS = [
  { id: 'sa', fr: 'Sam', ar: 'السبت' }, { id: 'di', fr: 'Dim', ar: 'الأحد' }, { id: 'lu', fr: 'Lun', ar: 'الاثنين' },
  { id: 'ma', fr: 'Mar', ar: 'الثلاثاء' }, { id: 'me', fr: 'Mer', ar: 'الأربعاء' }, { id: 'je', fr: 'Jeu', ar: 'الخميس' },
  { id: 've', fr: 'Ven', ar: 'الجمعة' },
];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 h à 23 h

// Rangée horizontale d'heures (6 h à 23 h)
function HourRow({ value, onPick, row }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ gap: 8 }, row]}>
      {HOURS.map((h) => (
        <Pressable key={h} onPress={() => onPick(h)} style={[s.dayChip, value === h && s.dayOn]}>
          <Text style={[s.dayTxt, value === h && s.dayTxtOn]}>{h} h</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function Boutique() {
  const { user, reloadUser } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k) => T[lang][k];
  const old = user?.shop || null;
  const [f, setF] = useState(() => ({
    name: old?.name || '', market: old?.market || '', desc: old?.desc || '', addr: old?.addr || '', hours: old?.hours || '',
    wa: old?.wa && digits(old.wa) !== digits(user?.phone) ? old.wa : '', deliv: !!old?.deliv, delivNote: old?.delivNote || '', agency: !!old?.agency,
  }));
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // 'created' | 'saved'
  const [more, setMore] = useState(() => !!(old && (old.desc || old.addr || old.hours || old.wa || old.deliv || old.agency)));
  const [preview, setPreview] = useState(false);
  const insets = useSafeAreaInsets();
  const [support, setSupport] = useState('');
  const [hoursSel, setHoursSel] = useState(!old?.hours);
  const [hm, setHM] = useState({ days: [], from: 9, to: 21 });
  useEffect(() => { api.config().then((c) => setSupport(c.support || '')).catch(() => {}); }, []);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  if (!user) return <View style={s.wrap}><Text>{t('login')}</Text></View>;

  const shop = user.shop;
  const renamed = old?.verified && (f.name.trim() !== old.name || f.agency !== !!old.agency);
  const link = shop?.slug ? 'https://bi3li.net/?b=' + shop.slug : null;
  const logo = photo?.uri || (user.avatar ? mediaUrl(user.avatar) : null);
  // Liste de contrôle : ce qui rend la boutique complète
  const checks = [
    { ok: !!logo, fr: 'Logo ou photo', ar: 'شعار أو صورة' },
    { ok: !!f.desc.trim(), fr: 'Présentation', ar: 'تعريف بالمتجر' },
    { ok: !!f.addr.trim(), fr: 'Adresse', ar: 'العنوان' },
    { ok: !!f.hours.trim(), fr: 'Horaires', ar: 'أوقات العمل' },
    { ok: !!f.wa, fr: 'Numéro WhatsApp de la boutique', ar: 'رقم واتساب المتجر' },
  ];
  const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  // Horaires : jours et heures choisis avec des boutons, écrits dans le champ « horaires »
  function setHours(patch) {
    const n = { ...hm, ...patch };
    setHM(n);
    const names = DAYS.filter((d) => n.days.includes(d.id)).map((d) => d[lang]).join(', ');
    set({ hours: n.days.length ? names + ' · ' + n.from + ' h – ' + n.to + ' h' : '' });
  }
  const toggleDay = (id) => setHours({ days: hm.days.includes(id) ? hm.days.filter((x) => x !== id) : [...hm.days, id] });
  const shareWa = () => Linking.openURL('https://wa.me/?text=' + encodeURIComponent('🏪 ' + (old?.name || f.name) + (link ? '\n' + link : '')));
  const askVerify = () => Linking.openURL('https://wa.me/222' + digits(support).slice(-8) + '?text=' + encodeURIComponent(t('verifyMsg').replace('{n}', old?.name || f.name).replace('{p}', user.phone)));

  async function choose() {
    try { const [p] = await pickPhotos('library', 1); if (p) setPhoto(p); } catch (e) { if (e.message === 'permission') notify(t('perm')); }
  }

  async function save() {
    if (!f.name.trim()) { notify(t('errName')); return; }
    if (f.wa && digits(f.wa).length !== 8) { notify(t('errWa')); return; }
    setBusy(true);
    try {
      const body = { shop: { ...f, name: f.name.trim(), wa: digits(f.wa) || digits(user.phone), delivNote: f.deliv ? f.delivNote : '' } };
      if (photo) body.avatar = await preparePhoto(photo, 400, 0.8);
      await api.updateMe(body);
      await reloadUser();
      invalidateAds(); // le nom de boutique est recopié sur toutes mes annonces
      setPhoto(null);
      setDone(old ? 'saved' : 'created');
    } catch { notify(t('err')); } finally { setBusy(false); }
  }

  function closeShop() {
    notify(t('closeQ'), [{ text: t('cancel'), style: 'cancel' }, {
      text: t('close'), style: 'destructive', onPress: async () => {
        try { await api.updateMe({ shop: null }); await reloadUser(); invalidateAds(); notify(t('closed')); router.back(); } catch { notify(t('err')); }
      },
    }]);
  }

  // ---------- Boutique créée / enregistrée ----------
  if (done && shop) {
    return (
      <View style={[s.wrap, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <Stack.Screen options={{ title: t('editT') }} />
        <Text style={{ fontSize: 56 }}>{done === 'created' ? '🎉' : '✅'}</Text>
        <Text style={[s.h, { textAlign: 'center' }]}>{done === 'created' ? t('created') : t('saved')}</Text>
        <Text style={[s.h, { textAlign: 'center', color: colors.primaryDark }]}>🏪 {shop.name}</Text>
        {link && (
          <Pressable style={[s.btn, { backgroundColor: colors.whatsapp, alignSelf: 'stretch' }]}
            onPress={() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent('🏪 ' + shop.name + '\n' + link))}>
            <WaLabel style={s.btnTxt}>{t('share')}</WaLabel>
          </Pressable>
        )}
        <Pressable style={[s.btnLight, { alignSelf: 'stretch' }]} onPress={() => router.replace('/vendeur/' + user.id)}>
          <Text style={s.btnLightTxt}>👁 {t('see')}</Text>
        </Pressable>
        <Pressable onPress={() => setDone(null)}><Text style={s.link}>✏️ {lang === 'ar' ? 'تعديل' : 'Modifier'}</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: old ? t('editT') : t('createT') }} />

      {!old && (
        <View style={s.intro}>
          <Text style={[s.p, al]}>🏪 {t('intro')}</Text>
          <Text style={[s.free, al]}>🎁 {t('free')}</Text>
        </View>
      )}
      {old && (old.verified
        ? <Text style={[s.badge, s.badgeOk]}>{t('verified')}</Text>
        : <Text style={[s.badge, al]}>⏳ {t('pending')}</Text>)}

      <View style={s.progress}>
        <Text style={[s.progTitle, al]}>{t('complete').replace('{p}', pct)}</Text>
        <View style={s.progBar}><View style={[s.progFill, { width: pct + '%' }]} /></View>
        {checks.map((c) => (
          <View key={c.fr} style={[s.progRow, row]}>
            <Ionicons name={c.ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={c.ok ? colors.primary : colors.muted} />
            <Text style={[s.progItem, al]}>{lang === 'ar' ? c.ar : c.fr}</Text>
          </View>
        ))}
      </View>

      {old && link && (
        <Pressable style={[s.btn, { backgroundColor: colors.whatsapp, marginTop: 4 }]} onPress={shareWa}>
          <WaLabel style={s.btnTxt}>{t('share')}</WaLabel>
        </Pressable>
      )}
      {old && !old.verified && !!digits(support) && (
        <Pressable style={s.btnLight} onPress={askVerify}><Text style={s.btnLightTxt}>{t('verifyAsk')}</Text></Pressable>
      )}

      <Text style={[s.label, al]}>{t('logo')}</Text>
      <View style={[row, { alignItems: 'center', gap: 14 }]}>
        {logo ? <Image source={logo} style={s.logo} contentFit="cover" /> : <View style={[s.logo, s.logoEmpty]}><Text style={{ fontSize: 30 }}>🏪</Text></View>}
        <Pressable style={s.chip} onPress={choose}><Text style={s.chipTxt}>🖼️ {t('change')}</Text></Pressable>
      </View>

      <Text style={[s.label, al]}>{t('name')}</Text>
      <TextInput style={[s.input, al]} value={f.name} onChangeText={(v) => set({ name: v })} maxLength={60} />
      {renamed && <Text style={[s.warn, al]}>{t('rename')}</Text>}

      <Text style={[s.label, al]}>{t('market')}</Text>
      <TextInput style={[s.input, al]} value={f.market} onChangeText={(v) => set({ market: v })} placeholder={t('marketPh')} placeholderTextColor={colors.muted} maxLength={100} />

      <Pressable style={[s.moreBtn, row]} onPress={() => setMore(!more)}>
        <Text style={s.moreTxt}>{more ? t('lessInfo') : t('moreInfo')}</Text>
        <Ionicons name={more ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primaryDark} />
      </Pressable>
      {more && (
        <>
      <Text style={[s.label, al]}>{t('desc')}</Text>
      <TextInput style={[s.input, al, { minHeight: 90, textAlignVertical: 'top' }]} value={f.desc} onChangeText={(v) => set({ desc: v })} placeholder={t('descPh')} placeholderTextColor={colors.muted} multiline maxLength={400} />

      <Text style={[s.label, al]}>{t('addr')}</Text>
      <TextInput style={[s.input, al]} value={f.addr} onChangeText={(v) => set({ addr: v })} placeholder={t('addrPh')} placeholderTextColor={colors.muted} maxLength={160} />

      <Text style={[s.label, al]}>{t('hours')}</Text>
      {hoursSel ? (
        <View style={{ gap: 8 }}>
          <Text style={[s.help, al]}>{t('hoursDays')}</Text>
          <View style={[s.chips, row]}>
            {DAYS.map((d) => {
              const on = hm.days.includes(d.id);
              return (
                <Pressable key={d.id} onPress={() => toggleDay(d.id)} style={[s.dayChip, on && s.dayOn]}>
                  <Text style={[s.dayTxt, on && s.dayTxtOn]}>{d[lang]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[s.help, al]}>{t('hoursFrom')}</Text>
          <HourRow value={hm.from} onPick={(h) => setHours({ from: h })} row={row} />
          <Text style={[s.help, al]}>{t('hoursTo')}</Text>
          <HourRow value={hm.to} onPick={(h) => setHours({ to: h })} row={row} />
          {hm.to <= hm.from && <Text style={[s.warn, al]}>{t('hoursWarn')}</Text>}
          {!!f.hours && <Text style={[s.p, al]}>{f.hours}</Text>}
          <Pressable onPress={() => setHoursSel(false)}><Text style={s.link}>{t('hoursFree')}</Text></Pressable>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <TextInput style={[s.input, al]} value={f.hours} onChangeText={(v) => set({ hours: v })} placeholder={t('hoursPh')} placeholderTextColor={colors.muted} maxLength={80} />
          <Pressable onPress={() => setHoursSel(true)}><Text style={s.link}>{t('hoursSel')}</Text></Pressable>
        </View>
      )}

      <Text style={[s.label, al]}>{t('wa')}</Text>
      <TextInput style={[s.input, al]} value={f.wa} onChangeText={(v) => set({ wa: digits(v).slice(0, 8) })} placeholder={user.phone} placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      <Text style={[s.help, al]}>{t('waHelp')}</Text>

      <View style={[s.toggle, row]}>
        <Text style={[s.toggleTxt, al]}>🚚 {t('deliv')}</Text>
        <Switch value={f.deliv} onValueChange={(v) => set({ deliv: v })} trackColor={{ true: colors.primary }} />
      </View>
      {f.deliv && (
        <TextInput style={[s.input, al]} value={f.delivNote} onChangeText={(v) => set({ delivNote: v })} placeholder={t('delivPh')} placeholderTextColor={colors.muted} maxLength={120} />
      )}

      <View style={[s.toggle, row]}>
        <Text style={[s.toggleTxt, al]}>🏠 {t('agency')}</Text>
        <Switch value={f.agency} onValueChange={(v) => set({ agency: v })} trackColor={{ true: colors.primary }} />
      </View>
      {f.agency && <Text style={[s.help, al]}>{t('agencyHelp')}</Text>}

        </>
      )}

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{old ? t('save') : '🏪 ' + t('create')}</Text>}
      </Pressable>

      {old && (
        <View style={s.adsBox}>
          <Text style={[s.label, al]}>{t('adsT')}</Text>
          <Pressable style={s.btnLight} onPress={() => router.push('/mes-annonces')}><Text style={s.btnLightTxt}>{t('myAds')}</Text></Pressable>
          <Pressable style={s.btn} onPress={() => router.navigate('/(tabs)/deposer')}><Text style={s.btnTxt}>{t('addAd')}</Text></Pressable>
        </View>
      )}

      <Pressable style={s.btnLight} onPress={() => setPreview(true)}><Text style={s.btnLightTxt}>{t('preview')}</Text></Pressable>

      {old && (
        <>
          <Pressable style={s.btnLight} onPress={() => router.push('/vendeur/' + user.id)}><Text style={s.btnLightTxt}>👁 {t('see')}</Text></Pressable>
          <Pressable onPress={closeShop}><Text style={[s.link, { color: colors.danger }]}>{t('close')}</Text></Pressable>
        </>
      )}

      <Modal visible={preview} animationType="slide" onRequestClose={() => setPreview(false)}>
        <ScrollView contentContainerStyle={[s.wrap, { paddingTop: insets.top + 16, paddingBottom: 110 + insets.bottom }]}>
          <View style={s.prevCard}>
            {logo ? <Image source={logo} style={s.prevLogo} contentFit="cover" /> : null}
            <Text style={[s.h, al]}>{f.name || '—'}</Text>
            {!!f.market && <Text style={[s.p, al]}>{t('previewMarket')} : {f.market}</Text>}
            {!!f.desc && <Text style={[s.p, al]}>{f.desc}</Text>}
            {!!f.addr && <Text style={[s.p, al]}>{t('previewAddr')} : {f.addr}</Text>}
            {!!f.hours && <Text style={[s.p, al]}>{t('previewHours')} : {f.hours}</Text>}
            <Text style={[s.p, al]}>{t('previewWa')} : {digits(f.wa) || digits(user.phone)}</Text>
            {f.deliv && <Text style={[s.p, al]}>{t('previewDeliv')} : {f.delivNote || '✓'}</Text>}
            {old?.verified && <Text style={[s.badge, s.badgeOk]}>{t('verified')}</Text>}
          </View>
        </ScrollView>
        {/* Bouton en bas : hors de la zone de l'encoche et de la caméra */}
        <View style={[s.prevFoot, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={s.prevClose} onPress={() => setPreview(false)}><Text style={s.prevCloseTxt}>{t('previewClose')}</Text></Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 8, paddingBottom: 50 },
  intro: { backgroundColor: '#EEF5F0', borderRadius: radius.m, padding: 14, gap: 6, borderWidth: 1, borderColor: '#DCEFE3' },
  p: { fontSize: 15, color: colors.text, lineHeight: 22 },
  free: { fontSize: 14, color: colors.primaryDark, fontWeight: '800' },
  h: { fontSize: 20, fontWeight: '800', color: colors.text },
  badge: { fontSize: 13, fontWeight: '700', color: '#8A5A00', backgroundColor: '#FDF3DC', borderRadius: 12, padding: 10, overflow: 'hidden' },
  badgeOk: { color: colors.primaryDark, backgroundColor: '#EEF5F0', alignSelf: 'flex-start' },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  help: { fontSize: 13, color: colors.muted },
  warn: { fontSize: 13, color: '#8A5A00' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 13, fontSize: 16, backgroundColor: colors.white, color: colors.text },
  logo: { width: 76, height: 76, borderRadius: 14 },
  logoEmpty: { backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.white },
  chipTxt: { fontWeight: '700', color: colors.text },
  toggle: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginTop: 6 },
  toggleTxt: { fontSize: 15, color: colors.text, flex: 1, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnLight: { backgroundColor: '#EEF5F0', borderRadius: radius.m, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnLightTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  link: { color: colors.primaryDark, fontWeight: '700', textAlign: 'center', padding: 12 },
  progress: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6, marginTop: 8 },
  progTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  progBar: { height: 8, borderRadius: 4, backgroundColor: '#EEF5F0', overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: colors.primary },
  progRow: { alignItems: 'center', gap: 8 },
  progItem: { fontSize: 14, color: colors.text, flex: 1 },
  chips: { flexWrap: 'wrap', gap: 8 },
  dayChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTxt: { fontSize: 14, fontWeight: '700', color: colors.text },
  dayTxtOn: { color: '#fff' },
  moreBtn: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  moreTxt: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  prevCard: { backgroundColor: colors.white, borderRadius: radius.l, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8, marginTop: 8 },
  prevLogo: { width: 80, height: 80, borderRadius: 14, alignSelf: 'center' },
  prevFoot: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  prevClose: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 14, alignItems: 'center' },
  prevCloseTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  adsBox: { gap: 4, marginTop: 14, padding: 12, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
});
