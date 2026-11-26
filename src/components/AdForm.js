// Formulaire d'annonce en 3 étapes (dépôt d'une nouvelle annonce ET modification d'une annonce existante), comme sur le site :
// 1) catégorie et type ; 2) photos, titre (facultatif), description ; 3) prix, lieu, contact, aperçu, « Publier ».
// Les photos partent au serveur dès qu'elles sont ajoutées : à « Publier », il ne reste presque que le texte à envoyer.
import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { adCache, api, mediaUrl, priceText } from '../api';
import { invalidateAds } from '../store';
import { useAuth } from '../auth';
import { CATEGORIES, catById } from '../categories';
import { SUB_KEY, subsOf } from '../subcategories';
import { CatArt, SubArt } from './Art';
import AdCard from './AdCard';
import { clearDraft, loadDraft, newDraft, saveDraft, saveLast } from '../draft';
import { useLang } from '../i18n';
import { notify } from '../notify';
import { MAX_PHOTOS, pickPhotos, uploadPhoto } from '../photos';
import { pickVideo, uploadVideo, voiceDataUrl } from '../media';
import VoiceRecorder from './VoiceRecorder';
import { HOOD_AR, NKC, WILAYAS } from '../places';

// Listes des villes et des quartiers de Nouakchott (listes déroulantes, comme sur le site)
const TOP_CITIES = ['Nouakchott', 'Nouadhibou', 'Rosso', 'Kaédi', 'Kiffa', 'Atar', 'Zouérate', 'Aleg', 'Sélibaby', 'Néma', 'Boghé', 'Tidjikja', 'Akjoujt', 'Kankossa', 'Boutilimit'];
const CITY_ALL = WILAYAS.flatMap((w) => w.cities.map(([fr, ar]) => ({ v: fr, fr, ar })));
const CITY_OPTS = [...TOP_CITIES.map((v) => CITY_ALL.find((o) => o.v === v)).filter(Boolean), ...CITY_ALL.filter((o) => !TOP_CITIES.includes(o.v))];
const HOOD_OPTS = NKC.flatMap((w) => w.h.map((h) => ({ v: h, fr: h, ar: HOOD_AR[h] || h })));
import { colors, radius } from '../theme';
import { setCatCallback, takeCatCallback } from '../catPick';

// Formulaire sur une seule page (catégorie en haut, puis photos, texte, prix et contact, un seul bouton « Publier »).
// Mettre false pour revenir à l'ancien formulaire en 3 étapes : tout le code des étapes est gardé.
const ONE_SCREEN = true;
const CF = { paddingVertical: 10 }; // champs plus bas (une seule page)
import { MODELS, VEH_ERR } from '../details/vehicles';
import { ELEC_ERR } from '../details/electronics';
import { L3 } from '../details/labels3';
const T3 = (k, ar) => (ar ? L3[k][1] : L3[k][0]);
import { detailAdObject, detailErrors, detailFields, detailsFilled, detailsOpenByDefault, detailTitle, l3FromAd, l4FromAd, l5FromAd, l6FromAd } from '../details';

