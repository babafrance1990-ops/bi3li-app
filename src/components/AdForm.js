// Formulaire d'annonce en 3 étapes (dépôt d'une nouvelle annonce ET modification d'une annonce existante), comme sur le site :
// 1) catégorie et type ; 2) photos, titre (facultatif), description ; 3) prix, lieu, contact, aperçu, « Publier ».
// Les photos partent au serveur dès qu'elles sont ajoutées : à « Publier », il ne reste presque que le texte à envoyer.
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { adCache, api, mediaUrl, priceText } from '../api';
import { invalidateAds } from '../store';
import { useAuth } from '../auth';
import { CATEGORIES, catById } from '../categories';
import AdCard from './AdCard';
import CityPicker from './CityPicker';
import { clearDraft, loadDraft, newDraft, saveDraft, saveLast } from '../draft';
import { useLang } from '../i18n';
import { notify } from '../notify';
import { MAX_PHOTOS, pickPhotos, uploadPhoto } from '../photos';
import { cityName, NKC } from '../places';
import { colors, radius } from '../theme';

// ---------- Textes du dépôt ----------
const D = {
  fr: {
    stepOf: 'Étape {n} sur 3', next: 'Suivant', prev: 'Retour', publish: 'Publier',
    st1: 'Que vendez-vous ?', st1sub: 'Choisissez la catégorie, puis le type.',
    st2: 'Photos et description', st2sub: 'Ajoutez de vraies photos : elles attirent plus d’acheteurs.',
    st3: 'Prix et lieu', st3sub: 'Vérifiez votre annonce, puis publiez.',
    deal: 'Vente ou location ?', sale: 'Vente', rent: 'Location', kind: 'Type de bien', surface: 'Surface (m², facultatif)',
    car: 'Détails du véhicule (facultatif)', brand: 'Marque (ex. Toyota)', model: 'Modèle (ex. Corolla)', year: 'Année', km: 'Kilométrage',
    photos: 'Photos', photosN: '{n} / 6', gallery: '🖼️ Galerie', camera: '📷 Appareil photo', main: 'Principale',
    photoErr: 'Échec — toucher pour réessayer', perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.',
    title: 'Titre (facultatif)', titleHelp: 'Laissez vide : un titre sera écrit automatiquement.', desc: 'Description',
    descPh: 'État, couleur, quartier, raison de la vente…',
    price: 'Prix', unit: 'Monnaie', unitNew: 'Nouvelle ouguiya (MRU)', unitOld: 'Ancienne ouguiya',
    eqNew: '= {v} MRU (nouvelle ouguiya)', eqOld: '= {v} anciennes ouguiyas', nego: 'Prix à discuter', hidep: 'Masquer le prix sur l’annonce',
    city: 'Ville', hood: 'Quartier (facultatif)', hoodNkc: 'Moughataa (facultatif)', near: 'Repère (facultatif)', nearPh: 'ex. près de la mosquée…',
    deliv: 'Livraison possible', delivNote: 'Précisions sur la livraison (facultatif)',
    contactAt: 'Les acheteurs vous contacteront au', wa: 'WhatsApp', call: 'Appels',
    preview: 'Aperçu de votre annonce',
    eCat: 'Choisissez une catégorie.', eDeal: 'Choisissez vente ou location.', eKind: 'Choisissez le type de bien.',
    ePhotoImmo: 'Ajoutez au moins une photo du bien.', ePrice: 'Indiquez un prix.', eUnit: 'Choisissez nouvelle ou ancienne ouguiya.',
    eContact: 'Gardez au moins un moyen de contact.',
    upPh: 'Envoi des photos {i}/{n}…', upSave: 'Publication…', upFail: 'Certaines photos n’ont pas pu être envoyées. Vérifiez votre connexion et réessayez.',
    needLogin: 'Connectez-vous pour déposer une annonce.', login: 'Se connecter / Créer un compte',
    restored: 'Brouillon repris', restart: 'Recommencer',
    eVerify: 'Votre numéro n’est pas vérifié : 3 annonces en ligne au maximum. Vérifiez-le en un message WhatsApp pour publier sans limite.', verifyNow: 'Vérifier mon numéro',
    eTooMany: 'Limite de 60 annonces par jour atteinte.', eNet: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
    okT: 'Votre annonce est en ligne !', okS: 'Partagez-la dans vos groupes WhatsApp pour trouver un acheteur plus vite.',
    see: 'Voir mon annonce', share: 'Partager sur WhatsApp', another: 'Déposer une autre annonce',
    open: 'Ouvrir bi3li.net',
    editTitle: 'Modifier l’annonce', jump: 'Touchez une barre pour aller directement à une étape.', save: 'Enregistrer', saving: 'Enregistrement…',
    savedT: 'Modifications enregistrées !', back: 'Retour à mes annonces',
  },
  ar: {
    stepOf: 'الخطوة {n} من 3', next: 'التالي', prev: 'رجوع', publish: 'نشر',
    st1: 'ماذا تبيع؟', st1sub: 'اختر الفئة ثم النوع.',
    st2: 'الصور والوصف', st2sub: 'أضف صوراً حقيقية: تجذب مشترين أكثر.',
    st3: 'السعر والمكان', st3sub: 'راجع إعلانك ثم انشره.',
    deal: 'بيع أم إيجار؟', sale: 'بيع', rent: 'إيجار', kind: 'نوع العقار', surface: 'المساحة (م²، اختياري)',
    car: 'تفاصيل المركبة (اختياري)', brand: 'الماركة (مثلاً تويوتا)', model: 'الموديل (مثلاً كورولا)', year: 'السنة', km: 'عدد الكيلومترات',
    photos: 'الصور', photosN: '{n} / 6', gallery: '🖼️ المعرض', camera: '📷 الكاميرا', main: 'الرئيسية',
    photoErr: 'فشل — اضغط لإعادة المحاولة', perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.',
    title: 'العنوان (اختياري)', titleHelp: 'اتركه فارغاً: سنكتب عنواناً تلقائياً.', desc: 'الوصف',
    descPh: 'الحالة، اللون، الحي، سبب البيع…',
    price: 'السعر', unit: 'العملة', unitNew: 'الأوقية الجديدة', unitOld: 'الأوقية القديمة',
    eqNew: '= {v} أوقية جديدة', eqOld: '= {v} أوقية قديمة', nego: 'السعر قابل للنقاش', hidep: 'إخفاء السعر على البطاقة',
    city: 'المدينة', hood: 'الحي (اختياري)', hoodNkc: 'المقاطعة (اختياري)', near: 'معلم قريب (اختياري)', nearPh: 'مثلاً قرب المسجد…',
    deliv: 'التوصيل ممكن', delivNote: 'تفاصيل التوصيل (اختياري)',
    contactAt: 'سيتصل بك المشترون على الرقم', wa: 'واتساب', call: 'اتصال',
    preview: 'معاينة إعلانك',
    eCat: 'اختر فئة.', eDeal: 'اختر بيع أو إيجار.', eKind: 'اختر نوع العقار.',
    ePhotoImmo: 'أضف صورة واحدة على الأقل للعقار.', ePrice: 'اكتب السعر.', eUnit: 'اختر الأوقية الجديدة أو القديمة.',
    eContact: 'اترك وسيلة تواصل واحدة على الأقل.',
    upPh: 'جارٍ رفع الصور {i}/{n}…', upSave: 'جارٍ النشر…', upFail: 'تعذّر رفع بعض الصور. تحقق من الاتصال وأعد المحاولة.',
    needLogin: 'سجّل الدخول لنشر إعلان.', login: 'تسجيل الدخول / إنشاء حساب',
    restored: 'تم استرجاع المسودة', restart: 'البدء من جديد',
    eVerify: 'رقمك غير موثّق: 3 إعلانات منشورة كحد أقصى. وثّقه برسالة واتساب واحدة لتنشر بلا حدود.', verifyNow: 'توثيق رقمي',
    eTooMany: 'بلغت حد 60 إعلاناً في اليوم.', eNet: 'تعذّر الاتصال. تحقق من الشبكة وأعد المحاولة.',
    okT: 'إعلانك منشور الآن!', okS: 'شاركه في مجموعات واتساب لتجد مشترياً أسرع.',
    see: 'عرض إعلاني', share: 'مشاركة على واتساب', another: 'نشر إعلان آخر',
    open: 'فتح bi3li.net',
    editTitle: 'تعديل الإعلان', jump: 'اضغط على أحد الأشرطة للانتقال مباشرة إلى خطوة.', save: 'حفظ', saving: 'جارٍ الحفظ…',
    savedT: 'تم حفظ التعديلات!', back: 'العودة إلى إعلاناتي',
  },
};

