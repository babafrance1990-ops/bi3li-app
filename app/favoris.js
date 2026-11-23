// Mes favoris ♥ : annonces gardées de côté (même liste que sur le site)
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/auth';
import AdCard from '../src/components/AdCard';
import { useLang } from '../src/i18n';
import { getAllAds } from '../src/store';
import { colors, radius } from '../src/theme';

const T = {
  fr: { title: 'Mes favoris', empty: 'Aucun favori pour l’instant.', tip: 'Touchez ♡ sur une annonce pour la garder ici.', go: 'Voir les annonces', gone: '{n} annonce(s) supprimée(s) par le vendeur retirée(s).' },
  ar: { title: 'المفضلة', empty: 'لا توجد إعلانات مفضلة بعد.', tip: 'اضغط ♡ على أي إعلان لحفظه هنا.', go: 'تصفح الإعلانات', gone: 'إعلانات حذفها البائع: {n}' },
};

export default function Favoris() {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const [ads, setAds] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((force) => getAllAds({ force }).then(setAds).catch(() => setAds((a) => a || [])).finally(() => setRefreshing(false)), []);
  useFocusEffect(useCallback(() => { load(false); }, [load]));

  const favs = user?.favs || [];
  const byId = new Map((ads || []).map((a) => [a.id, a]));
  const list = favs.map((id) => byId.get(id)).filter(Boolean); // ordre : le dernier ajouté en premier
  const gone = ads ? favs.length - list.length : 0;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('title') + (favs.length ? ' (' + list.length + ')' : '') }} />
      {!ads ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={list}
          numColumns={2}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AdCard ad={item} />}
          contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListHeaderComponent={gone > 0 ? <Text style={s.gone}>{t('gone', { n: gone })}</Text> : null}
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
  gone: { color: colors.muted, fontSize: 12, textAlign: 'center', padding: 6 },
  center: { alignItems: 'center', padding: 30, gap: 12, marginTop: 30 },
  emptyT: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, textAlign: 'center' },
  main: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 13, paddingHorizontal: 20 },
  mainTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
