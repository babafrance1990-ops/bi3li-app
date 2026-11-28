// Recherche : mots en français ou en arabe (avec équivalents), catégorie, filtres repliés derrière « تدقيق », tri.
// Les résultats s'affichent tout de suite ; les dernières recherches sont gardées sur le téléphone.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { sKey, takePendingSearch, toSaved, fromSaved } from '../../src/alerts';
import { useAuth } from '../../src/auth';
import AdCard from '../../src/components/AdCard';
import CategoryBar from '../../src/components/CategoryBar';
import FiltersSheet from '../../src/components/FiltersSheet';
import { useLang } from '../../src/i18n';
import { cityName } from '../../src/places';
import { countFilters, EMPTY_FILTERS, norm, search, suggest } from '../../src/search';
import { getAllAds } from '../../src/store';
import { colors, radius } from '../../src/theme';

const T = {
  fr: {
    ph: 'Que recherchez-vous ?', refine: 'Affiner', refineN: 'Affiner ({n})', results: '{n} annonce(s)', recent: 'Recherches récentes',
    clear: 'Effacer', none: 'Aucune annonce ne correspond.', noneTip: 'Essayez un autre mot, ou enlevez des filtres.', resetAll: 'Tout effacer',
    err: 'Connexion impossible.', retry: 'Réessayer', ideas: 'Idées', in: 'à',
    alert: '🔔 M’alerter des nouvelles annonces', alertOn: '✓ Alerte enregistrée — voir mes alertes', alertTip: 'Vous verrez les nouvelles annonces de cette recherche dans « Mes alertes ».',
  },
  ar: {
    ph: 'عمّ تبحث؟', refine: 'تدقيق', refineN: 'تدقيق ({n})', results: 'إعلانات: {n}', recent: 'عمليات البحث الأخيرة',
    clear: 'مسح', none: 'لا توجد إعلانات مطابقة.', noneTip: 'جرّب كلمة أخرى أو أزل بعض الفلاتر.', resetAll: 'مسح الكل',
    err: 'تعذّر الاتصال.', retry: 'إعادة المحاولة', ideas: 'أفكار', in: 'في',
    alert: '🔔 نبّهني بالإعلانات الجديدة', alertOn: '✓ تم حفظ التنبيه — عرض تنبيهاتي', alertTip: 'سترى الإعلانات الجديدة لهذا البحث في «تنبيهاتي».',
  },
};
const IDEAS = { fr: ['Hilux', 'iPhone', 'frigo', 'villa', 'climatiseur', 'mouton', 'terrain'], ar: ['هيلكس', 'ايفون', 'ثلاجة', 'فيلا', 'مكيف', 'خروف', 'قطعة أرضية'] };
const RECENT = 'bi3li_recent_q';