// ---------- Textes du dépôt ----------
const D = {
  fr: {
    stepOf: 'Étape {n} sur 3', next: 'Suivant', prev: 'Retour', publish: 'Publier',
    catL: 'Catégorie', catPh: 'Choisir la catégorie', pick1: '1 · Catégorie', pick2: '2 · Type',
    pickOk: 'Valider le choix', eFix: 'Complétez les champs marqués en rouge.',
    addPhS: 'Ajouter photos', cancelL: 'Annuler', contactN: 'Contact', optSuffix: ' (facultatif)', reqCount: '{n} sur {m} obligatoires', reqMiss: 'Il manque : {x}', reqDone: 'Tous les champs obligatoires sont remplis', previewT: 'Aperçu de l’annonce', previewBtn: 'Aperçu', kbPrev: 'Précédent', kbNext: 'Suivant', descOpt: 'Description (facultatif)', sufNew: 'MRU', sufOld: 'MRO', kbDone: 'Terminé', msgApp: 'Messagerie', secPres: 'Présentation de l’article', secDet: 'Détails de l’article', secLoc: 'Lieu',
    moreOpt: 'Titre, vidéo et message vocal (facultatif)',
    st1: 'Que vendez-vous ?', st1sub: 'Choisissez la catégorie, puis le type.',
    st2: 'Photos et description', st2sub: 'Ajoutez de vraies photos : elles attirent plus d’acheteurs.',
    st3: 'Prix et lieu', st3sub: 'Vérifiez votre annonce, puis publiez.',
    deal: 'Vente ou location ?', sale: 'Vente', rent: 'Location', kind: 'Type de bien', surface: 'Surface (m², facultatif)',
    photos: 'Photos', photosN: '{n} / 8', titlePh: 'Facultatif : sinon, le début de la description', gallery: 'Galerie', camera: 'Appareil photo', main: 'Principale',
    photoErr: 'Échec — toucher pour réessayer', perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.',
    permAv: 'Autorisez l’accès à la caméra, aux photos ou au micro dans les réglages du téléphone.',
    vidL: 'Vidéo (facultatif, 2 minutes max)', vidCam: '🎥 Filmer', vidGal: '🎞️ Galerie vidéo', vidOk: 'Vidéo ajoutée', vidDel: 'Retirer la vidéo',
    vidHelp: 'Une courte vidéo montre mieux votre article. 20 Mo maximum après allègement.', vidBig: 'Vidéo trop lourde (20 Mo maximum). Essayez une vidéo plus courte.',
    upVid: 'Envoi de la vidéo… {p} %',
    animInfo: 'Détails de l’animal', species: 'Espèce', count: 'Nombre de têtes', sex: 'Sexe', sx_m: 'Mâle', sx_f: 'Femelle', sx_mix: 'Mâles et femelles',
    age: 'Âge', ag_0: 'Moins d’1 an', ag_1: '1 à 2 ans', ag_2: '2 à 4 ans', ag_4: 'Plus de 4 ans', breed: 'Race (facultatif)', breedPh: 'Ex. : Touabire, Ladoum',
    addDet: 'Ajouter des détails (facultatif)', vehInfo: 'Détails du véhicule', detHelpVeh: 'Facultatif : marque, année et kilométrage aident les acheteurs.',
    elecInfo: 'Détails de l’appareil', detHelpElec: 'Facultatif : marque, modèle et état aident les acheteurs.', detHelp: 'Facultatif : sexe, âge, race et Tabaski aident les acheteurs à mieux choisir.', tabaski: 'Idéal pour la Tabaski', errSpecies: 'Choisissez l’espèce.', errCount: 'Indiquez le nombre de têtes.',
    voiceL: 'Message vocal (facultatif, 1 minute max)', voiceRec: 'Enregistrer un message vocal', voiceStop: 'Arrêter', voiceListen: 'Écouter',
    voiceOk: 'Message vocal ajouté', voiceDel: 'Supprimer le vocal', voiceHelp: 'Décrivez votre article en 30 secondes, en hassaniya, en arabe ou en français.',
    voiceErr: 'Impossible d’enregistrer le message. Réessayez.', recDenied: 'Autorisez le micro dans les réglages du téléphone.',
    moreMed: 'Ajouter une vidéo ou un message vocal (facultatif)',
    voiceBig: 'Message vocal trop long : 1 minute maximum.', priceOpt: 'Prix masqué : le prix ne s’affichera pas sur la carte de l’annonce, et il n’est plus obligatoire.',
    title: 'Titre (facultatif)', titleHelp: 'Laissez vide : un titre sera écrit automatiquement.', desc: 'Description',
    descPh: 'État, couleur, quartier, raison de la vente…',
    price: 'Prix', unit: 'Monnaie', unitNew: 'Nouvelle ouguiya (MRU)', unitOld: 'Ancienne ouguiya',
    eqNew: '= {v} MRU (nouvelles ouguiyas)', eqOld: '= {v} MRO (anciennes ouguiyas)', nego: 'Prix à discuter', hidep: 'Masquer le prix sur l’annonce',
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
    addPhS: 'إضافة صور', cancelL: 'إلغاء', contactN: 'التواصل', optSuffix: ' (اختياري)', reqCount: '{n} من {m} إلزامية', reqMiss: 'ينقص: {x}', reqDone: 'كل الحقول الإلزامية مملوءة', previewT: 'معاينة الإعلان', previewBtn: 'معاينة', kbPrev: 'السابق', kbNext: 'التالي', descOpt: 'الوصف (اختياري)', sufNew: 'أوقية جديدة', sufOld: 'أوقية قديمة', kbDone: 'تم', msgApp: 'الرسائل', secPres: 'عرض المنتج', secDet: 'تفاصيل المنتج', secLoc: 'المكان',
    moreOpt: 'العنوان، فيديو ورسالة صوتية (اختياري)',
    catL: 'الفئة', catPh: 'اختر الفئة', pick1: '1 · الفئة', pick2: '2 · النوع',
    pickOk: 'تأكيد الاختيار', eFix: 'أكمل الحقول المعلّمة باللون الأحمر.',
    st1: 'ماذا تبيع؟', st1sub: 'اختر الفئة ثم النوع.',
    st2: 'الصور والوصف', st2sub: 'أضف صوراً حقيقية: تجذب مشترين أكثر.',
    st3: 'السعر والمكان', st3sub: 'راجع إعلانك ثم انشره.',
    deal: 'بيع أم إيجار؟', sale: 'بيع', rent: 'إيجار', kind: 'نوع العقار', surface: 'المساحة (م²، اختياري)',
    photos: 'الصور', photosN: '{n} / 8', titlePh: 'اختياري: وإلا فبداية الوصف', gallery: 'المعرض', camera: 'الكاميرا', main: 'الرئيسية',
    photoErr: 'فشل — اضغط لإعادة المحاولة', perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.',
    permAv: 'اسمح بالوصول إلى الكاميرا أو الصور أو الميكروفون من إعدادات الهاتف.',
    vidL: 'فيديو (اختياري، دقيقتان كحد أقصى)', vidCam: '🎥 تصوير', vidGal: '🎞️ معرض الفيديو', vidOk: 'تمت إضافة الفيديو', vidDel: 'حذف الفيديو',
    vidHelp: 'فيديو قصير يُظهر سلعتك أفضل. 20 ميغابايت كحد أقصى بعد التخفيف.', vidBig: 'الفيديو كبير جداً (20 ميغابايت كحد أقصى). جرّب فيديو أقصر.',
    upVid: 'جارٍ إرسال الفيديو… {p}٪',
    animInfo: 'تفاصيل الحيوان', species: 'النوع', count: 'عدد الرؤوس', sex: 'الجنس', sx_m: 'ذكر', sx_f: 'أنثى', sx_mix: 'ذكور وإناث',
    age: 'العمر', ag_0: 'أقل من سنة', ag_1: 'من سنة إلى سنتين', ag_2: 'من 2 إلى 4 سنوات', ag_4: 'أكثر من 4 سنوات', breed: 'السلالة (اختياري)', breedPh: 'مثال: توابير، لادوم',
    addDet: 'إضافة تفاصيل (اختياري)', vehInfo: 'تفاصيل المركبة', detHelpVeh: 'اختياري: الماركة والسنة والكيلومترات تساعد المشترين.',
    elecInfo: 'تفاصيل الجهاز', detHelpElec: 'اختياري: الماركة والموديل والحالة تساعد المشترين.', detHelp: 'اختياري: الجنس والعمر والسلالة والتبريد لعيد الأضحى تساعد المشترين على الاختيار.', tabaski: 'مناسب لعيد الأضحى', errSpecies: 'اختر النوع.', errCount: 'حدد عدد الرؤوس.',
    voiceL: 'رسالة صوتية (اختياري، دقيقة كحد أقصى)', voiceRec: 'سجّل رسالة صوتية', voiceStop: 'إيقاف', voiceListen: 'استمع',
    voiceOk: 'تمت إضافة الرسالة الصوتية', voiceDel: 'حذف الرسالة الصوتية', voiceHelp: 'صف سلعتك في 30 ثانية بالحسانية أو العربية أو الفرنسية.',
    voiceErr: 'تعذّر تسجيل الرسالة. أعد المحاولة.', recDenied: 'اسمح بالميكروفون من إعدادات الهاتف.',
    moreMed: 'إضافة فيديو أو رسالة صوتية (اختياري)',
    voiceBig: 'الرسالة طويلة جداً: دقيقة واحدة كحد أقصى.', priceOpt: 'السعر مخفي: لن يظهر السعر على بطاقة الإعلان، ولم يعد إلزامياً.',
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
const ltr = (x) => '\u2066' + x + '\u2069'; // nombre lu de gauche à droite dans une phrase en arabe
const fmtN = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
let photoKey = 0;

// ---------- Petits éléments du formulaire (définis hors de l'écran pour que le clavier ne se ferme pas à chaque lettre) ----------
const alignOf = (rtl) => (rtl ? { textAlign: 'right', writingDirection: 'rtl' } : null);
const rowOf = (rtl) => (rtl ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' });
// Choix dans une liste : un seul bouton montre la réponse, la liste s'ouvre en dessous (plus simple pour débuter)
const PickSheet = ({ value, options, placeholder, title, onPick, rtl, ar, extra }) => {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.v === value);
  const al = alignOf(rtl);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[s.pickBtn, value && s.pickBtnOn]}>
        <Text style={[s.pickTxt, !value && { color: colors.muted }, al]} numberOfLines={1}>
          {cur ? (ar ? cur.ar : cur.fr) : placeholder}
        </Text>
        <Text style={s.pickArrow}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.sheetBg} onPress={() => setOpen(false)} />
        <View style={s.sheet}>
          <Text style={[s.sheetTitle, al]}>{title}</Text>
          <ScrollView>
            {options.map((o) => {
              const on = o.v === value;
              return (
                <Pressable key={o.v} onPress={() => { onPick(o.v); setOpen(false); }} style={[s.sheetRow, on && s.sheetRowOn]}>
                  <Text style={[s.sheetTxt, on && { color: colors.primary, fontWeight: '800' }, al]}>{ar ? o.ar : o.fr}</Text>
                  {on && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
            {extra}
          </ScrollView>
          <Pressable onPress={() => setOpen(false)} style={s.sheetClose}>
            <Text style={s.sheetCloseTxt}>{ar ? 'إغلاق' : 'Fermer'}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

const MONTHS = [['janvier', 'يناير'], ['février', 'فبراير'], ['mars', 'مارس'], ['avril', 'أبريل'], ['mai', 'مايو'], ['juin', 'يونيو'],
  ['juillet', 'يوليو'], ['août', 'أغسطس'], ['septembre', 'سبتمبر'], ['octobre', 'أكتوبر'], ['novembre', 'نوفمبر'], ['décembre', 'ديسمبر']];
const pad2 = (n) => String(n).padStart(2, '0');
const range = (from, to, f = (i) => String(i)) => Array.from({ length: to - from + 1 }, (_, i) => ({ v: f(from + i), fr: f(from + i), ar: f(from + i) }));

// Champ d'un véhicule (liste de choix, texte, nombre ou case à cocher)
const VehField = ({ f, d, update, lang, rtl, errors }) => {
  const ar = lang === 'ar';
  const al = alignOf(rtl);
  const row = rowOf(rtl);
  const label = (ar ? f.label[1] : f.label[0]) + (f.req ? '' : ar ? ' (اختياري)' : ' (facultatif)');
  const err = errors[f.k] ? <Text style={[s.err, al]}>{errors[f.k]}</Text> : null;
  if (f.type === 'checks') {
    const sel = d[f.k] || [];
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        {f.opts.map((o) => {
          const on = sel.includes(o.v);
          return <Toggle key={o.v} rtl={rtl} label={ar ? o.ar : o.fr} value={on} onChange={() => update({ [f.k]: on ? sel.filter((x) => x !== o.v) : [...sel, o.v] })} />;
        })}
      </>
    );
  }
  if (f.type === 'check') return <Toggle rtl={rtl} label={label} value={!!d[f.k]} onChange={(v) => update({ [f.k]: v })} />;
  if (f.type === 'model') {
    // Modèles de la marque choisie (liste déroulante), ou saisie libre (« Autre modèle », ou marque sans liste)
    const list = MODELS[d.brand] || [];
    const other = !!d.modelOther || (!!d.model && !list.includes(d.model));
    const opts = [...list.map((m) => ({ v: m, fr: m, ar: m })), { v: '__other', fr: 'Autre modèle (je l’écris)', ar: 'موديل آخر (أكتبه)' }];
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        {!d.brand ? (
          <Text style={[s.help, al]}>{ar ? 'اختر الماركة أولاً' : 'Choisissez d’abord la marque'}</Text>
        ) : list.length ? (
          <PickSheet value={other ? '__other' : d.model} options={opts} placeholder={ar ? 'اختر…' : 'Choisir…'} title={label} rtl={rtl} ar={ar}
            onPick={(v) => update(v === '__other' ? { model: '', modelOther: true } : { model: v, modelOther: false })} />
        ) : null}
        {(other || (!!d.brand && !list.length)) && (
          <Field rtl={rtl} value={d.model} maxLength={30} placeholder={ar ? 'مثال: هايلكس' : 'Ex. : Hilux'} onChangeText={(v) => update({ model: v })} style={{ marginTop: 8 }} />
        )}
        {err}
      </>
    );
  }
  if (f.type === 'chips' && f.opts.length > 4) {
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        <PickSheet value={d[f.k]} options={f.opts} placeholder={ar ? 'اختر…' : 'Choisir…'} title={label} rtl={rtl} ar={ar}
          onPick={(v) => update(f.k === 'brand' ? { brand: v, model: '', modelOther: false } : { [f.k]: v })} />
        {err}
      </>
    );
  }
  if (f.type === 'chips') {
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
          {f.opts.map((o) => {
            const on = d[f.k] === o.v;
            // Changer de marque efface le modèle, comme sur le site
            const press = () => update(f.k === 'brand' ? { brand: on ? '' : o.v, model: '', modelOther: false } : { [f.k]: on ? '' : o.v });
            return (
              <Pressable key={o.v} onPress={press} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipTxt, on && s.chipTxtOn]}>{ar ? o.ar : o.fr}</Text>
              </Pressable>
            );
          })}
        </View>
        {err}
      </>
    );
  }
  if (f.type === 'date') {
    // Date : jour, mois et année à choisir dans des listes (pas de saisie au clavier)
    const [y, m, dd] = (d[f.k] || '').split('-');
    const now = new Date();
    const set = (part, v) => {
      const cur = { y: y || String(now.getFullYear()), m: m || pad2(now.getMonth() + 1), d: dd || pad2(now.getDate()) };
      cur[part] = part === 'y' ? v : pad2(v);
      update({ [f.k]: cur.y + '-' + cur.m + '-' + cur.d });
    };
    const ph = ar ? 'اختر' : 'Choisir';
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        <View style={[row, { gap: 8 }]}>
          <View style={{ flex: 1 }}><PickSheet value={dd ? String(+dd) : ''} options={range(1, 31)} placeholder={ar ? 'اليوم' : 'Jour'} title={label} rtl={rtl} ar={ar} onPick={(v) => set('d', v)} /></View>
          <View style={{ flex: 2 }}><PickSheet value={m ? String(+m) : ''} options={MONTHS.map((x, i) => ({ v: String(i + 1), fr: x[0], ar: x[1] }))} placeholder={ar ? 'الشهر' : 'Mois'} title={label} rtl={rtl} ar={ar} onPick={(v) => set('m', v)} /></View>
          <View style={{ flex: 1.3 }}><PickSheet value={y || ''} options={range(now.getFullYear(), now.getFullYear() + 1)} placeholder={ar ? 'السنة' : 'Année'} title={label} rtl={rtl} ar={ar} onPick={(v) => set('y', v)} /></View>
        </View>
        {err}
      </>
    );
  }
  if (f.type === 'time') {
    // Heure : heure et minutes (par pas de 5) dans des listes
    const [hh, mm] = (d[f.k] || '').split(':');
    const set = (part, v) => update({ [f.k]: part === 'h' ? pad2(v) + ':' + (mm || '00') : (hh || '08') + ':' + pad2(v) });
    return (
      <>
        <Label rtl={rtl}>{label}</Label>
        <View style={[row, { gap: 8 }]}>
          <View style={{ flex: 1 }}><PickSheet value={hh || ''} options={range(0, 23, pad2)} placeholder={ar ? 'الساعة' : 'Heure'} title={label} rtl={rtl} ar={ar} onPick={(v) => set('h', v)} /></View>
          <View style={{ flex: 1 }}><PickSheet value={mm || ''} options={range(0, 11, (i) => pad2(i * 5))} placeholder={ar ? 'الدقيقة' : 'Minute'} title={label} rtl={rtl} ar={ar} onPick={(v) => set('m', v)} /></View>
        </View>
        {err}
      </>
    );
  }
  if (f.type === 'note') return <Text style={[s.help, al, { marginTop: 4 }]}>{ar ? f.label[1] : f.label[0]}</Text>;
  const numeric = f.type === 'num' || f.numeric;
  return (
    <>
      <Label rtl={rtl}>{label}</Label>
      <Field rtl={rtl} value={d[f.k]} placeholder={f.ph} keyboardType={numeric ? 'number-pad' : 'default'} maxLength={f.len || (numeric ? 7 : 40)}
        onChangeText={(v) => update({ [f.k]: numeric ? digits(v) : v })} />
      {err}
    </>
  );
};

