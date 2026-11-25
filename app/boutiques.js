// Les boutiques : tous les vendeurs qui ont une boutique, avec recherche (comme le site).
// Regroupement fait à partir des annonces en ligne (même logique que le site : une boutique = un vendeur).
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { mediaUrl } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { cityName } from '../src/places';
import { norm } from '../src/search';
import { getAllAds } from '../src/store';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    title: 'Boutiques', search: 'Chercher une boutique', none: 'Aucune boutique pour le moment. Soyez le premier !',
    ctaT: 'Vous êtes commerçant ?', ctaP: 'Ouvrez votre boutique sur Bi3li : une page avec tous vos produits, le badge « Boutique vérifiée » et l’ajout de plusieurs produits d’un coup.',
    ctaB: 'Ouvrir ma boutique', myB: 'Ma boutique', n: '{n} produits', n1: '1 produit', verified: 'Boutique vérifiée ✓', agency: 'Agence immobilière',
  },
  ar: {
    title: 'المتاجر', search: 'ابحث عن متجر', none: 'لا توجد متاجر حالياً. كن الأول!',
    ctaT: 'أنت تاجر؟', ctaP: 'افتح متجرك على بيعلي: صفحة فيها كل منتجاتك، وشارة «متجر موثّق»، وإضافة عدة منتجات دفعة واحدة.',
    ctaB: 'افتح متجري', myB: 'متجري', n: '{n} منتجات', n1: 'منتج واحد', verified: 'متجر موثّق ✓', agency: 'وكالة عقارية',
  },
};

export default function Boutiques() {
  const { lang, rtl } = useLang();
  const { user } = useAuth();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const [all, setAll] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(() => { getAllAds().then(setAll).catch(() => setAll([])); }, []);
  useFocusEffect(load);

  const shops = useMemo(() => {
    const m = {};
    (all || []).forEach((a) => {
      if (!a.shop?.name || a.status === 'sold' || a.status === 'deleted') return;
      const k = a.owner || a.shop.name;
      const x = m[k] || (m[k] = { owner: a.owner || '', name: a.shop.name, market: a.shop.market || '', verified: !!a.shop.verified, agency: !!a.shop.agency, city: a.city, ads: [], t: 0 });
      x.ads.push(a);
      if (a.t > x.t) x.t = a.t;
    });
    return Object.values(m).sort((x, y) => y.t - x.t);
  }, [all]);

  const nq = norm(q);
  const list = shops.filter((x) => !nq || norm(x.name + ' ' + x.market + ' ' + (x.city || '')).indexOf(nq) > -1);
  const mine = user?.shop ? user : null;

  const Cta = () => (
    mine ? (
      <View style={[s.cta, { flexDirection: 'column' }]}>
        <Text style={[s.ctaName, al]}>{mine.shop.name}</Text>
        <Pressable style={s.btn} onPress={() => router.push('/vendeur/' + user.id)}>
          <Text style={s.btnTxt}>{t('myB')}</Text>
        </Pressable>
      </View>
    ) : (
      <View style={s.cta}>
        <Text style={[s.ctaT, al]}>{t('ctaT')}</Text>
        <Text style={[s.p, al]}>{t('ctaP')}</Text>
        <Pressable style={s.btn} onPress={() => router.push('/boutique')}>
          <Text style={s.btnTxt}>{t('ctaB')}</Text>
        </Pressable>
      </View>
    )
  );

  const Row = ({ x }) => {
    const photo = x.ads.find((a) => a.photos?.[0]);
    return (
      <Pressable style={[s.row, row]} onPress={() => router.push('/vendeur/' + x.owner)}>
        <View style={s.thumb}>
          {photo ? <Image source={mediaUrl(photo.photos[0])} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.thumbTxt}>{x.name.charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.name, al]} numberOfLines={1}>{x.name}</Text>
          {(x.verified || x.agency) && <Text style={[s.badge, al]}>{x.agency ? t('agency') + ' · ' : ''}{x.verified ? t('verified') : ''}</Text>}
          <Text style={[s.meta, al]} numberOfLines={1}>
            {x.ads.length === 1 ? t('n1') : t('n', { n: x.ads.length })}
            {x.market ? ' · ' + x.market : ''}{x.city ? ' · ' + cityName(x.city, lang) : ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t('title') }} />
      {all === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(x) => x.owner || x.name}
          renderItem={({ item }) => <Row x={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 12 }}>
              <Cta />
              {shops.length > 3 && (
                <TextInput value={q} onChangeText={setQ} placeholder={t('search')} placeholderTextColor={colors.muted} style={[s.input, al]} />
              )}
            </View>
          }
          ListEmptyComponent={<Text style={[s.empty]}>{t('none')}</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cta: { backgroundColor: colors.white, borderRadius: radius.l, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  ctaT: { fontSize: 17, fontWeight: '800', color: colors.text },
  ctaName: { fontSize: 17, fontWeight: '800', color: colors.text },
  p: { fontSize: 14, color: colors.text, lineHeight: 21 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  input: { backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, color: colors.text },
  row: { backgroundColor: colors.white, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  thumbTxt: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  badge: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 15 },
});
