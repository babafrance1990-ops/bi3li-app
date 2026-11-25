// À propos de Bi3li : présentation, conseils de sécurité et contact WhatsApp (textes repris du site)
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { api } from '../src/api';
import { useLang } from '../src/i18n';
import { colors, radius } from '../src/theme';

const AB = {
  fr: {
    t: 'À propos de Bi3li', hero: 'Le site de petites annonces de la Mauritanie : achetez et vendez près de chez vous, gratuitement.',
    sell: 'Vendre', sell1: 'Créez votre compte avec votre numéro de téléphone et un code à 4 chiffres (pas de SMS).',
    sell2: 'Touchez « Ajouter une annonce » : catégorie, photos, prix. C’est prêt en 2 minutes.',
    sell3: 'Les acheteurs vous appellent ou vous écrivent directement sur WhatsApp.',
    buy: 'Acheter', buy1: 'Cherchez par mot, par catégorie, par ville… ou même avec une photo.',
    buy2: 'Enregistrez votre recherche : Bi3li vous signale les nouvelles annonces.',
    buy3: 'Contactez le vendeur directement : appel, WhatsApp ou messagerie Bi3li.',
    why: 'Pourquoi Bi3li ?', w1: '100 % gratuit pour publier et pour chercher', w2: 'En arabe et en français',
    w3: 'Toute la Mauritanie : Nouakchott, Nouadhibou, Rosso, Kiffa…', w4: 'Prix en anciennes et en nouvelles ouguiyas',
    w5: 'Boutiques et agences vérifiées', w6: 'Fonctionne même avec une connexion faible (mode économie)',
    safe: 'Conseils de sécurité', s1: 'Voyez l’article avant de payer.', s2: 'Rencontrez le vendeur dans un lieu public, de jour.',
    s3: 'N’envoyez jamais d’argent à l’avance.', s4: 'Une annonce vous semble suspecte ? Signalez-la avec le bouton « Signaler ».',
    ct: 'Nous contacter', ctTxt: 'Une question, un problème, une idée ? Écrivez-nous sur WhatsApp, nous répondons rapidement.',
    ctBtn: 'Nous écrire sur WhatsApp', ctMsg: 'Bonjour Bi3li, ',
  },
  ar: {
    t: 'عن بيعلي', hero: 'موقع الإعلانات المبوبة في موريتانيا: اشترِ وبِع بالقرب منك، مجاناً.',
    sell: 'البيع', sell1: 'أنشئ حسابك برقم هاتفك ورقم سري من 4 أرقام (بدون رسائل قصيرة).',
    sell2: 'اضغط «أضف إعلاناً»: الفئة، الصور، السعر. جاهز في دقيقتين.', sell3: 'المشترون يتصلون بك أو يراسلونك مباشرة على واتساب.',
    buy: 'الشراء', buy1: 'ابحث بكلمة، بالفئة، بالمدينة… أو حتى بصورة.', buy2: 'احفظ بحثك: بيعلي ينبهك بالإعلانات الجديدة.',
    buy3: 'تواصل مع البائع مباشرة: اتصال، واتساب أو رسائل بيعلي.',
    why: 'لماذا بيعلي؟', w1: 'مجاني 100% للنشر والبحث', w2: 'بالعربية والفرنسية',
    w3: 'كل موريتانيا: نواكشوط، نواذيبو، روصو، كيفة…', w4: 'الأسعار بالأوقية القديمة والجديدة',
    w5: 'متاجر ووكالات موثقة', w6: 'يعمل حتى مع اتصال ضعيف (وضع التوفير)',
    safe: 'نصائح الأمان', s1: 'شاهد المنتج قبل الدفع.', s2: 'التقِ بالبائع في مكان عام وفي النهار.',
    s3: 'لا ترسل المال مسبقاً أبداً.', s4: 'إعلان مشبوه؟ أبلغ عنه بزر «إبلاغ».',
    ct: 'اتصل بنا', ctTxt: 'سؤال، مشكلة، فكرة؟ راسلنا على واتساب، نرد بسرعة.',
    ctBtn: 'راسلنا على واتساب', ctMsg: 'السلام عليكم بيعلي، ',
  },
};

export default function About() {
  const { lang, rtl } = useLang();
  const a = AB[lang];
  const al = rtl ? { textAlign: 'right' } : null;
  const [support, setSupport] = useState('');
  useEffect(() => { api.config().then((c) => setSupport(String(c.support || '').replace(/\D/g, ''))).catch(() => {}); }, []);

  const box = (title, body) => (
    <View style={s.box}>
      <Text style={[s.h2, al]}>{title}</Text>
      {body}
    </View>
  );
  const steps = (keys) => keys.map((k, i) => (
    <View key={k} style={[s.row, rtl && { flexDirection: 'row-reverse' }]}>
      <Text style={s.num}>{i + 1}</Text>
      <Text style={[s.p, { flex: 1 }, al]}>{a[k]}</Text>
    </View>
  ));
  const list = (keys) => keys.map((k) => <Text key={k} style={[s.p, al]}>✓ {a[k]}</Text>);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: a.t }} />
      <View style={s.hero}>
        <Text style={s.brand}>{lang === 'ar' ? 'بيع' : 'Bi3'}<Text style={{ color: colors.primary }}>{lang === 'ar' ? 'لي' : 'li'}</Text></Text>
        <Text style={[s.p, { textAlign: 'center' }]}>{a.hero}</Text>
      </View>
      {box(a.sell, steps(['sell1', 'sell2', 'sell3']))}
      {box(a.buy, steps(['buy1', 'buy2', 'buy3']))}
      {box(a.why, list(['w1', 'w2', 'w3', 'w4', 'w5', 'w6']))}
      {box(a.safe, list(['s1', 's2', 's3', 's4']))}
      {box(a.ct, <>
        <Text style={[s.p, al]}>{a.ctTxt}</Text>
        {!!support && (
          <Pressable style={s.wa} onPress={() => Linking.openURL('https://wa.me/222' + support.slice(-8) + '?text=' + encodeURIComponent(a.ctMsg))}>
            <Text style={s.waTxt}>{a.ctBtn}</Text>
          </Pressable>
        )}
      </>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.white, borderRadius: radius.l, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: 'center', gap: 8 },
  brand: { fontSize: 30, fontWeight: '800', color: colors.text },
  box: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  h2: { fontSize: 18, fontWeight: '800', color: colors.text },
  p: { fontSize: 15, color: colors.text, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, backgroundColor: colors.primary, color: '#fff', fontWeight: '800', overflow: 'hidden' },
  wa: { backgroundColor: colors.whatsapp, borderRadius: radius.m, paddingVertical: 13, alignItems: 'center' },
  waTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
