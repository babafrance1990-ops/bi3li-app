// Mes alertes : recherches enregistrées (« 🔔 نبّهني »), avec le nombre de nouvelles annonces depuis la dernière visite.
// Toucher une alerte = voir ses annonces dans « Recherche » (et le compteur repart de zéro).
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { newFor, setPendingSearch, sKey } from '../src/alerts';
import { useAuth } from '../src/auth';
import { catById } from '../src/categories';
import { useLang } from '../src/i18n';
import { notify } from '../src/notify';
import { cityName, NKC } from '../src/places';
import { getAllAds } from '../src/store';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    title: 'Mes alertes', empty: 'Aucune alerte pour l’instant.', emptyTip: 'Faites une recherche, puis touchez « 🔔 M’alerter des nouvelles annonces ».',
    go: 'Faire une recherche', all: 'Toutes les annonces', allMr: 'Toute la Mauritanie', newN: '{n} nouvelle(s)', none: 'Rien de nouveau',
    on: 'Alerte activée', off: 'Alerte coupée', del: 'Supprimer', cancel: 'Annuler', confirmDel: 'Supprimer cette alerte ?',
    rent: 'Location', buy: 'Vente', from: 'dès', to: 'jusqu’à', pro: 'Commerçants', part: 'Particuliers',
    tip: 'Les alertes sont aussi visibles sur le site bi3li.net, dans le même compte.',
  },
  ar: {
    title: 'تنبيهاتي', empty: 'لا توجد تنبيهات بعد.', emptyTip: 'ابحث عن شيء ثم اضغط «🔔 نبّهني بالإعلانات الجديدة».',
    go: 'ابحث الآن', all: 'كل الإعلانات', allMr: 'كل موريتانيا', newN: 'جديد: {n}', none: 'لا جديد',
    on: 'التنبيه مفعّل', off: 'التنبيه متوقف', del: 'حذف', cancel: 'إلغاء', confirmDel: 'حذف هذا التنبيه؟',
    rent: 'إيجار', buy: 'بيع', from: 'من', to: 'إلى', pro: 'التجار', part: 'الأفراد',
    tip: 'تظهر التنبيهات أيضاً على موقع bi3li.net في نفس الحساب.',
  },
};
const KIND_L = {
  apt: ['Appartement', 'شقة'], house: ['Maison', 'منزل'], villa: ['Villa', 'فيلا'], duplex: ['Duplex', 'دوبلكس'],
  room: ['Chambre', 'غرفة'], shop: ['Boutique', 'محل'], office: ['Bureau', 'مكتب'], warehouse: ['Entrepôt', 'مستودع'],
  land: ['Terrain', 'قطعة أرضية'], building: ['Immeuble', 'عمارة'], farm: ['Ferme', 'مزرعة'],
};

