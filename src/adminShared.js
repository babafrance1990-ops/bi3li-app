// Textes et petits outils communs aux pages d'administration
import { api } from './api';

export const ADMIN_T = {
  fr: {
    title: 'Administration', total: 'Inscrits', new24: 'Nouveaux (24 h)', online: 'En ligne', ads24: 'Annonces (24 h)', msgs24: 'Messages (24 h)',
    reportsBtn: 'Signalements', usersBtn: 'Utilisateurs', shopsBtn: 'Boutiques', open: 'Ouvrir',
    reports: 'Signalements', noReports: 'Aucun signalement.', repN: '{n} signalement(s)', delAd: 'Supprimer l’annonce', ignore: 'Ignorer',
    confirmDel: 'Supprimer cette annonce ?', confirmBlock: 'Bloquer cet utilisateur ?', cancel: 'Annuler', block: 'Bloquer', unblock: 'Débloquer',
    search: 'Rechercher par numéro', verified: 'Vérifié', verify: 'Vérifier', unverify: 'Retirer la vérification', blocked: 'Bloqué',
    recruiterOn: '✓ Recruteur (retirer)', recruiterSet: 'Mettre recruteur', pw: 'Nouveau code', pwSave: 'Enregistrer le code',
    pwHelp: 'Code à 4 chiffres', pwOk: 'Code modifié.', noUser: 'Aucun utilisateur.', adsN: '{n} annonce(s)',
    shops: 'Boutiques', noShop: 'Aucune boutique.', shopVerify: 'Vérifier la boutique', shopUnverify: 'Retirer la vérification',
    err: 'Action impossible. Vérifiez la connexion.', notAdmin: 'Cet espace est réservé à l’administrateur.',
  },
  ar: {
    title: 'الإدارة', total: 'المسجّلون', new24: 'جدد (24 ساعة)', online: 'متصلون', ads24: 'إعلانات (24 ساعة)', msgs24: 'رسائل (24 ساعة)',
    reportsBtn: 'البلاغات', usersBtn: 'المستخدمون', shopsBtn: 'المتاجر', open: 'فتح',
    reports: 'البلاغات', noReports: 'لا توجد بلاغات.', repN: 'بلاغات: {n}', delAd: 'حذف الإعلان', ignore: 'تجاهل',
    confirmDel: 'حذف هذا الإعلان؟', confirmBlock: 'حظر هذا المستخدم؟', cancel: 'إلغاء', block: 'حظر', unblock: 'إلغاء الحظر',
    search: 'ابحث بالرقم', verified: 'موثّق', verify: 'توثيق', unverify: 'إلغاء التوثيق', blocked: 'محظور',
    recruiterOn: '✓ مندوب (إزالة)', recruiterSet: 'تعيين مندوب', pw: 'رمز جديد', pwSave: 'حفظ الرمز',
    pwHelp: 'رمز من 4 أرقام', pwOk: 'تم تغيير الرمز.', noUser: 'لا يوجد مستخدم.', adsN: 'إعلانات: {n}',
    shops: 'المتاجر', noShop: 'لا توجد متاجر.', shopVerify: 'توثيق المتجر', shopUnverify: 'إلغاء توثيق المتجر',
    err: 'تعذّر تنفيذ الإجراء. تحقق من الاتصال.', notAdmin: 'هذه الصفحة للمدير فقط.',
  },
};

export function adminT(lang) {
  return (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), ADMIN_T[lang][k] ?? k);
}

// Exécute une action d'administration puis appelle reload ; renvoie un message d'erreur ou ''
export async function runAdmin(fn, reload, errMsg) {
  try {
    await fn();
    await reload();
    return '';
  } catch {
    return errMsg;
  }
}

export const adminApi = api;
