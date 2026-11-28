// Mes favoris ♥ : annonces gardées de côté (même liste que sur le site)
// Les annonces retirées par le vendeur restent visibles, marquées « Plus disponible » (copie gardée sur le téléphone)
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/auth';
import AdCard from '../src/components/AdCard';
import { useLang } from '../src/i18n';
import { getAllAds } from '../src/store';
import { colors, radius } from '../src/theme';

const SNAP_KEY = 'favSnap';

const T = {
  fr: { title: 'Mes favoris', empty: 'Aucun favori pour l’instant.', tip: 'Touchez ♡ sur une annonce pour la garder ici.', go: 'Voir les annonces', unavail: 'Plus disponible', gone: '{n} annonce(s) retirée(s) par le vendeur', seen: '👁 Voir les annonces vues récemment' },
  ar: { title: 'المفضلة', empty: 'لا توجد إعلانات مفضلة بعد.', tip: 'اضغط ♡ على أي إعلان لحفظه هنا.', go: 'تصفح الإعلانات', unavail: 'غير متوفر', gone: 'إعلانات حذفها البائع: {n}', seen: '👁 الإعلانات التي شاهدتها مؤخرا' },
};

export default function Favoris({ embedded = false } = {}) {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const [ads, setAds] = useState(null);
  const [snaps, setSnaps] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((force) => getAllAds({ force }).then(setAds).catch(() => setAds((a) => a || [])).finally(() => setRefreshing(false)), []);
  useFocusEffect(useCallback(() => { load(false); }, [load]));
  useEffect(() => { AsyncStorage.getItem(SNAP_KEY).then((r) => setSnaps(JSON.parse(r || '{}'))).catch(() => {}); }, []);

  const favs = user?.favs || [];
  const byId = new Map((ads || []).map((a) => [a.id, a]));
  const list = favs.map((id) => byId.get(id)).filter(Boolean); // ordre : le dernier ajouté en premier

  // Garde une copie des annonces favorites présentes, pour les montrer « Plus disponible » après retrait
  useEffect(() => {
    if (!ads) return;
    const next = { ...snaps };
    let changed = false;
    favs.forEach((id) => { const a = byId.get(id); if (a) { next[id] = a; changed = true; } });
    if (!changed) return;
    setSnaps(next);
    AsyncStorage.setItem(SNAP_KEY, JSON.stringify(next)).catch(() => {});
  }, [ads, user?.favs]); // eslint-disable-line react-hooks/exhaustive-deps

  const goneItems = favs.filter((id) => !byId.get(id) && snaps[id]).map((id) => ({ ...snaps[id], unavailable: true }));
  const gone = ads ? favs.length - list.length - goneItems.length : 0; // retirées sans copie gardée
  const data = [...list, ...goneItems];

  return (
    <View style={{ flex: 1 }}>
      {!embedded && <Stack.Screen options={{ title: t('title') + (favs.length ? ' (' + list.length + ')' : '') }} />}
      {!ads ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => item.unavailable ? (
            <View style={{ flex: 1 }}>
              <View style={{ opacity: 0.55 }}><AdCard ad={item} /></View>
              <View style={s.unavail}><Text style={s.unavailTxt}>{t('unavail')}</Text></View>
            </View>
          ) : <AdCard ad={item} />}
          contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListHeaderComponent={(
            <View>
              <Pressable onPress={() => router.push('/vus')} style={s.seen}><Text style={s.seenTxt}>{t('seen')}</Text></Pressable>
              {gone > 0 ? <Text style={s.gone}>{t('gone', { n: gone })}</Text> : null}
            </View>
          )}
          ListEmptyComponent={(
            <View style={s.center}>
              <Text style={{ fontSize: 44, color: '#e11d48' }}>♡</Text>
              <Text style={s.emptyT}>{t('empty')}</Text>
              <Text style={s.muted}>{t('tip')}</Text>
              <Pressable style={s.main} onPress={() => router.navigate('/')}><Text style={s.mainTxt}>{t('go')}</Text></Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  seen: { alignSelf: 'center', margin: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.m, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  seenTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  gone: { color: colors.muted, fontSize: 12, textAlign: 'center', padding: 6 },
  unavail: { position: 'absolute', top: 8, left: 8, right: 8, backgroundColor: colors.danger, borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  unavailTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  center: { alignItems: 'center', padding: 30, gap: 12, marginTop: 30 },
  emptyT: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, textAlign: 'center' },
  main: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 13, paddingHorizontal: 20 },
  mainTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