export default function Alertes() {
  const { user, saveSearches } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const L = lang === 'ar' ? 1 : 0;
  const [ads, setAds] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  const load = useCallback((force) => getAllAds({ force }).then(setAds).catch(() => setAds((a) => a || [])).finally(() => setRefreshing(false)), []);
  useFocusEffect(useCallback(() => { load(false); }, [load]));

  const list = (user?.searches || []).map((s) => ({ s, n: ads ? newFor(ads, s, user.id) : 0 }))
    .sort((x, y) => y.n - x.n || (y.s.t || 0) - (x.s.t || 0));

  const hoodLabel = (h) => (h?.startsWith('w:') ? NKC.find((g) => g.id === h.slice(2))?.[lang] : h);
  function details(s) {
    const p = [];
    if (s.f?.mode) p.push(t(s.f.mode === 'rent' ? 'rent' : 'buy'));
    if (s.f?.kind && KIND_L[s.f.kind]) p.push(KIND_L[s.f.kind][L]);
    if (s.pmin) p.push(t('from') + ' ' + (+s.pmin).toLocaleString('fr-FR'));
    if (s.pmax) p.push(t('to') + ' ' + (+s.pmax).toLocaleString('fr-FR'));
    if (s.seller) p.push(t(s.seller));
    return p.join(' · ');
  }

  function open(s) {
    // la recherche s'ouvre dans l'onglet Recherche ; les annonces sont maintenant « vues »
    setPendingSearch(s);
    const k = sKey(s);
    saveSearches(user.searches.map((x) => (sKey(x) === k ? { ...x, seen: Date.now() } : x)));
    router.navigate('/recherche');
  }
  const toggle = (s) => { const k = sKey(s); saveSearches(user.searches.map((x) => (sKey(x) === k ? { ...x, alert: x.alert === false } : x))); };
  const remove = (s) => notify(t('confirmDel'), [{ text: t('cancel'), style: 'cancel' }, {
    text: t('del'), style: 'destructive', onPress: () => { const k = sKey(s); saveSearches(user.searches.filter((x) => sKey(x) !== k)); },
  }]);

  if (!user) return null;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('title') }} />
      {!ads ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={list}
          keyExtractor={(x) => sKey(x.s)}
          contentContainerStyle={{ padding: 10, gap: 10, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListFooterComponent={list.length ? <Text style={[s.tip]}>{t('tip')}</Text> : null}
          ListEmptyComponent={(
            <View style={s.center}>
              <Text style={{ fontSize: 44 }}>🔔</Text>
              <Text style={s.emptyT}>{t('empty')}</Text>
              <Text style={s.muted}>{t('emptyTip')}</Text>
              <Pressable style={s.main} onPress={() => router.navigate('/recherche')}><Text style={s.mainTxt}>🔍 {t('go')}</Text></Pressable>
            </View>
          )}
          renderItem={({ item: { s: x, n } }) => {
            const c = catById(x.cat);
            const on = x.alert !== false;
            const d = details(x);
            return (
              <View style={[s.card, row]}>
                <Pressable onPress={() => toggle(x)} hitSlop={8} style={[s.bell, on && s.bellOn]}>
                  <Text style={{ fontSize: 20, opacity: on ? 1 : 0.4 }}>{on ? '🔔' : '🔕'}</Text>
                </Pressable>
                <Pressable style={{ flex: 1, gap: 3 }} onPress={() => open(x)}>
                  {c && <Text style={[s.cat, al, { color: c.c }]}>{c.icon} {c[lang]}</Text>}
                  <Text style={[s.title, al]} numberOfLines={1}>{x.q ? '« ' + x.q + ' »' : c ? c[lang] : t('all')}</Text>
                  {!!d && <Text style={[s.muted, al]} numberOfLines={1}>{d}</Text>}
                  <Text style={[s.muted, al]} numberOfLines={1}>📍 {[hoodLabel(x.hood), x.city ? cityName(x.city, lang) : t('allMr')].filter(Boolean).join(' · ')}</Text>
                  <Text style={[s.status, al, { color: on ? colors.primaryDark : colors.muted }]}>
                    {!on ? t('off') : n ? '🆕 ' + t('newN', { n: n > 50 ? '50+' : n }) : t('none')}
                  </Text>
                </Pressable>
                <View style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {on && n > 0 ? <View style={s.badge}><Text style={s.badgeTxt}>{n > 50 ? '50+' : n}</Text></View> : <View />}
                  <Pressable onPress={() => remove(x)} hitSlop={8}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.m, padding: 12, gap: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  bellOn: { backgroundColor: '#dcfce7' },
  cat: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  status: { fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.muted },
  badge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeTxt: { color: '#fff', fontWeight: '800' },
  tip: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 6 },
  center: { alignItems: 'center', padding: 30, gap: 12, marginTop: 30 },
  emptyT: { fontSize: 17, fontWeight: '700', color: colors.text },
  main: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 13, paddingHorizontal: 20 },
  mainTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