export default function Recherche() {
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const [ads, setAds] = useState(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState(''); // texte réellement cherché (petit délai pendant la frappe)
  const [cat, setCat] = useState(null);
  const [f, setF] = useState(EMPTY_FILTERS);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const timer = useRef(null);
  const { user, saveSearches } = useAuth();

  // Recherche demandée depuis « Mes alertes »
  useFocusEffect(useCallback(() => {
    const p = takePendingSearch();
    if (!p) return;
    const x = fromSaved(p);
    setQ(x.q); setQuery(x.q); setCat(x.cat); setF(x.f);
  }, []));

  async function load(force) {
    setError(false);
    try { setAds(await getAllAds({ force })); } catch { setError(true); } finally { setRefreshing(false); }
  }
  useEffect(() => {
    load(false);
    AsyncStorage.getItem(RECENT).then((v) => setRecent(JSON.parse(v || '[]'))).catch(() => {});
  }, []);

  // Ouverte depuis la barre de l'accueil : le clavier s'ouvre tout de suite (pas quand on touche l'onglet)
  const { focus } = useLocalSearchParams();
  const inputRef = useRef(null);
  useEffect(() => {
    if (!focus) return;
    const id = setTimeout(() => { inputRef.current?.focus(); router.setParams({ focus: undefined }); }, 350);
    return () => clearTimeout(id);
  }, [focus]);

  function type(v) {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setQuery(v), 250);
  }
  function remember(v) {
    v = (v || '').trim();
    if (v.length < 2) return;
    const list = [v, ...recent.filter((x) => norm(x) !== norm(v))].slice(0, 6);
    setRecent(list);
    AsyncStorage.setItem(RECENT, JSON.stringify(list)).catch(() => {});
  }
  function pick(v) { setQ(v); setQuery(v); remember(v); Keyboard.dismiss(); }

  const results = useMemo(() => (ads ? search(ads, { q: query, cat, f }) : []), [ads, query, cat, f]);
  const sugg = useMemo(() => suggest(ads, q), [ads, q]);
  const nf = countFilters(f);
  const current = toSaved({ q: query, cat, f });
  const alertSaved = (user?.searches || []).some((x) => sKey(x) === sKey(current));
  function saveAlert() {
    if (!user) { router.push('/connexion'); return; }
    if (alertSaved) { router.push('/alertes'); return; }
    const k = sKey(current);
    saveSearches([current, ...(user.searches || []).filter((x) => sKey(x) !== k)].slice(0, 50));
  }
  const searching = !!(query.trim() || cat || nf);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  // Résumé des filtres actifs, ex. « Nouakchott · Tevragh Zeina »
  const summary = [f.city && cityName(f.city, lang), f.city === 'Nouakchott' && f.hood && !f.hood.startsWith('w:') && f.hood].filter(Boolean).join(' · ');

  const header = (
    <View>
      <CategoryBar value={cat} onChange={setCat} />
      {searching ? (
        <Pressable style={[s.alertBtn, alertSaved && s.alertOn]} onPress={saveAlert}>
          <Text style={[s.alertTxt, alertSaved && { color: '#fff' }]}>{alertSaved ? t('alertOn') : t('alert')}</Text>
        </Pressable>
      ) : null}
      {searching ? (
        <View style={[s.resRow, row]}>
          <Text style={s.resTxt}>{t('results', { n: results.length })}{summary ? '  ·  📍 ' + summary : ''}</Text>
          {(nf > 0 || cat || query) && (
            <Pressable onPress={() => { setF(EMPTY_FILTERS); setCat(null); setQ(''); setQuery(''); }}>
              <Text style={s.link}>{t('resetAll')}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={s.idle}>
          {recent.length > 0 && (
            <>
              <View style={[row, { justifyContent: 'space-between' }]}>
                <Text style={[s.h, al]}>🕘 {t('recent')}</Text>
                <Pressable onPress={() => { setRecent([]); AsyncStorage.removeItem(RECENT); }}><Text style={s.link}>{t('clear')}</Text></Pressable>
              </View>
              <View style={[s.chips, row]}>
                {recent.map((r) => <Pressable key={r} style={s.chip} onPress={() => pick(r)}><Text style={s.chipTxt}>{r}</Text></Pressable>)}
              </View>
            </>
          )}
          <Text style={[s.h, al]}>💡 {t('ideas')}</Text>
          <View style={[s.chips, row]}>
            {IDEAS[lang].map((r) => <Pressable key={r} style={s.chip} onPress={() => pick(r)}><Text style={s.chipTxt}>{r}</Text></Pressable>)}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Barre de recherche + bouton « Affiner » */}
      <View style={[s.bar, row]}>
        <View style={[s.box, row]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput ref={inputRef} style={[s.input, al]} value={q} onChangeText={type} placeholder={t('ph')} placeholderTextColor={colors.muted}
            returnKeyType="search" onSubmitEditing={() => { setQuery(q); remember(q); }} autoCorrect={false} />
          {!!q && <Pressable hitSlop={10} onPress={() => { setQ(''); setQuery(''); }}><Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text></Pressable>}
        </View>
        <Pressable style={[s.refine, nf > 0 && { backgroundColor: colors.primary }]} onPress={() => { Keyboard.dismiss(); setOpen(true); }}>
          <Text style={[s.refineTxt, nf > 0 && { color: '#fff' }]}>⚙︎ {nf ? t('refineN', { n: nf }) : t('refine')}</Text>
        </Pressable>
      </View>

      {sugg.length > 0 && (
        <View style={[s.chips, row, { paddingHorizontal: 12, paddingTop: 8 }]}>
          {sugg.map((x) => <Pressable key={x.value} style={s.chip} onPress={() => pick(x.value)}><Text style={s.chipTxt}>{x.label}</Text></Pressable>)}
        </View>
      )}

      {!ads && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error && !ads ? (
        <View style={s.center}>
          <Text style={s.muted}>{t('err')}</Text>
          <Pressable style={s.btn} onPress={() => load(true)}><Text style={s.btnTxt}>{t('retry')}</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={searching ? results : []}
          numColumns={2}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AdCard ad={item} />}
          contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          ListHeaderComponent={header}
          initialNumToRender={10}
          windowSize={7}
          refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListEmptyComponent={searching ? (
            <View style={s.center}>
              <Text style={{ fontSize: 40 }}>🔎</Text>
              <Text style={s.emptyT}>{t('none')}</Text>
              <Text style={s.muted}>{t('noneTip')}</Text>
            </View>
          ) : null}
        />
      )}

      <FiltersSheet visible={open} value={f} cat={cat} count={results.length} onChange={setF} onClose={() => setOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { gap: 8, padding: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
  box: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.l, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 11, color: colors.text, outlineStyle: 'none' },
  refine: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: radius.l, borderWidth: 1, borderColor: colors.primary },
  refineTxt: { color: colors.primaryDark, fontWeight: '700' },
  alertBtn: { marginHorizontal: 10, marginBottom: 8, paddingVertical: 11, borderRadius: radius.m, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#EEF5F0', alignItems: 'center' },
  alertOn: { backgroundColor: colors.primary },
  alertTxt: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
  resRow: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 6 },
  resTxt: { color: colors.muted, fontWeight: '600', flexShrink: 1 },
  link: { color: colors.primaryDark, fontWeight: '700' },
  idle: { paddingHorizontal: 10, gap: 10 },
  h: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  chips: { flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipTxt: { fontSize: 14, color: colors.text, fontWeight: '600' },
  center: { alignItems: 'center', padding: 30, gap: 10 },
  emptyT: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, textAlign: 'center' },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