const Err = ({ errors, k, rtl }) => (errors[k] ? <Text style={[s.err, alignOf(rtl)]}>{errors[k]}</Text> : null);
const Label = ({ children, rtl }) => <Text style={[s.label, alignOf(rtl)]}>{children}</Text>;
const Chip = ({ on, label, onPress, color, icon }) => (
  <Pressable onPress={onPress} style={[s.chip, s.chipRow, on && { backgroundColor: color || colors.primary, borderColor: color || colors.primary }]}>
    {!!icon && <Ionicons name={icon} size={18} color={on ? '#fff' : (color || colors.primaryDark)} />}
    <Text style={[s.chipTxt, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);
const Field = forwardRef(({ rtl, style, ...props }, ref) => <TextInput ref={ref} placeholderTextColor={colors.muted} {...props} style={[s.input, alignOf(rtl), style]} />);
// Choix à cocher : un cadre avec la case et le libellé
const Toggle = ({ label, icon, iconColor = colors.whatsapp, value, onChange, rtl }) => (
  <Pressable onPress={() => onChange(!value)} style={[s.checkRow, rowOf(rtl)]}>
    <Ionicons name={value ? 'checkbox' : 'square-outline'} size={26} color={value ? colors.primary : colors.muted} />
    {!!icon && <Ionicons name={icon} size={22} color={iconColor} />}
    <Text style={[s.checkTxt, alignOf(rtl)]}>{label}</Text>
  </Pressable>
);

// Bloc repliable encadré : un en-tête cliquable, le contenu s'ouvre dessous
const Fold = ({ title, open, onToggle, rtl, children }) => (
  <View style={s.fold}>
    <Pressable onPress={onToggle} style={[s.foldHead, rowOf(rtl)]}>
      <Text style={[s.foldTitle, alignOf(rtl)]}>{title}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primaryDark} />
    </Pressable>
    {open && <View style={s.foldBody}>{children}</View>}
  </View>
);
// Case à cocher en pastille (masquer le prix, négociable, livraison)
const Tick = ({ on, label, onPress, rtl }) => (
  <Pressable onPress={onPress} style={[s.tick, on && s.tickOn, rowOf(rtl)]}>
    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? colors.primary : colors.muted} />
    <Text style={s.tickTxt}>{label}</Text>
  </Pressable>
);