// Types de biens immobiliers (mêmes identifiants que le site : SALE_KINDS / KINDS)
const KINDS = {
  sale: ['house', 'villa', 'duplex', 'land', 'apt', 'building', 'shop', 'farm'],
  rent: ['apt', 'house', 'villa', 'duplex', 'room', 'shop', 'office', 'warehouse', 'land'],
};
const KIND_L = {
  apt: ['Appartement', 'شقة'], house: ['Maison', 'منزل'], villa: ['Villa', 'فيلا'], duplex: ['Duplex', 'دوبلكس'],
  room: ['Chambre', 'غرفة'], shop: ['Boutique', 'محل'], office: ['Bureau', 'مكتب'], warehouse: ['Entrepôt', 'مستودع'],
  land: ['Terrain', 'قطعة أرضية'], building: ['Immeuble', 'عمارة'], farm: ['Ferme', 'مزرعة'],
};

const digits = (v) => String(v || '').replace(/\D/g, '');
const fmtN = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
let photoKey = 0;

// ---------- Petits éléments du formulaire (définis hors de l'écran pour que le clavier ne se ferme pas à chaque lettre) ----------
const alignOf = (rtl) => (rtl ? { textAlign: 'right', writingDirection: 'rtl' } : null);
const rowOf = (rtl) => (rtl ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' });
const Err = ({ errors, k, rtl }) => (errors[k] ? <Text style={[s.err, alignOf(rtl)]}>{errors[k]}</Text> : null);
const Label = ({ children, rtl }) => <Text style={[s.label, alignOf(rtl)]}>{children}</Text>;
const Chip = ({ on, label, onPress, color }) => (
  <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: color || colors.primary, borderColor: color || colors.primary }]}>
    <Text style={[s.chipTxt, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);
const Field = ({ rtl, style, ...props }) => <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, alignOf(rtl), style]} />;
const Toggle = ({ label, value, onChange, rtl }) => (
  <View style={[s.toggle, rowOf(rtl)]}>
    <Text style={[s.toggleTxt, alignOf(rtl)]}>{label}</Text>
    <Switch value={!!value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
  </View>
);

// Annonce existante → formulaire (à partir de la copie « _d » gardée par le site, sinon des champs de l'annonce)
function adToDraft(a) {
  const base = newDraft();
  const d0 = a._d || {};
  const pick = Object.fromEntries(Object.keys(base).filter((k) => d0[k] !== undefined && d0[k] !== null).map((k) => [k, d0[k]]));
  const d = { ...base, ...pick, step: 1 };
  d.cat = a.cat; d.title = a.title || ''; d.desc = a.desc || '';
  d.punit = a.punit === 'old' ? 'old' : 'new';
  d.price = String(a.punit === 'old' ? a.priceOld || a.price * 10 : a.price || '');
  d.nego = !!a.nego; d.hidep = !!a.hidep; d.city = a.city || d.city; d.hood = a.hood || ''; d.near = a.near || '';
  d.deliv = !!a.deliv; d.delivNote = a.delivNote || '';
  if (a.contacts) { d.wa = !!a.contacts.wa; d.call = !!a.contacts.call; d.msg = !!a.contacts.msg; }
  if (a.estate) { d.deal = a.estate.deal || d.deal; d.kind = a.estate.kind || d.kind; d.surface = a.estate.surface ? String(a.estate.surface) : d.surface; }
  if (a.car) { ['brand', 'model'].forEach((k) => { if (a.car[k]) d[k] = a.car[k]; }); if (a.car.year) d.year = String(a.car.year); if (a.car.km) d.km = String(a.car.km); }
  ['brand', 'model', 'year', 'km', 'surface', 'title', 'desc', 'hood', 'near', 'delivNote'].forEach((k) => { d[k] = d[k] == null ? '' : String(d[k]); });
  d.photos = (a.photos || []).map((url) => ({ key: 'p' + ++photoKey, url, status: 'ok', at: Date.now() }));
  return d;
}

// Modification : on garde tout ce que l'application ne sait pas encore modifier (vidéo, message vocal,
// détails de catégorie saisis sur le site…), et on remplace seulement ce que le formulaire contient.
const CAT_OBJ = ['estate', 'car', 'veh', 'home', 'anim', 'mm', 'fam', 'dev', 'bty', 'trip', 'mo', 'job', 'serv'];
function mergeAd(orig, ad) {
  const keep = { ...orig };
  ['id', 'owner', 't', 'status', 'sv', 'seller', 'phone', 'shop', 'edited', 'modAt'].forEach((k) => delete keep[k]);
  if (orig.cat !== ad.cat) CAT_OBJ.forEach((k) => delete keep[k]);
  const out = { ...keep, ...ad };
  if (orig.cat === ad.cat) {
    if (ad.estate) out.estate = { ...(orig.estate || {}), ...ad.estate, eq: orig.estate?.eq || [], pub: orig.estate?.pub || 'owner' };
    if (ad.car) out.car = { ...(orig.car || {}), ...ad.car };
  }
  if (orig.stype) out.stype = orig.stype;
  if (ad.punit !== 'old') delete out.priceOld;
  out._d = { ...(orig._d || {}), ...ad._d, stype: orig._d?.stype || ad._d.stype, pub: orig._d?.pub || ad._d.pub, eq: orig._d?.eq || ad._d.eq };
  return out;
}

export default function AdForm({ editAd = null }) {
  const editing = !!editAd;
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace('{' + a + '}', b), D[lang][k] ?? k);
  const L = lang === 'ar' ? 1 : 0;

  const [d, setD] = useState(null);         // brouillon
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');     // texte du bouton pendant la publication
  const [cityOpen, setCityOpen] = useState(false);
  const [done, setDone] = useState(null);   // annonce publiée
  const pending = useRef({});               // envois de photos en cours (clé → promesse)
  const urls = useRef({});                  // adresses des photos déjà envoyées (clé → /api/media/ID)
  const scroll = useRef(null);

  // Mise à jour du brouillon (+ sauvegarde sur le téléphone)
  const update = (patch) => setD((prev) => {
    const n = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
    if (!editing) saveDraft(n); // en modification, rien n'est gardé comme brouillon
    return n;
  });
  const setPhoto = (key, patch) => update((p) => ({ ...p, photos: p.photos.map((x) => (x.key === key ? { ...x, ...patch } : x)) }));

  // ---------- Envoi d'une photo (1 nouvel essai automatique en cas d'échec) ----------
  function startUpload(item) {
    setPhoto(item.key, { status: 'up' });
    const run = async (tries) => {
      try {
        const url = await uploadPhoto(item);
        urls.current[item.key] = url;
        setPhoto(item.key, { url, status: 'ok', at: Date.now() });
        return url;
      } catch (e) {
        if (tries > 0 && e.code !== 'limit') return run(tries - 1);
        setPhoto(item.key, { status: 'err' });
        throw e;
      }
    };
    const pr = run(1);
    pending.current[item.key] = pr;
    pr.catch(() => {}).finally(() => { if (pending.current[item.key] === pr) delete pending.current[item.key]; });
    return pr;
  }

  useEffect(() => {
    if (editing) { setD(adToDraft(editAd)); return; }
    loadDraft().then(({ draft, restored: r }) => {
      draft.photos = draft.photos.map((p) => ({ ...p, key: p.key || 'p' + ++photoKey }));
      setD(draft);
      setRestored(r && (draft.cat || draft.photos.length > 0));
      draft.photos.filter((p) => p.status === 'todo').forEach((p) => setTimeout(() => startUpload(p), 0));
    });
  }, []);

  if (!d) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const al = alignOf(rtl);
  const row = rowOf(rtl);

  // ---------- Pas connecté ----------
  if (!user) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 44 }}>➕</Text>
        <Text style={s.centerTxt}>{t('needLogin')}</Text>
        <Pressable style={s.btnMain} onPress={() => router.push('/connexion')}><Text style={s.btnMainTxt}>{t('login')}</Text></Pressable>
      </View>
    );
  }

  // ---------- Modification enregistrée ----------
  if (done && editing) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 56 }}>✅</Text>
        <Text style={s.okT}>{t('savedT')}</Text>
        <Pressable style={s.btnMain} onPress={() => { adCache.set(done.id, done); router.replace('/annonce/' + done.id); }}>
          <Text style={s.btnMainTxt}>{t('see')}</Text>
        </Pressable>
        <Pressable style={s.btnLight} onPress={() => router.back()}>
          <Text style={s.btnLightTxt}>{t('back')}</Text>
        </Pressable>
      </View>
    );
  }

  // ---------- Annonce publiée ----------
  if (done) {
    const link = 'https://bi3li.net/?annonce=' + done.id;
    return (
      <ScrollView contentContainerStyle={s.center}>
        <Text style={{ fontSize: 56 }}>✅</Text>
        <Text style={s.okT}>{t('okT')}</Text>
        <Text style={s.centerTxt}>{t('okS')}</Text>
        <Pressable style={[s.btnMain, { backgroundColor: colors.whatsapp }]}
          onPress={() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(done.title + '\n' + priceText(done, lang) + '\n' + link))}>
          <Text style={s.btnMainTxt}>🟢 {t('share')}</Text>
        </Pressable>
        <Pressable style={s.btnLight} onPress={() => { adCache.set(done.id, done); router.push('/annonce/' + done.id); }}>
          <Text style={s.btnLightTxt}>{t('see')}</Text>
        </Pressable>
        <Pressable style={s.btnLight} onPress={() => setDone(null)}>
          <Text style={s.btnLightTxt}>➕ {t('another')}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- Titre automatique (si le vendeur n'en écrit pas) ----------
  function autoTitle() {
    const c = catById(d.cat);
    if (d.cat === 'immo' && d.kind) return KIND_L[d.kind][L] + ' ' + (d.deal === 'rent' ? t('rent') : t('sale')).toLowerCase();
    const car = [d.brand, d.model, d.year].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
    if (car) return car;
    const first = d.desc.trim().split('\n')[0];
    if (first) return first.length > 60 ? first.slice(0, 57) + '…' : first;
    return c ? c[lang] : '';
  }

  // ---------- Vérification de chaque étape ----------
  function check(step) {
    const e = {};
    if (step === 1) {
      if (!d.cat) e.cat = t('eCat');
      if (d.cat === 'immo') {
        if (!d.deal) e.deal = t('eDeal');
        else if (!d.kind || !KINDS[d.deal].includes(d.kind)) e.kind = t('eKind');
      }
    }
    if (step === 2 && d.cat === 'immo' && d.photos.length === 0) e.photos = t('ePhotoImmo');
    if (step === 3) {
      if (!d.hidep && !(+digits(d.price) > 0)) e.price = t('ePrice'); // prix masqué : le prix devient facultatif
      if (d.punit !== 'old' && d.punit !== 'new') e.punit = t('eUnit');
      if (!d.wa && !d.call) e.contact = t('eContact');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function go(step) {
    if (step > d.step && !check(d.step)) return;
    setErrors({});
    update({ step });
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  // ---------- Photos ----------
  async function addPhotos(source) {
    try {
      const list = await pickPhotos(source, MAX_PHOTOS - d.photos.length);
      if (!list.length) return;
      const items = list.map((p) => ({ ...p, key: 'p' + ++photoKey, status: 'up', url: null }));
      update((p) => ({ ...p, photos: [...p.photos, ...items].slice(0, MAX_PHOTOS) }));
      setErrors((e) => ({ ...e, photos: undefined }));
      items.forEach((it) => setTimeout(() => startUpload(it), 0));
    } catch (e) {
      if (e.message === 'permission') notify(t('perm'));
    }
  }
  const removePhoto = (key) => update((p) => ({ ...p, photos: p.photos.filter((x) => x.key !== key) }));
  const makeMain = (key) => update((p) => {
    const i = p.photos.findIndex((x) => x.key === key);
    if (i <= 0) return p;
    const ph = [...p.photos]; const [x] = ph.splice(i, 1); ph.unshift(x);
    return { ...p, photos: ph };
  });

  // ---------- Construction de l'annonce (même format que le site) ----------
  function buildAd(photoUrls) {
    const p = +digits(d.price);
    const ad = {
      punit: d.punit === 'old' ? 'old' : 'new',
      priceOld: d.punit === 'old' ? p : undefined,
      title: (d.title.trim() || autoTitle()).slice(0, 70),
      cat: d.cat,
      price: d.punit === 'old' ? Math.round(p / 10) : p,
      city: d.city, hood: d.hood.trim(), near: d.near.trim(),
      nego: !!d.nego, hidep: !!d.hidep, deliv: !!d.deliv, delivNote: d.deliv ? d.delivNote.trim() : '',
      desc: d.desc.trim(), photos: photoUrls,
      contacts: { wa: !!d.wa, call: !!d.call, msg: !!d.msg },
      stype: 'part',
    };
    if (d.cat === 'immo') ad.estate = { deal: d.deal, kind: d.kind, surface: +digits(d.surface) || 0, eq: [], pub: 'owner' };
    if (d.cat === 'auto') {
      const car = { brand: d.brand.trim(), model: d.model.trim() };
      if (/^\d{4}$/.test(digits(d.year))) car.year = +digits(d.year);
      if (digits(d.km)) car.km = +digits(d.km);
      Object.keys(car).forEach((k) => car[k] === '' && delete car[k]);
      ad.car = car;
    }
    // Copie du formulaire pour pouvoir modifier l'annonce plus tard sur le site
    const { photos, step, ...rest } = d;
    ad._d = { ...rest, price: digits(d.price), eq: [], pub: 'owner', vkind: d.cat === 'auto' ? 'car' : undefined, stype: 'part' };
    return ad;
  }

  // ---------- Publication ----------
  async function publish() {
    if (busy || !check(3)) return;
    try {
      // 1) photos : on relance celles qui ont échoué, puis on attend celles en cours
      d.photos.filter((p) => p.status === 'err' || p.status === 'todo').forEach((p) => startUpload(p));
      const total = d.photos.length;
      const keys = d.photos.map((p) => p.key);
      while (keys.some((k) => pending.current[k])) {
        const left = keys.filter((k) => pending.current[k]).length;
        setBusy(t('upPh', { i: total - left, n: total }));
        await Promise.race(keys.filter((k) => pending.current[k]).map((k) => pending.current[k].catch(() => null)));
      }
      const list = d.photos.map((p) => urls.current[p.key] || p.url);
      if (list.some((u) => !u)) { setBusy(''); notify(t('upFail')); return; }

      // 2) annonce
      setBusy(t('upSave'));
      if (editing) {
        setBusy(t('saving'));
        const r = await api.updateAd(editAd.id, mergeAd(editAd, buildAd(list)));
        const saved = { ...editAd, ...r.ad };
        adCache.set(saved.id, saved);
        invalidateAds();
        setDone(saved);
        return;
      }
      const r = await api.publish(buildAd(list));
      invalidateAds();
      saveLast(d);
      await clearDraft();
      const last = { city: d.city, hood: d.hood, wa: d.wa, call: d.call, msg: d.msg };
      setD(newDraft(last));
      setRestored(false);
      setDone(r.ad);
    } catch (e) {
      const msg = e.code === 'verify_needed' ? t('eVerify') : e.code === 'too_many' ? t('eTooMany') : t('eNet');
      notify(msg, e.code === 'verify_needed'
        ? [{ text: 'OK' }, { text: t('verifyNow'), onPress: () => router.push('/verifier') }]
        : undefined);
    } finally {
      setBusy('');
    }
  }

  const step = d.step;
  const pu = +digits(d.price);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* En-tête : étape + barre de progression */}
      <View style={s.head}>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={s.stepOf}>{editing ? t('editTitle') + ' · ' : ''}{t('stepOf', { n: step })}</Text>
          {restored && !editing && (
            <Pressable onPress={() => { clearDraft(); setD(newDraft({ city: d.city, hood: d.hood })); setRestored(false); setErrors({}); }}>
              <Text style={s.restart}>{t('restored')} · {t('restart')}</Text>
            </Pressable>
          )}
        </View>
        {editing && <Text style={[s.help, al]}>{t('jump')}</Text>}
        <View style={[s.bar, row]}>
          {[1, 2, 3].map((n) => (editing
            // en modification : toucher une barre = aller directement à cette étape (ex. changer seulement le prix)
            ? <Pressable key={n} hitSlop={{ top: 12, bottom: 12 }} style={[s.barPart, { height: 8 }, n <= step && { backgroundColor: colors.primary }]} onPress={() => go(n)} />
            : <View key={n} style={[s.barPart, n <= step && { backgroundColor: colors.primary }]} />))}
        </View>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {/* ---------- Étape 1 : catégorie et type ---------- */}
        {step === 1 && (
          <>
            <Text style={[s.h1, al]}>{t('st1')}</Text>
            <Text style={[s.sub, al]}>{t('st1sub')}</Text>
            <View style={[s.grid, row]}>
              {CATEGORIES.map((c) => {
                const on = d.cat === c.id;
                return (
                  <Pressable key={c.id} onPress={() => { update({ cat: c.id }); setErrors({}); }}
                    style={[s.cat, on && { borderColor: c.c, backgroundColor: c.c + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                    <Text style={[s.catTxt, on && { color: c.c, fontWeight: '800' }]} numberOfLines={2}>{c[lang]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Err errors={errors} rtl={rtl} k="cat" />

            {d.cat === 'immo' && (
              <>
                <Label rtl={rtl}>{t('deal')}</Label>
                <View style={[s.chips, row]}>
                  <Chip on={d.deal === 'sale'} label={t('sale')} onPress={() => update({ deal: 'sale', kind: KINDS.sale.includes(d.kind) ? d.kind : '' })} />
                  <Chip on={d.deal === 'rent'} label={t('rent')} onPress={() => update({ deal: 'rent', kind: KINDS.rent.includes(d.kind) ? d.kind : '' })} />
                </View>
                <Err errors={errors} rtl={rtl} k="deal" />
                {!!d.deal && (
                  <>
                    <Label rtl={rtl}>{t('kind')}</Label>
                    <View style={[s.chips, row]}>
                      {KINDS[d.deal].map((k) => <Chip key={k} on={d.kind === k} label={KIND_L[k][L]} onPress={() => update({ kind: k })} />)}
                    </View>
                    <Err errors={errors} rtl={rtl} k="kind" />
                    <Field rtl={rtl} value={d.surface} onChangeText={(v) => update({ surface: digits(v) })} placeholder={t('surface')} keyboardType="number-pad" />
                  </>
                )}
              </>
            )}

            {d.cat === 'auto' && (
              <>
                <Label rtl={rtl}>{t('car')}</Label>
                <Field rtl={rtl} value={d.brand} onChangeText={(v) => update({ brand: v })} placeholder={t('brand')} maxLength={30} />
                <Field rtl={rtl} value={d.model} onChangeText={(v) => update({ model: v })} placeholder={t('model')} maxLength={30} />
                <View style={[row, { gap: 8 }]}>
                  <Field rtl={rtl} style={{ flex: 1 }} value={d.year} onChangeText={(v) => update({ year: digits(v).slice(0, 4) })} placeholder={t('year')} keyboardType="number-pad" />
                  <Field rtl={rtl} style={{ flex: 1 }} value={d.km} onChangeText={(v) => update({ km: digits(v) })} placeholder={t('km')} keyboardType="number-pad" />
                </View>
              </>
            )}
          </>
        )}

        {/* ---------- Étape 2 : photos, titre, description ---------- */}
        {step === 2 && (
          <>
            <Text style={[s.h1, al]}>{t('st2')}</Text>
            <Text style={[s.sub, al]}>{t('st2sub')}</Text>

            <View style={[row, { justifyContent: 'space-between' }]}>
              <Label rtl={rtl}>{t('photos')}</Label>
              <Text style={s.count}>{t('photosN', { n: d.photos.length })}</Text>
            </View>
            <View style={[s.photos, row]}>
              {d.photos.map((p, i) => (
                <Pressable key={p.key} style={s.thumb}
                  onPress={() => (p.status === 'err' ? startUpload(p) : makeMain(p.key))}>
                  <Image source={p.uri || mediaUrl(p.url) || null} style={s.thumbImg} contentFit="cover" />
                  {p.status === 'up' && <View style={s.thumbOver}><ActivityIndicator color="#fff" /></View>}
                  {(p.status === 'err' || (p.status === 'todo' && !p.uri)) && <View style={[s.thumbOver, { backgroundColor: 'rgba(220,38,38,0.7)' }]}><Text style={s.thumbErr}>⚠︎ ↻</Text></View>}
                  {i === 0 && <Text style={s.mainTag}>{t('main')}</Text>}
                  <Pressable style={s.del} hitSlop={8} onPress={() => removePhoto(p.key)}><Text style={s.delTxt}>✕</Text></Pressable>
                </Pressable>
              ))}
            </View>
            {d.photos.some((p) => p.status === 'err') && <Text style={[s.err, al]}>{t('photoErr')}</Text>}
            {d.photos.length < MAX_PHOTOS && (
              <View style={[row, { gap: 8 }]}>
                <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addPhotos('library')}><Text style={s.btnLightTxt}>{t('gallery')}</Text></Pressable>
                <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addPhotos('camera')}><Text style={s.btnLightTxt}>{t('camera')}</Text></Pressable>
              </View>
            )}
            <Err errors={errors} rtl={rtl} k="photos" />

            <Label rtl={rtl}>{t('title')}</Label>
            <Field rtl={rtl} value={d.title} onChangeText={(v) => update({ title: v })} placeholder={autoTitle() || t('title')} maxLength={70} />
            <Text style={[s.help, al]}>{t('titleHelp')}</Text>

            <Label rtl={rtl}>{t('desc')}</Label>
            <Field rtl={rtl} value={d.desc} onChangeText={(v) => update({ desc: v })} placeholder={t('descPh')} multiline
              style={{ minHeight: 120, textAlignVertical: 'top' }} maxLength={3000} />
          </>
        )}

        {/* ---------- Étape 3 : prix, lieu, contact, aperçu ---------- */}
        {step === 3 && (
          <>
            <Text style={[s.h1, al]}>{t('st3')}</Text>
            <Text style={[s.sub, al]}>{t('st3sub')}</Text>

            <Label rtl={rtl}>{t('price')}</Label>
            <Field rtl={rtl} value={pu ? fmtN(pu).replace(/[\u2066\u2069]/g, '') : ''} onChangeText={(v) => update({ price: digits(v).slice(0, 12) })} placeholder="0" keyboardType="number-pad" style={{ fontSize: 20, fontWeight: '700' }} />
            <Err errors={errors} rtl={rtl} k="price" />
            <Label rtl={rtl}>{t('unit')}</Label>
            <View style={[s.chips, row]}>
              <Chip on={d.punit === 'new'} label={t('unitNew')} onPress={() => update({ punit: 'new' })} />
              <Chip on={d.punit === 'old'} label={t('unitOld')} onPress={() => update({ punit: 'old' })} />
            </View>
            <Err errors={errors} rtl={rtl} k="punit" />
            {pu > 0 && d.punit === 'old' && <Text style={[s.help, al]}>{t('eqNew', { v: fmtN(pu / 10) })}</Text>}
            {pu > 0 && d.punit === 'new' && <Text style={[s.help, al]}>{t('eqOld', { v: fmtN(pu * 10) })}</Text>}
            <Toggle rtl={rtl} label={t('nego')} value={d.nego} onChange={(v) => update({ nego: v })} />
            <Toggle rtl={rtl} label={'🙈 ' + t('hidep')} value={d.hidep} onChange={(v) => update({ hidep: v })} />

            <Label rtl={rtl}>{t('city')}</Label>
            <Pressable style={[s.input, row, { justifyContent: 'space-between' }]} onPress={() => setCityOpen(true)}>
              <Text style={{ fontSize: 16, color: colors.text }}>📍 {cityName(d.city, lang)}</Text>
              <Text style={{ color: colors.muted }}>▾</Text>
            </Pressable>

            {d.city === 'Nouakchott' ? (
              <>
                <Label rtl={rtl}>{t('hoodNkc')}</Label>
                {NKC.map((w) => (
                  <View key={w.id} style={{ marginBottom: 6 }}>
                    <Text style={[s.help, al]}>{w[lang]}</Text>
                    <View style={[s.chips, row]}>
                      {w.h.map((h) => <Chip key={h} on={d.hood === h} label={h} onPress={() => update({ hood: d.hood === h ? '' : h })} />)}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Label rtl={rtl}>{t('hood')}</Label>
                <Field rtl={rtl} value={d.hood} onChangeText={(v) => update({ hood: v })} placeholder={t('hood')} maxLength={40} />
              </>
            )}
            <Field rtl={rtl} value={d.near} onChangeText={(v) => update({ near: v })} placeholder={t('nearPh')} maxLength={60} />

            <Toggle rtl={rtl} label={t('deliv')} value={d.deliv} onChange={(v) => update({ deliv: v })} />
            {d.deliv && <Field rtl={rtl} value={d.delivNote} onChangeText={(v) => update({ delivNote: v })} placeholder={t('delivNote')} maxLength={80} />}

            <Text style={[s.label, al]}>{t('contactAt')} <Text style={{ color: colors.primaryDark }}>{user.phone}</Text></Text>
            <Toggle rtl={rtl} label={'🟢 ' + t('wa')} value={d.wa} onChange={(v) => update({ wa: v })} />
            <Toggle rtl={rtl} label={'📞 ' + t('call')} value={d.call} onChange={(v) => update({ call: v })} />
            <Err errors={errors} rtl={rtl} k="contact" />

            <Label rtl={rtl}>{t('preview')}</Label>
            <View style={{ width: '55%', alignSelf: rtl ? 'flex-end' : 'flex-start' }}>
              <AdCard preview ad={{
                id: 'preview', status: 'online', title: d.title.trim() || autoTitle(), punit: d.punit || 'new', hidep: d.hidep,
                price: d.punit === 'old' ? Math.round(pu / 10) : pu, priceOld: d.punit === 'old' ? pu : undefined,
                city: d.city, hood: d.hood, photos: d.photos.map((p) => p.uri || p.url).filter(Boolean),
              }} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Boutons du bas */}
      <View style={[s.foot, row]}>
        {step > 1 && (
          <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => go(step - 1)} disabled={!!busy}>
            <Text style={s.btnLightTxt}>{t('prev')}</Text>
          </Pressable>
        )}
        <Pressable style={[s.btnMain, { flex: 2 }, !!busy && { opacity: 0.7 }]} disabled={!!busy}
          onPress={() => (step < 3 ? go(step + 1) : publish())}>
          {busy
            ? <View style={[row, { gap: 8, alignItems: 'center' }]}><ActivityIndicator color="#fff" /><Text style={s.btnMainTxt}>{busy}</Text></View>
            : <Text style={s.btnMainTxt}>{step < 3 ? t('next') : editing ? t('save') : t('publish')}</Text>}
        </Pressable>
      </View>

      <CityPicker visible={cityOpen} value={d.city}
        onClose={() => setCityOpen(false)}
        onPick={(c) => { update({ city: c, hood: c === d.city ? d.hood : '' }); setCityOpen(false); }} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border, gap: 8 },
  stepOf: { color: colors.muted, fontWeight: '700' },
  restart: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  bar: { gap: 6 },
  barPart: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 40, gap: 10 },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginBottom: 4 },
  grid: { flexWrap: 'wrap', gap: 8 },
  cat: { width: '31.5%', aspectRatio: 1.1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.m, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
  catTxt: { fontSize: 12, textAlign: 'center', color: colors.text, fontWeight: '600' },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 },
  help: { fontSize: 13, color: colors.muted },
  err: { color: colors.danger, fontWeight: '600' },
  count: { color: colors.muted, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 13, fontSize: 16, backgroundColor: colors.white, color: colors.text },
  chips: { flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipTxt: { fontSize: 14, fontWeight: '600', color: colors.text },
  photos: { flexWrap: 'wrap', gap: 8 },
  thumb: { width: '31.5%', aspectRatio: 1, borderRadius: radius.m, overflow: 'hidden', backgroundColor: colors.border },
  thumbImg: { width: '100%', height: '100%' },
  thumbOver: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  thumbErr: { color: '#fff', fontSize: 20, fontWeight: '800' },
  mainTag: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(22,163,74,0.9)', color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 2 },
  del: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  delTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  toggle: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleTxt: { fontSize: 15, color: colors.text, flex: 1 },
  foot: { gap: 8, padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border },
  btnMain: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnMainTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnLight: { backgroundColor: '#e8f5ec', borderRadius: radius.m, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  btnLightTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  centerTxt: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  okT: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
