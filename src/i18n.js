// Textes en arabe (langue par défaut) et en français
import { createContext, useContext, useState } from 'react';

const T = {
  ar: {
    home: 'الرئيسية', search: 'بحث', post: 'أضف إعلان', messages: 'الرسائل', account: 'حسابي',
    all: 'الكل', latest: 'أحدث الإعلانات', loading: 'جارٍ التحميل…', retry: 'إعادة المحاولة', netErr: 'تعذّر الاتصال بالإنترنت',
    login: 'تسجيل الدخول / إنشاء حساب', phone: 'رقم الهاتف (8 أرقام)', code: 'الرقم السري (4 أرقام)', code2: 'أعد كتابة الرقم السري',
    name: 'اسمك', next: 'التالي', enter: 'دخول', create: 'إنشاء حسابي', logout: 'تسجيل الخروج', forgot: 'نسيت الرقم السري؟',
    newAccount: 'رقم جديد: أنشئ حسابك', welcomeBack: 'مرحباً بعودتك!',
    errPhone: 'اكتب رقماً من 8 أرقام', errCode: 'الرقم السري يجب أن يكون 4 أرقام', errSame: 'الرقمان غير متطابقين',
    errBad: 'الرقم السري غير صحيح. المحاولات المتبقية: ', errLocked: 'تم إيقاف الحساب مؤقتاً. حاول بعد (دقائق): ',
    errWeak: 'الرقم السري سهل جداً (مثل 1234). اختر رقماً آخر', errName: 'اكتب اسمك', errBlocked: 'هذا الحساب موقوف',
    call: 'اتصال', whatsapp: 'واتساب', message: 'رسالة', soon: 'قريباً في التطبيق', seller: 'البائع',
    verifiedNum: 'رقم مؤكَّد ✓', notVerified: 'رقم غير مؤكَّد', loginToSee: 'سجّل الدخول لرؤية رسائلك', lang: 'Français',
    description: 'الوصف', sold: 'تم البيع',
    videoTag: 'فيديو', voiceTag: 'رسالة صوتية', playVid: 'تشغيل الفيديو', listenVoice: 'استمع إلى الرسالة',
  },
  fr: {
    home: 'Accueil', search: 'Recherche', post: 'Déposer', messages: 'Messages', account: 'Mon compte',
    all: 'Toutes', latest: 'Dernières annonces', loading: 'Chargement…', retry: 'Réessayer', netErr: 'Pas de connexion Internet',
    login: 'Se connecter / Créer un compte', phone: 'Numéro (8 chiffres)', code: 'Code secret (4 chiffres)', code2: 'Confirmez le code',
    name: 'Votre nom', next: 'Suivant', enter: 'Entrer', create: 'Créer mon compte', logout: 'Se déconnecter', forgot: 'Code oublié ?',
    newAccount: 'Nouveau numéro : créez votre compte', welcomeBack: 'Bon retour !',
    errPhone: 'Tapez un numéro à 8 chiffres', errCode: 'Le code doit avoir 4 chiffres', errSame: 'Les deux codes sont différents',
    errBad: 'Code incorrect. Essais restants : ', errLocked: 'Compte bloqué un moment. Réessayez dans (minutes) : ',
    errWeak: 'Code trop simple (ex. 1234). Choisissez-en un autre', errName: 'Tapez votre nom', errBlocked: 'Ce compte est bloqué',
    call: 'Appeler', whatsapp: 'WhatsApp', message: 'Message', soon: "Bientôt dans l'application", seller: 'Vendeur',
    verifiedNum: 'Numéro vérifié ✓', notVerified: 'Numéro non vérifié', loginToSee: 'Connectez-vous pour voir vos messages', lang: 'العربية',
    description: 'Description', sold: 'Vendu',
    videoTag: 'Vidéo', voiceTag: 'Message vocal', playVid: 'Lire la vidéo', listenVoice: 'Écouter le message',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const t = (k) => T[lang][k] ?? k;
  return (
    <LangContext.Provider value={{ lang, setLang, t, rtl: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