// Annonce existante → formulaire (à partir de la copie « _d » gardée par le site, sinon des champs de l'annonce)
function adToDraft(a) {
  const base = newDraft();
  const d0 = a._d || {};
  const pick = Object.fromEntries(Object.keys(base).filter((k) => d0[k] !== undefined && d0[k] !== null).map((k) => [k, d0[k]]));
  const d = { ...base, ...pick, step: 1 };
  d.cat = a.cat; d.title = a.title || ''; d.desc = a.desc || '';
  d.sub = (SUB_KEY[a.cat] && a[SUB_KEY[a.cat]]) || d0.sub || '';
  d.punit = a.punit === 'old' ? 'old' : 'new';
  d.price = String(a.punit === 'old' ? a.priceOld || a.price * 10 : a.price || '');
  d.nego = !!a.nego; d.hidep = !!a.hidep; d.city = a.city || d.city; d.hood = a.hood || ''; d.near = a.near || '';
  d.deliv = !!a.deliv; d.delivNote = a.delivNote || '';
  if (a.contacts) { d.wa = !!a.contacts.wa; d.call = !!a.contacts.call; d.msg = !!a.contacts.msg; }
  // Véhicule : si l'annonce n'a pas le brouillon, on reprend les champs de l'annonce
  if (a.car) Object.entries({ brand: a.car.brand, model: a.car.model, vtype: a.car.vtype, color: a.car.color, seats: a.car.seats, doors: a.car.doors, year: a.car.year, km: a.car.km, fuel: a.car.fuel, gear: a.car.gear, cond: a.car.cond }).forEach(([k, v]) => { if (!d0[k] && v != null) d[k] = String(v); });
  if (a.veh) { const v = a.veh; Object.entries({ vbrand: v.brand, vmodel: v.model, vmtype: v.mtype, vcc: v.cc, vyear: v.year, vkm: v.km, vfuel: v.fuel, vseats: v.seats, vttype: v.ttype, vload: v.load, vbtype: v.btype, vpart: v.part, vcompat: v.compat, vservice: v.service, vhours: v.hours, vcond: v.cond }).forEach(([k, x]) => { if (!d0[k] && x != null) d[k] = String(x); }); if (!d0.vhome) d.vhome = !!v.home; if (!d0.vdriver) d.vdriver = !!v.driver; }
  if (a.dev) { const v = a.dev; Object.entries({ pbrand: v.brand, pmodel: v.model, pstorage: v.storage, pram: v.ram, pcond: v.cond, pcolor: v.color, pbatt: v.battery }).forEach(([k, x]) => { if (!d0[k] && x != null) d[k] = String(x); }); if (!d0.pdual && v.dual) d.pdual = v.dual; if (!d0.punlock && v.unlocked) d.punlock = v.unlocked; if (!d0.pincl && v.incl) d.pincl = v.incl; }
  if (a.mm) { const v = a.mm; Object.entries({ macc: v.acc, mbrand: v.brand, mmodel: v.model, msize: v.size, mres: v.res, msmart: v.smart, mpads: v.pads, mgames: v.games, mcpu: v.cpu, mram: v.ram, mstorage: v.storage, mstype: v.stype, mscreen: v.screen, mcompat: v.compat, mcond: v.cond }).forEach(([k, x]) => { if (!d0[k] && x != null) d[k] = String(x); }); if (!d0.pincl && v.incl) d.pincl = v.incl; }
  if (a.anim) { d.count = String(a.anim.count || 1); d.sex = a.anim.sex || ''; d.age = a.anim.age || ''; d.breed = a.anim.breed || ''; d.tabaski = !!a.anim.tabaski; }
  if (a.estate) { d.deal = a.estate.deal || d.deal; d.kind = a.estate.kind || d.kind; d.surface = a.estate.surface ? String(a.estate.surface) : d.surface; }
  ['surface', 'title', 'desc', 'hood', 'near', 'delivNote'].forEach((k) => { d[k] = d[k] == null ? '' : String(d[k]); });
  d.video = a.video || ''; d.voice = a.voice || ''; d.videoUri = ''; d.voiceUri = '';
  d.photos = (a.photos || []).map((url) => ({ key: 'p' + ++photoKey, url, status: 'ok', at: Date.now() }));
  Object.entries({ ...l3FromAd(a), ...l4FromAd(a), ...l5FromAd(a), ...l6FromAd(a) }).forEach(([k, v]) => { if (d0[k] === undefined || d0[k] === '' || (Array.isArray(d0[k]) && !d0[k].length)) d[k] = v; });
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

export default function AdForm({ editAd = null, adminTarget = null }) {
  const editing = !!editAd;
  const admin = !!adminTarget; // publication pour un autre compte (administrateur) : rien n'est gardé comme brouillon
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace('{' + a + '}', b), D[lang][k] ?? k);
  const L = lang === 'ar' ? 1 : 0;
  const ar = lang === 'ar';

  const [d, setD] = useState(null);         // brouillon
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState({});
  const [detOpen, setDetOpen] = useState(false); // détails de catégorie (fin de l'étape 3, comme sur le site)
  const [moreOpen, setMoreOpen] = useState(false); // vidéo et message vocal repliés à l'étape 2
  const [descH, setDescH] = useState(64);          // hauteur de la description : elle grandit avec le texte
  const [kbOpen, setKbOpen] = useState(false);     // clavier ouvert
  const [previewOpen, setPreviewOpen] = useState(false);
  const fref = useRef({});                          // champs de saisie (pour Précédent / Suivant)
  const curF = useRef(null);                        // champ en cours de saisie
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKbOpen(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKbOpen(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  const [busy, setBusy] = useState('');     // texte du bouton pendant la publication
  const [done, setDone] = useState(null);   // annonce publiée
  const pending = useRef({});               // envois de photos en cours (clé → promesse)
  const urls = useRef({});                  // adresses des photos déjà envoyées (clé → /api/media/ID)
  const scroll = useRef(null);
  const subY = useRef(0);              // position des sous-catégories dans la page (étape 1)
  const pendingSub = useRef(false);    // vrai : on vient de choisir une catégorie avec des sous-catégories
  // Quand les sous-catégories apparaissent, la page descend jusqu'à elles
  const onSubLayout = (e) => {
    subY.current = e.nativeEvent.layout.y;
    if (pendingSub.current) {
      pendingSub.current = false;
      scroll.current?.scrollTo({ y: Math.max(0, subY.current - 12), animated: true });
    }
  };

  // Mise à jour du brouillon (+ sauvegarde sur le téléphone)
  const update = (patch) => setD((prev) => {
    const n = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
    if (!editing && !admin) saveDraft(n); // en modification, rien n'est gardé comme brouillon
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
    if (editing) { const dd = adToDraft(editAd); setD(dd); setDetOpen(detailsFilled(dd)); setMoreOpen(!!(dd.title || dd.video || dd.voice)); return; }
    if (admin) { setD({ ...newDraft(), wa: true, call: true }); return; }
    loadDraft().then(({ draft, restored: r }) => {
      draft.photos = draft.photos.map((p) => ({ ...p, key: p.key || 'p' + ++photoKey }));
      if (!draft.city && user?.city) draft.city = user.city; // ville du compte par défaut
      if (!editing) { draft.nego = true; draft.wa = true; draft.call = true; draft.msg = true; draft.punit = 'new'; } // « à discuter » et les 3 contacts cochés ; prix en nouvelles ouguiya
      setDetOpen(detailsFilled(draft));
      setMoreOpen(!!(draft.title || draft.video || draft.voice || draft.videoUri || draft.voiceUri));
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
        {/* Trois boutons de même taille, chacun d'une couleur : WhatsApp, voir, publier un autre */}
        <Pressable style={[s.okBtn, { backgroundColor: '#25D366' }]}
          onPress={() => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(done.title + '\n' + priceText(done, lang) + '\n' + link))}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={[s.okBtnTxt, { color: '#fff' }]}>{t('share')}</Text>
        </Pressable>
        <Pressable style={[s.okBtn, { backgroundColor: colors.primary }]} onPress={() => { adCache.set(done.id, done); router.push('/annonce/' + done.id); }}>
          <Ionicons name="eye-outline" size={22} color="#fff" />
          <Text style={[s.okBtnTxt, { color: '#fff' }]}>{t('see')}</Text>
        </Pressable>
        <Pressable style={[s.okBtn, { backgroundColor: '#F0B93A' }]} onPress={() => setDone(null)}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primaryDark} />
          <Text style={[s.okBtnTxt, { color: colors.primaryDark }]}>{t('another')}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- Titre automatique (si le vendeur n'en écrit pas) ----------
  function autoTitle() {
    const c = catById(d.cat);
    if (d.cat === 'immo' && d.kind) return KIND_L[d.kind][L] + ' ' + (d.deal === 'rent' ? t('rent') : t('sale')).toLowerCase();
    const first = d.desc.trim().split('\n')[0];
    if (first) return first.length > 60 ? first.slice(0, 57) + '…' : first;
    return c ? c[lang] : '';
  }

  // ---------- Vérification de chaque étape ----------
  function collect(step) {
    const e = {};
    if (step === 1) {
      if (!d.cat) e.cat = t('eCat');
      else if (d.cat === 'anim' && !d.sub) e.cat = t('errSpecies');
      else if (d.cat === 'auto' && !d.sub) e.cat = lang === 'ar' ? VEH_ERR.errVkind[1] : VEH_ERR.errVkind[0];
      else if ((d.cat === 'phone' || d.cat === 'multi') && !d.sub) e.cat = ELEC_ERR.errDtype[lang === 'ar' ? 1 : 0];
      else if ((d.cat === 'job' || d.cat === 'serv') && !d.sub) e.cat = T3(d.cat === 'job' ? 'errOffer' : 'errSsub', lang === 'ar');
      else if ((d.cat === 'mode' || d.cat === 'beaute' || d.cat === 'maison') && !d.sub) e.cat = T3('errHsub', lang === 'ar');
      else if (d.cat === 'menager' && !d.sub) e.cat = T3('errHitem', lang === 'ar');
      else if ((d.cat === 'fam' || d.cat === 'alim' || d.cat === 'equip') && !d.sub) e.cat = T3('errHsub', lang === 'ar');
      if (d.cat === 'immo') {
        if (!d.deal) e.deal = t('eDeal');
        else if (!d.kind || !KINDS[d.deal].includes(d.kind)) e.kind = t('eKind');
      }
    }
    if (step === 2 && d.cat === 'immo' && d.photos.length === 0) e.photos = t('ePhotoImmo');
    if (step === 3 && d.cat === 'anim' && !(+digits(d.count) > 0)) e.count = t('errCount');
    if (step === 3) Object.assign(e, detailErrors(d, lang === 'ar'));
    if (step === 3) {
      // Prix masqué : ni le prix ni l'unité ne sont obligatoires (l'annonce part sans prix)
      if (!d.hidep) {
        if (!(+digits(d.price) > 0)) e.price = t('ePrice');
        if (d.punit !== 'old' && d.punit !== 'new') e.punit = t('eUnit');
      }
      if (!d.wa && !d.call) e.contact = t('eContact');
    }
    return e;
  }
  function check(step) {
    const e = collect(step);
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  // Formulaire sur une seule page : toutes les étapes d'un coup
  function checkAll() {
    const e = { ...collect(1), ...collect(2), ...collect(3) };
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Catégories qui ont un écran de choix : sous-catégories, ou vente/location + type pour l'immobilier
  const hasSub = (c) => c === 'immo' || subsOf(c).length > 0;

  // Choisir une sous-catégorie (ou « Tous ») : on reste sur la grille, le choix est entouré ; « Suivant » passe à l'étape 2
  function pickSub(id) { update({ sub: id }); }

  // Précédent / Suivant entre les champs de saisie (dans l'ordre de la page)
  const FIELD_ORDER = ['desc', 'price', 'hood', 'title'];
  function stepField(dir) {
    const i = FIELD_ORDER.indexOf(curF.current);
    for (let j = i + dir; j >= 0 && j < FIELD_ORDER.length; j += dir) {
      const r = fref.current[FIELD_ORDER[j]];
      if (r) { r.focus(); return; }
    }
    Keyboard.dismiss();
  }

  // Photos : une feuille « Galerie / Appareil photo » s'ouvre au clic
  function askPhotos() {
    Alert.alert(t('addPhS'), undefined, [
      { text: t('gallery'), onPress: () => addPhotos('library') },
      { text: t('camera'), onPress: () => addPhotos('camera') },
      { text: t('cancelL'), style: 'cancel' },
    ]);
  }

  // Une seule page : la catégorie s'ouvre sur sa propre page ; le choix revient ici
  function openCat() {
    setCatCallback((c) => { update(c); setErrors((e) => ({ ...e, cat: undefined, deal: undefined, kind: undefined })); });
    router.push({ pathname: '/choisir-categorie', params: { cat: d.cat || '', sub: d.sub || '', deal: d.deal || '', kind: d.kind || '' } });
  }

  // Vidéo : caméra ou galerie → fichier gardé sur le téléphone, envoyé à la publication
  async function addVideo(source) {
    try {
      const v = await pickVideo(source);
      if (v) update({ videoUri: v.uri, video: '' });
    } catch (e) {
      if (e.code === 'permission') notify(t('permAv'));
    }
  }

  function go(step) {
    if (step > d.step && !check(d.step)) {
      return;
    }
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
  function buildAd(photoUrls, video, voice) {
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
      video: video || '', voice: voice || '', // vidéo et message vocal, comme sur le site (vide = rien)
      contacts: { wa: !!d.wa, call: !!d.call, msg: !!d.msg },
      stype: 'part',
    };
    if (d.sub && SUB_KEY[d.cat]) ad[SUB_KEY[d.cat]] = d.sub; // sous-catégorie : même champ que sur le site
    Object.assign(ad, detailAdObject(d));
    if (d.cat === 'anim') ad.anim = { species: d.sub, count: +digits(d.count) || 1, sex: d.sex, age: d.age, breed: d.breed.trim(), tabaski: !!d.tabaski, delivery: !!d.deliv };
    // Copie du formulaire pour pouvoir modifier l'annonce plus tard sur le site (sans la vidéo ni le vocal, trop lourds)
    const { photos, step, voice: _v, voiceUri, video: _vid, videoUri, ...rest } = d;
    ad._d = { ...rest, price: digits(d.price), eq: [], pub: 'owner', stype: 'part' };
    return ad;
  }

  // ---------- Publication ----------
  async function publish() {
    if (busy) return;
    if (ONE_SCREEN ? !checkAll() : !check(3)) { if (ONE_SCREEN) { setDetOpen(true); notify(t('eFix')); } return; }
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

      // 2) vidéo (envoyée par morceaux) et message vocal (déjà sur le téléphone)
      let video = d.video || '';
      if (d.videoUri) {
        setBusy(t('upVid', { p: 0 }));
        try {
          video = await uploadVideo(d.videoUri, (p) => setBusy(t('upVid', { p })));
        } catch (e) {
          if (e.code === 'big') { notify(t('vidBig')); return; }
          throw e;
        }
      }
      let voice = d.voice || '';
      if (d.voiceUri) {
        try {
          voice = await voiceDataUrl(d.voiceUri);
        } catch (e) {
          if (e.code === 'voiceBig') { notify(t('voiceBig')); return; }
          throw e;
        }
      }

      // 3) annonce
      setBusy(t('upSave'));
      if (editing) {
        setBusy(t('saving'));
        const r = await api.updateAd(editAd.id, mergeAd(editAd, buildAd(list, video, voice)));
        const saved = { ...editAd, ...r.ad };
        adCache.set(saved.id, saved);
        invalidateAds();
        setDone(saved);
        return;
      }
      if (admin) {
        const ad = buildAd(list, video, voice);
        const r = adminTarget.kind === 'prospect'
          ? await api.adminProspectPublish(adminTarget.id, ad)
          : await api.adminPublish({ phone: adminTarget.phone, name: adminTarget.name, verify: adminTarget.verify, ad });
        invalidateAds();
        adminTarget.onDone?.(r);
        return;
      }
      const r = await api.publish(buildAd(list, video, voice));
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
  // Compteur : les champs obligatoires qui manquent encore
  const reqErr = collect(3);
  const reqMissing = [];
  if (Object.keys(collect(1)).length) reqMissing.push(t('catL'));
  if (reqErr.price || reqErr.punit) reqMissing.push(t('price'));
  if (reqErr.contact) reqMissing.push(t('contactN'));
  const reqLine = reqMissing.length
    ? t('reqCount', { n: 3 - reqMissing.length, m: 3 }) + ' · ' + t('reqMiss', { x: reqMissing.join(', ') })
    : t('reqDone');
  const previewAd = {
    id: 'preview', status: 'online', title: d.title.trim() || autoTitle(), punit: 'new', hidep: d.hidep,
    price: pu, city: d.city, hood: d.hood, photos: d.photos.map((p) => p.uri || p.url).filter(Boolean),
  };
  // Ligne « sous-catégorie » sous la catégorie choisie (formulaire sur une page)
  const catSub = (() => {
    if (!d.cat) return '';
    if (d.cat === 'immo') return [d.deal && t(d.deal === 'rent' ? 'rent' : 'sale'), d.kind && KIND_L[d.kind]?.[L]].filter(Boolean).join(' · ');
    return (subsOf(d.cat).find((x) => x.id === d.sub) || {})[lang] || '';
  })();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* En-tête : étape + barre de progression */}
      <View style={s.head}>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={s.stepOf}>{editing ? t('editTitle') + (ONE_SCREEN ? '' : ' · ') : ''}{ONE_SCREEN ? reqLine : t('stepOf', { n: step })}</Text>
          {restored && !editing && (
            <Pressable onPress={() => { clearDraft(); setD(newDraft({ city: d.city, hood: d.hood })); setRestored(false); setErrors({}); }}>
              <Text style={s.restart}>{t('restored')} · {t('restart')}</Text>
            </Pressable>
          )}
        </View>
        {editing && !ONE_SCREEN && <Text style={[s.help, al]}>{t('jump')}</Text>}
        {!ONE_SCREEN && <View style={[s.bar, row]}>
          {[1, 2, 3].map((n) => (editing
            // en modification : toucher une barre = aller directement à cette étape (ex. changer seulement le prix)
            ? <Pressable key={n} hitSlop={{ top: 12, bottom: 12 }} style={[s.barPart, { height: 8 }, n <= step && { backgroundColor: colors.primary }]} onPress={() => go(n)} />
            : <View key={n} style={[s.barPart, n <= step && { backgroundColor: colors.primary }]} />))}
        </View>}
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {/* ---------- Une seule page : la catégorie ouvre sa propre page (voir plus bas, « Détails de l'article ») ---------- */}

        {/* ---------- Étape 1 : catégorie et type (ancien formulaire en 3 étapes) ---------- */}
        {!ONE_SCREEN && step === 1 && (
          <>
            <Text style={[s.h1, al]}>{t('st1')}</Text>
            <Text style={[s.sub, al]}>{t('st1sub')}</Text>
            <View style={[s.grid, row]}>
              {CATEGORIES.map((c) => {
                const on = d.cat === c.id;
                return (
                  <Pressable key={c.id} onPress={() => { pendingSub.current = hasSub(c.id); update({ cat: c.id, sub: '' }); setErrors({}); }}
                    style={[s.cat, on && { borderColor: c.c, backgroundColor: c.c + '18' }]}>
                    <CatArt cat={c.id} size={52} />
                    <Text style={[s.catTxt, on && { color: c.c, fontWeight: '800' }]} numberOfLines={2}>{c[lang]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Err errors={errors} rtl={rtl} k="cat" />
            {hasSub(d.cat) && (
              <View key={d.cat} onLayout={onSubLayout} collapsable={false}>
                <Label rtl={rtl}>{(CATEGORIES.find((c) => c.id === d.cat) || {})[lang]}</Label>
                {d.cat === 'immo' ? (
                  /* Immobilier : vente ou location, puis le type de bien (ce sont ses sous-catégories) */
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
                          {KINDS[d.deal].map((k) => <Chip key={k} on={d.kind === k} label={KIND_L[k][L]} onPress={() => { update({ kind: k }); setErrors({}); }} />)}
                        </View>
                        <Err errors={errors} rtl={rtl} k="kind" />
                        <Field rtl={rtl} value={d.surface} onChangeText={(v) => update({ surface: digits(v) })} placeholder={t('surface')} keyboardType="number-pad" />
                      </>
                    )}
                  </>
                ) : (
                  <View style={[s.grid, row]}>
                    <Pressable onPress={() => pickSub('')} style={[s.cat, s.subCat, !d.sub && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}>
                      <View style={s.allIcon}><Ionicons name="grid-outline" size={30} color={colors.primaryDark} /></View>
                      <Text style={[s.catTxt, !d.sub && { color: colors.primary, fontWeight: '800' }]} numberOfLines={2}>{lang === 'ar' ? 'الكل' : 'Tous'}</Text>
                    </Pressable>
                    {subsOf(d.cat).map((x) => {
                      const on = d.sub === x.id;
                      return (
                        <Pressable key={x.id} onPress={() => pickSub(x.id)} style={[s.cat, s.subCat, on && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}>
                          <SubArt cat={d.cat} sub={x.id} size={52} />
                          <Text style={[s.catTxt, on && { color: colors.primary, fontWeight: '800' }]} numberOfLines={2}>{x[lang]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ---------- Étape 2 : photos, titre, description ---------- */}
        {/* ---------- Une seule page : photos, présentation, détails, prix, lieu, contact ---------- */}
        {ONE_SCREEN && (
          <>
            <View style={s.card}>
            <View style={[row, s.secRow]}>
              <Text style={[s.secT, al]}>{t('photos')}</Text>
              <Text style={s.count}>{t('photosN', { n: d.photos.length })}</Text>
            </View>
            <View style={s.dash}>
              {d.photos.length === 0 ? (
                <Pressable style={s.addPh} onPress={askPhotos}>
                  <Ionicons name="add" size={22} color={colors.primary} />
                  <Text style={s.addPhTxt}>{t('addPhS')}</Text>
                </Pressable>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[row, { gap: 8 }]}>
                  {d.photos.map((p, i) => (
                    <Pressable key={p.key} style={s.thumbS} onPress={() => (p.status === 'err' ? startUpload(p) : makeMain(p.key))}>
                      <Image source={p.uri || mediaUrl(p.url) || null} style={s.thumbImg} contentFit="cover" />
                      {p.status === 'up' && <View style={s.thumbOver}><ActivityIndicator color="#fff" /></View>}
                      {(p.status === 'err' || (p.status === 'todo' && !p.uri)) && <View style={[s.thumbOver, { backgroundColor: 'rgba(220,38,38,0.7)' }]}><Text style={s.thumbErr}>⚠︎ ↻</Text></View>}
                      {i === 0 && <Text style={s.mainTag}>{t('main')}</Text>}
                      <Pressable style={s.del} hitSlop={8} onPress={() => removePhoto(p.key)}><Text style={s.delTxt}>✕</Text></Pressable>
                    </Pressable>
                  ))}
                  {d.photos.length < MAX_PHOTOS && (
                    <Pressable style={s.tileAdd} onPress={askPhotos}>
                      <Ionicons name="add" size={26} color={colors.primary} />
                    </Pressable>
                  )}
                </ScrollView>
              )}
            </View>
            <Err errors={errors} rtl={rtl} k="photos" />
            {d.photos.some((p) => p.status === 'err') && <Text style={[s.err, al]}>{t('photoErr')}</Text>}

            </View>

            <View style={s.card}>
            <Text style={[s.secT, s.secGap, al]}>{t('secPres')}</Text>
            <Label rtl={rtl}>{t('descOpt')}</Label>
            <Field rtl={rtl} ref={(r) => { fref.current.desc = r; }} onFocus={() => { curF.current = 'desc'; }} style={[CF, { height: Math.max(64, descH), textAlignVertical: 'top' }]} value={d.desc} onChangeText={(v) => update({ desc: v })}
              onContentSizeChange={(e) => setDescH(e.nativeEvent.contentSize.height + 22)}
              placeholder={t('descPh')} multiline maxLength={3000} />

            </View>

            <View style={s.card}>
            <Text style={[s.secT, s.secGap, al]}>{t('secDet')}</Text>
            <Pressable onPress={openCat} style={[s.catRow, row]}>
              {d.cat && <CatArt cat={d.cat} size={34} />}
              <View style={{ flex: 1 }}>
                <Text style={[s.catRowTxt, al, !d.cat && { color: colors.muted, fontWeight: '600' }]}>
                  {(CATEGORIES.find((c) => c.id === d.cat) || {})[lang] || t('catL')}
                </Text>
                {!!catSub && <Text style={[s.help, al]}>{catSub}</Text>}
              </View>
              <Ionicons name={d.cat ? (rtl ? 'chevron-back' : 'chevron-forward') : 'add'} size={22} color={colors.primary} />
            </Pressable>
            <Err errors={errors} rtl={rtl} k="cat" />
            <Err errors={errors} rtl={rtl} k="deal" />
            <Err errors={errors} rtl={rtl} k="kind" />
            {d.cat === 'immo' && !!d.kind && (
              <Field rtl={rtl} style={CF} value={d.surface} onChangeText={(v) => update({ surface: digits(v) })} placeholder={t('surface')} keyboardType="number-pad" />
            )}

            </View>

            <View style={s.card}>
            <Text style={[s.secT, s.secGap, al]}>{t('price')}</Text>
            <View style={[s.priceBox, row]}>
              <Field rtl={rtl} ref={(r) => { fref.current.price = r; }} onFocus={() => { curF.current = 'price'; }} style={s.priceIn} value={pu ? fmtN(pu).replace(/[\u2066\u2069]/g, '') : ''}
                onChangeText={(v) => update({ price: digits(v).slice(0, 12) })} placeholder="0" keyboardType="number-pad" />
              <Text style={s.priceUnit}>{t(d.punit === 'old' ? 'sufOld' : 'sufNew')}</Text>
            </View>
            <Err errors={errors} rtl={rtl} k="punit" />
            <Err errors={errors} rtl={rtl} k="price" />
            {pu > 0 && d.punit === 'old' && <Text style={[s.help, al]}>{t('eqNew', { v: ltr(fmtN(pu / 10)) })}</Text>}
            {pu > 0 && d.punit === 'new' && <Text style={[s.help, al]}>{t('eqOld', { v: ltr(fmtN(pu * 10)) })}</Text>}
            <View style={[row, { gap: 8, flexWrap: 'wrap', marginTop: 4 }]}>
              <Tick rtl={rtl} on={d.hidep} label={t('hidep')} onPress={() => { update({ hidep: !d.hidep }); setErrors((e) => ({ ...e, price: undefined, punit: undefined })); }} />
              <Tick rtl={rtl} on={d.nego} label={t('nego')} onPress={() => update({ nego: !d.nego })} />
              <Tick rtl={rtl} on={d.deliv} label={t('deliv')} onPress={() => update({ deliv: !d.deliv })} />
            </View>
            {d.deliv && <Field rtl={rtl} style={CF} value={d.delivNote} onChangeText={(v) => update({ delivNote: v })} placeholder={t('delivNote')} maxLength={80} />}

            </View>

            <Text style={[s.secT, s.secGap, al]}>{t('secLoc')}</Text>
            <View style={[row, { gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <PickSheet value={d.city} options={CITY_OPTS} placeholder={ar ? 'اختر المدينة' : 'Choisir la ville'} title={t('city')} rtl={rtl} ar={ar}
                  onPick={(c) => update({ city: c, hood: c === d.city ? d.hood : '' })} />
              </View>
              <View style={{ flex: 1 }}>
                {d.city === 'Nouakchott' ? (
                  <PickSheet value={d.hood} options={HOOD_OPTS} placeholder={ar ? 'المقاطعة' : 'Quartier'} title={t('hoodNkc')} rtl={rtl} ar={ar}
                    onPick={(h) => update({ hood: h })} />
                ) : (
                  <Field rtl={rtl} style={CF} ref={(r) => { fref.current.hood = r; }} onFocus={() => { curF.current = 'hood'; }} value={d.hood} onChangeText={(v) => update({ hood: v })} placeholder={t('hood')} maxLength={40} />
                )}
              </View>
            </View>

            <Label rtl={rtl}>{t('contactAt')} <Text style={{ color: colors.primaryDark }}>{user.phone}</Text></Label>
            <View style={[s.chips, row]}>
              <Chip on={d.wa} label={t('wa')} icon="logo-whatsapp" color="#25D366" onPress={() => update({ wa: !d.wa })} />
              <Chip on={d.call} label={t('call')} icon="call-outline" onPress={() => update({ call: !d.call })} />
              <Chip on={d.msg} label={t('msgApp')} icon="chatbubble-ellipses-outline" onPress={() => update({ msg: !d.msg })} />
            </View>
            <Err errors={errors} rtl={rtl} k="contact" />

            <Fold title={t('moreOpt')} rtl={rtl} open={moreOpen} onToggle={() => setMoreOpen((v) => !v)}>
              <Label rtl={rtl}>{t('title')}</Label>
              <Field rtl={rtl} style={CF} ref={(r) => { fref.current.title = r; }} onFocus={() => { curF.current = 'title'; }}
                value={d.title} onChangeText={(v) => update({ title: v })} placeholder={t('titlePh')} maxLength={70} />
              <View style={[row, { gap: 8 }]}>
                {d.videoUri || d.video ? (
                  <View style={[s.mediaRow, row, { flex: 1 }]}>
                    <Text style={s.mediaOk}>🎬 {t('vidOk')}</Text>
                    <Pressable hitSlop={8} onPress={() => update({ videoUri: '', video: '' })}><Text style={s.linkDanger}>{t('vidDel')}</Text></Pressable>
                  </View>
                ) : (
                  <>
                    <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addVideo('camera')}><Text style={s.btnLightTxt}>{t('vidCam')}</Text></Pressable>
                    <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addVideo('library')}><Text style={s.btnLightTxt}>{t('vidGal')}</Text></Pressable>
                  </>
                )}
              </View>
              <VoiceRecorder t={t} rtl={rtl} uri={d.voiceUri} saved={!!d.voice} savedData={d.voice} savedId={editAd ? editAd.id : 'nouvelle'}
                onRecorded={(uri) => update({ voiceUri: uri, voice: '' })}
                onRemove={() => update({ voiceUri: '', voice: '' })} />
            </Fold>

            {d.cat === 'anim' && (
              <Fold title={t('animInfo') + t('optSuffix')} rtl={rtl}
                open={detOpen}
                onToggle={() => setDetOpen((v) => !v)}>
                <Text style={[s.help, al]}>{t('species')} : {(subsOf('anim').find((x) => x.id === d.sub) || {})[lang] || '—'}</Text>
                <Label rtl={rtl}>{t('count')}</Label>
                <Field rtl={rtl} style={CF} value={d.count} keyboardType="number-pad" maxLength={4} placeholder="1"
                  onChangeText={(v) => update({ count: digits(v).slice(0, 4) })} />
                <Err errors={errors} rtl={rtl} k="count" />
                <Label rtl={rtl}>{t('sex')}</Label>
                <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
                  {['m', 'f', 'mix'].map((x) => (
                    <Pressable key={x} onPress={() => update({ sex: d.sex === x ? '' : x })} style={[s.chip, d.sex === x && s.chipOn]}>
                      <Text style={[s.chipTxt, d.sex === x && s.chipTxtOn]}>{t('sx_' + x)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Label rtl={rtl}>{t('age')}</Label>
                <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
                  {['0', '1', '2', '4'].map((x) => (
                    <Pressable key={x} onPress={() => update({ age: d.age === x ? '' : x })} style={[s.chip, d.age === x && s.chipOn]}>
                      <Text style={[s.chipTxt, d.age === x && s.chipTxtOn]}>{t('ag_' + x)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Label rtl={rtl}>{t('breed')}</Label>
                <Field rtl={rtl} style={CF} value={d.breed} maxLength={30} placeholder={t('breedPh')} onChangeText={(v) => update({ breed: v })} />
                {d.sub !== 'volaille' && d.sub !== 'autre' && (
                  <Pressable onPress={() => update({ tabaski: !d.tabaski })} style={[row, { alignItems: 'center', gap: 8 }]}>
                    <Text style={s.chipTxt}>{d.tabaski ? '☑' : '☐'}</Text>
                    <Text style={s.chipTxt}>{t('tabaski')}</Text>
                  </Pressable>
                )}
              </Fold>
            )}
            {detailFields(d).length > 0 && (
              <Fold title={detailTitle(d, lang === 'ar') + t('optSuffix')} rtl={rtl}
                open={detOpen}
                onToggle={() => setDetOpen((v) => !v)}>
                {detailFields(d).map((f) => (
                  <VehField key={f.k} f={f} d={d} update={update} lang={lang} rtl={rtl} errors={errors} />
                ))}
              </Fold>
            )}
          </>
        )}

        {/* ---------- Étape 2 : photos, titre, description (ancien formulaire en 3 étapes) ---------- */}
        {!ONE_SCREEN && step === 2 && (
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
                <Pressable style={[s.btnLight, s.addBtn]} onPress={() => addPhotos('library')}><Ionicons name="images-outline" size={22} color={colors.primaryDark} /><Text style={s.btnLightTxt}>{t('gallery')}</Text></Pressable>
                <Pressable style={[s.btnLight, s.addBtn]} onPress={() => addPhotos('camera')}><Ionicons name="camera-outline" size={22} color={colors.primaryDark} /><Text style={s.btnLightTxt}>{t('camera')}</Text></Pressable>
              </View>
            )}
            <Err errors={errors} rtl={rtl} k="photos" />

            <Label rtl={rtl}>{t('title')}</Label>
            <Field rtl={rtl} value={d.title} onChangeText={(v) => update({ title: v })} placeholder={autoTitle() || t('title')} maxLength={70} />
            <Text style={[s.help, al]}>{t('titleHelp')}</Text>

            <Label rtl={rtl}>{t('desc')}</Label>
            <Field rtl={rtl} value={d.desc} onChangeText={(v) => update({ desc: v })} placeholder={t('descPh')} multiline
              style={{ minHeight: 120, textAlignVertical: 'top' }} maxLength={3000} />

            {(moreOpen || d.videoUri || d.video || d.voiceUri || d.voice) ? (
              <>
              <Label rtl={rtl}>{t('vidL')}</Label>
              {d.videoUri || d.video ? (
                <View style={[s.mediaRow, row]}>
                  <Text style={s.mediaOk}>🎬 {t('vidOk')}</Text>
                  <Pressable hitSlop={8} onPress={() => update({ videoUri: '', video: '' })}><Text style={s.linkDanger}>{t('vidDel')}</Text></Pressable>
                </View>
              ) : (
                <View style={[row, { gap: 8 }]}>
                  <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addVideo('camera')}><Text style={s.btnLightTxt}>{t('vidCam')}</Text></Pressable>
                  <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => addVideo('library')}><Text style={s.btnLightTxt}>{t('vidGal')}</Text></Pressable>
                </View>
              )}
              <Text style={[s.help, al]}>{t('vidHelp')}</Text>

              <Label rtl={rtl}>{t('voiceL')}</Label>
              <VoiceRecorder t={t} rtl={rtl} uri={d.voiceUri} saved={!!d.voice} savedData={d.voice} savedId={editAd ? editAd.id : 'nouvelle'}
                onRecorded={(uri) => update({ voiceUri: uri, voice: '' })}
                onRemove={() => update({ voiceUri: '', voice: '' })} />
              </>
            ) : (
              <Pressable onPress={() => setMoreOpen(true)} style={s.moreBtn}>
                <Text style={s.moreTxt}>+ {t('moreMed')}</Text>
              </Pressable>
            )}

          </>
        )}

        {/* ---------- Étape 3 : prix, lieu, contact, aperçu ---------- */}
        {(ONE_SCREEN || step === 3) && (
          <>
            {ONE_SCREEN ? <View style={s.sep} /> : <Text style={[s.h1, al]}>{t('st3')}</Text>}
            {!ONE_SCREEN && <Text style={[s.sub, al]}>{t('st3sub')}</Text>}

            {!ONE_SCREEN && <>
            <Label rtl={rtl}>{t('unit')}</Label>
            <View style={[s.chips, row]}>
              <Chip on={d.punit === 'new'} label={t('unitNew')} onPress={() => update({ punit: 'new' })} />
              <Chip on={d.punit === 'old'} label={t('unitOld')} onPress={() => update({ punit: 'old' })} />
            </View>
            <Err errors={errors} rtl={rtl} k="punit" />
            {pu > 0 && d.punit === 'old' && <Text style={[s.help, al]}>{t('eqNew', { v: ltr(fmtN(pu / 10)) })}</Text>}
            {pu > 0 && d.punit === 'new' && <Text style={[s.help, al]}>{t('eqOld', { v: ltr(fmtN(pu * 10)) })}</Text>}
            <Label rtl={rtl}>{t('price')}</Label>
            <Field rtl={rtl} value={pu ? fmtN(pu).replace(/[\u2066\u2069]/g, '') : ''} onChangeText={(v) => update({ price: digits(v).slice(0, 12) })} placeholder="0" keyboardType="number-pad" style={{ fontSize: 20, fontWeight: '700', writingDirection: 'ltr', textAlign: 'right' }} />
            <Err errors={errors} rtl={rtl} k="price" />
            <Toggle rtl={rtl} label={t('nego')} value={d.nego} onChange={(v) => update({ nego: v })} />
            <Toggle rtl={rtl} label={t('hidep')} value={d.hidep} onChange={(v) => { update({ hidep: v }); setErrors({}); }} />
            {d.hidep && <Text style={[s.help, al]}>{t('priceOpt')}</Text>}

            <Label rtl={rtl}>{t('city')}</Label>
            <PickSheet value={d.city} options={CITY_OPTS} placeholder={ar ? 'اختر المدينة' : 'Choisir la ville'} title={t('city')} rtl={rtl} ar={ar}
              onPick={(c) => update({ city: c, hood: c === d.city ? d.hood : '' })} />

            {d.city === 'Nouakchott' ? (
              <>
                <Label rtl={rtl}>{t('hoodNkc')}</Label>
                <PickSheet value={d.hood} options={HOOD_OPTS} placeholder={ar ? 'اختر (اختياري)' : 'Choisir (facultatif)'} title={t('hoodNkc')} rtl={rtl} ar={ar}
                  onPick={(h) => update({ hood: h })} />
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
            <Toggle rtl={rtl} label={t('wa')} icon="logo-whatsapp" value={d.wa} onChange={(v) => update({ wa: v })} />
            <Toggle rtl={rtl} label={t('call')} icon="call-outline" iconColor={colors.primary} value={d.call} onChange={(v) => update({ call: v })} />
            <Err errors={errors} rtl={rtl} k="contact" />

            <Label rtl={rtl}>{t('preview')}</Label>
            <View style={{ width: '55%', alignSelf: rtl ? 'flex-end' : 'flex-start' }}>
              <AdCard preview ad={{
                id: 'preview', status: 'online', title: d.title.trim() || autoTitle(), punit: d.punit || 'new', hidep: d.hidep,
                price: d.punit === 'old' ? Math.round(pu / 10) : pu, priceOld: d.punit === 'old' ? pu : undefined,
                city: d.city, hood: d.hood, photos: d.photos.map((p) => p.uri || p.url).filter(Boolean),
              }} />
            </View>
            </>}

          </>
        )}
      </ScrollView>

      {/* Boutons du bas (clavier ouvert : un bouton « Terminé » à la place, pour le fermer) */}
      {ONE_SCREEN && kbOpen ? (
        <View style={s.kbBar}>
          <View style={[row, s.kbRow]}>
            <Pressable hitSlop={12} onPress={() => stepField(-1)}><Text style={s.kbNav}>{t('kbPrev')}</Text></Pressable>
            <Pressable hitSlop={12} onPress={() => stepField(1)}><Text style={s.kbNav}>{t('kbNext')}</Text></Pressable>
            <Pressable hitSlop={12} onPress={() => Keyboard.dismiss()}><Text style={s.kbDone}>{t('kbDone')}</Text></Pressable>
          </View>
        </View>
      ) : (
      <View style={[s.foot, row]}>
        {!ONE_SCREEN && step > 1 && (
          <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => go(step - 1)} disabled={!!busy}>
            <Text style={s.btnLightTxt}>{t('prev')}</Text>
          </Pressable>
        )}
        {ONE_SCREEN && (
          <Pressable style={[s.btnLight, { flex: 1 }]} onPress={() => setPreviewOpen(true)}>
            <Text style={s.btnLightTxt}>{t('previewBtn')}</Text>
          </Pressable>
        )}
        <Pressable style={[s.btnMain, { flex: 2 }, !!busy && { opacity: 0.7 }]} disabled={!!busy}
          onPress={() => (ONE_SCREEN || step === 3 ? publish() : go(step + 1))}>
          {busy
            ? <View style={[row, { gap: 8, alignItems: 'center' }]}><ActivityIndicator color="#fff" /><Text style={s.btnMainTxt}>{busy}</Text></View>
            : <Text style={s.btnMainTxt}>{!ONE_SCREEN && step < 3 ? t('next') : editing ? t('save') : t('publish')}</Text>}
        </Pressable>
      </View>
      )}

      {/* Aperçu de l'annonce, avant de la publier */}
      <Modal visible={ONE_SCREEN && previewOpen} animationType="slide" onRequestClose={() => setPreviewOpen(false)}>
        <ScrollView contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 24, gap: 12, alignItems: 'center' }} style={{ backgroundColor: colors.bg }}>
          <Text style={s.secT}>{t('previewT')}</Text>
          <View style={{ width: '60%' }}>
            <AdCard preview ad={previewAd} />
          </View>
          {!!d.desc.trim() && <Text style={[s.sub, al, { alignSelf: 'stretch' }]}>{d.desc}</Text>}
        </ScrollView>
        <View style={s.foot}>
          <Pressable style={s.btnMain} onPress={() => setPreviewOpen(false)}><Text style={s.btnMainTxt}>{t('back')}</Text></Pressable>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// Page « Choisir la catégorie » (formulaire sur une seule page) : 1 · catégorie, puis 2 · type.
// Le choix est rendu au formulaire par src/catPick.js, puis la page se ferme.
export function CatPickScreen() {
  const params = useLocalSearchParams();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), D[lang][k] ?? k);
  const L = lang === 'ar' ? 1 : 0;
  const al = alignOf(rtl);
  const row = rowOf(rtl);
  const [v, setV] = useState(() => ({
    cat: String(params.cat || ''), sub: String(params.sub || ''), deal: String(params.deal || ''), kind: String(params.kind || ''),
  }));
  const scroll = useRef(null);
  const subY = useRef(0);
  const pendingSub = useRef(false);
  const hasSub = (c) => c === 'immo' || subsOf(c).length > 0;
  const complete = !!v.cat && (v.cat === 'immo'
    ? !!v.deal && KINDS[v.deal].includes(v.kind)
    : (!hasSub(v.cat) || !!v.sub));

  function chooseCat(id) {
    pendingSub.current = hasSub(id);
    setV({ cat: id, sub: '', deal: '', kind: '' });
  }
  // Quand les sous-catégories apparaissent, la page descend jusqu'à elles
  const onSubLayout = (e) => {
    subY.current = e.nativeEvent.layout.y;
    if (pendingSub.current) {
      pendingSub.current = false;
      scroll.current?.scrollTo({ y: Math.max(0, subY.current - 12), animated: true });
    }
  };
  function confirm() {
    if (!complete) return;
    const give = takeCatCallback();
    give?.(v.cat === 'immo'
      ? { cat: v.cat, sub: '', deal: v.deal, kind: v.kind }
      : { cat: v.cat, sub: v.sub, deal: '', kind: '' });
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={s.pickBlock}>
          <Text style={[s.pickHead, al]}>{t('pick1')}</Text>
          <View style={[s.grid, row]}>
            {CATEGORIES.map((c) => {
              const on = v.cat === c.id;
              return (
                <Pressable key={c.id} onPress={() => chooseCat(c.id)}
                  style={[s.cat, on && { borderColor: c.c, backgroundColor: c.c + '18' }]}>
                  <CatArt cat={c.id} size={52} />
                  <Text style={[s.catTxt, on && { color: c.c, fontWeight: '800' }]} numberOfLines={2}>{c[lang]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!!v.cat && (
          <View key={v.cat} onLayout={onSubLayout} collapsable={false} style={[s.pickBlock, s.pickBlockTint]}>
            <Text style={[s.pickHead, al]}>{t('pick2')}</Text>
            {v.cat === 'immo' ? (
              <>
                <Label rtl={rtl}>{t('deal')}</Label>
                <View style={[s.chips, row]}>
                  <Chip on={v.deal === 'sale'} label={t('sale')}
                    onPress={() => setV((p) => ({ ...p, deal: 'sale', kind: KINDS.sale.includes(p.kind) ? p.kind : '' }))} />
                  <Chip on={v.deal === 'rent'} label={t('rent')}
                    onPress={() => setV((p) => ({ ...p, deal: 'rent', kind: KINDS.rent.includes(p.kind) ? p.kind : '' }))} />
                </View>
                {!!v.deal && (
                  <>
                    <Label rtl={rtl}>{t('kind')}</Label>
                    <View style={[s.chips, row]}>
                      {KINDS[v.deal].map((k) => (
                        <Chip key={k} on={v.kind === k} label={KIND_L[k][L]} onPress={() => setV((p) => ({ ...p, kind: k }))} />
                      ))}
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={[s.grid, row]}>
                {subsOf(v.cat).map((x) => {
                  const on = v.sub === x.id;
                  return (
                    <Pressable key={x.id} onPress={() => setV((p) => ({ ...p, sub: x.id }))}
                      style={[s.cat, s.subCat, on && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}>
                      <SubArt cat={v.cat} sub={x.id} size={52} />
                      <Text style={[s.catTxt, on && { color: colors.primary, fontWeight: '800' }]} numberOfLines={2}>{x[lang]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={s.foot}>
        <Pressable style={[s.btnMain, !complete && { opacity: 0.5 }]} disabled={!complete} onPress={confirm}>
          <Text style={s.btnMainTxt}>{t('pickOk')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  fold: { borderWidth: 1, borderColor: '#CFE3D6', borderRadius: 14, backgroundColor: colors.white, marginTop: 10, overflow: 'hidden' },
  foldHead: { alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 12, backgroundColor: '#EEF5F0' },
  foldTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  foldBody: { padding: 12, gap: 8 },
  tick: { alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.white },
  tickOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  tickTxt: { fontSize: 14, fontWeight: '600', color: colors.text },
  segRow: { gap: 8 },
  segBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center' },
  segOn: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  segTxt: { fontSize: 15, fontWeight: '700', color: colors.text },
  segTxtOn: { color: colors.primary, fontWeight: '800' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kbBar: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F3F3', borderTopWidth: 1, borderColor: colors.border },
  kbDone: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  kbNav: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  kbRow: { width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  priceBox: { alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, backgroundColor: colors.white, paddingHorizontal: 14, minHeight: 64 },
  priceIn: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', padding: 0, fontSize: 26, fontWeight: '800', color: colors.text, writingDirection: 'ltr', textAlign: 'right' },
  priceUnit: { fontSize: 14, fontWeight: '700', color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#E6DFCF', borderRadius: 14, padding: 12, gap: 8 },
  secRow: { justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  secT: { fontSize: 17, fontWeight: '800', color: colors.text },
  secGap: { marginTop: 10 },
  dash: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 14, padding: 8, backgroundColor: '#F7FBF8' },
  addPh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white },
  addPhTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  tileAdd: { width: 76, height: 76, borderRadius: radius.m, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tile: { width: 84, height: 84, borderRadius: radius.m, backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center', gap: 4 },
  tileTxt: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  thumbS: { width: 76, height: 76, borderRadius: radius.m, overflow: 'hidden', backgroundColor: colors.border },
  catRow: { alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, backgroundColor: colors.white, padding: 10 },
  catRowTxt: { fontSize: 16, fontWeight: '700', color: colors.text },
  pickBlock: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 10, gap: 8 },
  pickBlockTint: { backgroundColor: '#EEF5F0', borderColor: '#CFE3D6' },
  pickHead: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  detBox: { backgroundColor: '#EEF5F0', borderRadius: 12, padding: 12, gap: 8, marginBottom: 12 },
  checkRow: { alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, backgroundColor: colors.white, paddingVertical: 12, paddingHorizontal: 14, marginVertical: 4 },
  checkTxt: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '600' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  chipTxt: { color: colors.text, fontWeight: '600' },
  chipTxtOn: { color: colors.primary, fontWeight: '800' },

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
  subCat: { width: '23%', aspectRatio: 0.8, padding: 4 },
  allIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center' },
  backRow: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  backTxt: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  subLine: { alignItems: 'center', paddingVertical: 10 },
  subLineTxt: { fontWeight: '700', fontSize: 15 },
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
  moreBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.m, padding: 14, alignItems: 'center', backgroundColor: '#EEF5F0', marginTop: 6 },
  moreTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  mediaRow: { alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#EEF5F0', borderRadius: radius.m, padding: 12 },
  mediaOk: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  linkDanger: { color: colors.danger, fontWeight: '700' },
  toggleTxt: { fontSize: 15, color: colors.text, flex: 1 },
  // Espace en bas : le bouton « + » de la barre d'onglets dépasse de 26 px et ne doit pas couvrir « Suivant »
  foot: { gap: 8, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 40, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border },
  btnMain: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnMainTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  okBtn: { width: '100%', height: 56, borderRadius: radius.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  okBtnTxt: { fontSize: 17, fontWeight: '800' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14 },
  pickBtnOn: { borderColor: colors.primary },
  pickTxt: { fontSize: 16, color: colors.text, fontWeight: '600', flex: 1 },
  pickArrow: { fontSize: 16, color: colors.primary, marginLeft: 8 },
  sheetBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '70%' },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetRowOn: { backgroundColor: colors.primary + '12' },
  sheetTxt: { fontSize: 16, color: colors.text, flex: 1 },
  sheetClose: { marginTop: 12, backgroundColor: '#EEF5F0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sheetCloseTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnLight: { backgroundColor: '#EEF5F0', borderRadius: radius.m, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  btnLightTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  centerTxt: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  okT: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
