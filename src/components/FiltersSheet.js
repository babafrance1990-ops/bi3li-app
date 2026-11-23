// Panneau « تدقيق / Affiner » : lieu, prix, date, options, filtres de la catégorie, tri
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CityPicker from './CityPicker';
import { useLang } from '../i18n';
import { cityName, NKC } from '../places';
import { countFilters, EMPTY_FILTERS } from '../search';
import { colors, radius } from '../theme';

const T = {
  fr: {
    title: 'Affiner', reset: 'Effacer', show: 'Voir {n} annonce(s)', place: 'Lieu', all: 'Toute la Mauritanie', allNkc: 'Tout Nouakchott',
    allW: 'Tout {w}', price: 'Prix (MRU)', min: 'Minimum', max: 'Maximum', date: 'Date', d_: 'Toutes', d_today: 'Aujourd’hui',
    d_7d: '7 jours', d_30d: '30 jours', opts: 'Options', photo: 'Avec photo', nego: 'Prix à discuter', deliv: 'Livraison possible',
    seller: 'Vendeur', s_: 'Tous', s_part: 'Particuliers', s_pro: 'Commerçants', sort: 'Trier', so_new: 'Plus récentes',
    so_pa: 'Prix croissant', so_pd: 'Prix décroissant', deal: 'Vente ou location', sale: 'Vente', rent: 'Location', kind: 'Type de bien',
    brand: 'Marque (ex. Toyota)', yearMin: 'Année minimum',
  },
  ar: {
    title: 'تدقيق', reset: 'مسح', show: 'عرض الإعلانات ({n})', place: 'المكان', all: 'كل موريتانيا', allNkc: 'كل نواكشوط',
    allW: 'كل {w}', price: 'السعر (أوقية جديدة)', min: 'من', max: 'إلى', date: 'التاريخ', d_: 'الكل', d_today: 'اليوم',
    d_7d: '7 أيام', d_30d: '30 يوماً', opts: 'خيارات', photo: 'مع صور', nego: 'السعر قابل للنقاش', deliv: 'التوصيل ممكن',
    seller: 'البائع', s_: 'الكل', s_part: 'الأفراد', s_pro: 'التجار', sort: 'الترتيب', so_new: 'الأحدث',
    so_pa: 'السعر تصاعدياً', so_pd: 'السعر تنازلياً', deal: 'بيع أم إيجار', sale: 'بيع', rent: 'إيجار', kind: 'نوع العقار',
    brand: 'الماركة (مثلاً تويوتا)', yearMin: 'أقل سنة',
  },
};
const KINDS = ['apt', 'house', 'villa', 'duplex', 'land', 'room', 'shop', 'office', 'warehouse', 'building', 'farm'];
const KIND_L = {
  apt: ['Appartement', 'شقة'], house: ['Maison', 'منزل'], villa: ['Villa', 'فيلا'], duplex: ['Duplex', 'دوبلكس'],
  room: ['Chambre', 'غرفة'], shop: ['Boutique', 'محل'], office: ['Bureau', 'مكتب'], warehouse: ['Entrepôt', 'مستودع'],
  land: ['Terrain', 'قطعة أرضية'], building: ['Immeuble', 'عمارة'], farm: ['Ferme', 'مزرعة'],
};
const digits = (v) => String(v || '').replace(/\D/g, '');

const Chip = ({ on, label, onPress }) => (
  <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
    <Text style={[s.chipTxt, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

export default function FiltersSheet({ visible, value, cat, count, onChange, onClose }) {
  const { lang, rtl } = useLang();
  const t = (k, v = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace('{' + a + '}', b), T[lang][k] ?? k);
  const insets = useSafeAreaInsets();
  const [cityOpen, setCityOpen] = useState(false);
  const f = value;
  const set = (patch) => onChange({ ...f, ...patch });
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const L = lang === 'ar' ? 1 : 0;

  const H = ({ children }) => <Text style={[s.h, al]}>{children}</Text>;
  const Opt = ({ k, label }) => (
    <View style={[s.opt, row]}>
      <Text style={[s.optTxt, al]}>{label}</Text>
      <Switch value={!!f[k]} onValueChange={(v) => set({ [k]: v })} trackColor={{ true: colors.primary }} />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.wrap, { paddingTop: insets.top }]}>
        <View style={[s.top, row]}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.close}>✕</Text></Pressable>
          <Text style={s.title}>{t('title')}{countFilters(f) ? ' (' + countFilters(f) + ')' : ''}</Text>
          <Pressable onPress={() => onChange({ ...EMPTY_FILTERS, sort: f.sort })} hitSlop={10}><Text style={s.reset}>{t('reset')}</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <H>{t('place')}</H>
          <Pressable style={[s.input, row, { justifyContent: 'space-between' }]} onPress={() => setCityOpen(true)}>
            <Text style={s.inputTxt}>📍 {f.city ? cityName(f.city, lang) : t('all')}</Text>
            {f.city ? <Pressable hitSlop={10} onPress={() => set({ city: '', hood: '' })}><Text style={s.muted}>✕</Text></Pressable> : <Text style={s.muted}>▾</Text>}
          </Pressable>
          {f.city === 'Nouakchott' && (
            <View style={{ gap: 6 }}>
              <View style={[s.chips, row]}><Chip on={!f.hood} label={t('allNkc')} onPress={() => set({ hood: '' })} /></View>
              {NKC.map((g) => (
                <View key={g.id} style={[s.chips, row]}>
                  <Chip on={f.hood === 'w:' + g.id} label={t('allW', { w: g[lang] })} onPress={() => set({ hood: 'w:' + g.id })} />
                  {g.h.map((h) => <Chip key={h} on={f.hood === h} label={h} onPress={() => set({ hood: f.hood === h ? '' : h })} />)}
                </View>
              ))}
            </View>
          )}

          {cat === 'immo' && (
            <>
              <H>{t('deal')}</H>
              <View style={[s.chips, row]}>
                {['', 'sale', 'rent'].map((d) => <Chip key={d} on={f.deal === d} label={d ? t(d) : t('s_')} onPress={() => set({ deal: d })} />)}
              </View>
              <H>{t('kind')}</H>
              <View style={[s.chips, row]}>
                <Chip on={!f.kind} label={t('s_')} onPress={() => set({ kind: '' })} />
                {KINDS.map((k) => <Chip key={k} on={f.kind === k} label={KIND_L[k][L]} onPress={() => set({ kind: f.kind === k ? '' : k })} />)}
              </View>
            </>
          )}
          {cat === 'auto' && (
            <View style={[row, { gap: 8, marginTop: 8 }]}>
              <TextInput style={[s.input, s.inputTxt, al, { flex: 2 }]} value={f.brand} onChangeText={(v) => set({ brand: v })} placeholder={t('brand')} placeholderTextColor={colors.muted} />
              <TextInput style={[s.input, s.inputTxt, al, { flex: 1 }]} value={f.yearMin} onChangeText={(v) => set({ yearMin: digits(v).slice(0, 4) })} placeholder={t('yearMin')} keyboardType="number-pad" placeholderTextColor={colors.muted} />
            </View>
          )}

          <H>{t('price')}</H>
          <View style={[row, { gap: 8 }]}>
            <TextInput style={[s.input, s.inputTxt, al, { flex: 1 }]} value={f.pmin} onChangeText={(v) => set({ pmin: digits(v) })} placeholder={t('min')} keyboardType="number-pad" placeholderTextColor={colors.muted} />
            <TextInput style={[s.input, s.inputTxt, al, { flex: 1 }]} value={f.pmax} onChangeText={(v) => set({ pmax: digits(v) })} placeholder={t('max')} keyboardType="number-pad" placeholderTextColor={colors.muted} />
          </View>

          <H>{t('date')}</H>
          <View style={[s.chips, row]}>
            {['', 'today', '7d', '30d'].map((d) => <Chip key={d} on={f.date === d} label={t('d_' + d)} onPress={() => set({ date: d })} />)}
          </View>

          <H>{t('seller')}</H>
          <View style={[s.chips, row]}>
            {['', 'part', 'pro'].map((d) => <Chip key={d} on={f.seller === d} label={t('s_' + d)} onPress={() => set({ seller: d })} />)}
          </View>

          <H>{t('opts')}</H>
          <Opt k="photo" label={'📷 ' + t('photo')} />
          <Opt k="nego" label={'🤝 ' + t('nego')} />
          <Opt k="deliv" label={'🚚 ' + t('deliv')} />

          <H>{t('sort')}</H>
          <View style={[s.chips, row]}>
            {['new', 'pa', 'pd'].map((d) => <Chip key={d} on={f.sort === d} label={t('so_' + d)} onPress={() => set({ sort: d })} />)}
          </View>
        </ScrollView>

        <View style={[s.foot, { paddingBottom: 12 + insets.bottom }]}>
          <Pressable style={s.btn} onPress={onClose}><Text style={s.btnTxt}>{t('show', { n: count })}</Text></Pressable>
        </View>
      </View>
      <CityPicker visible={cityOpen} value={f.city} onClose={() => setCityOpen(false)}
        onPick={(c) => { set({ city: c, hood: c === f.city ? f.hood : '' }); setCityOpen(false); }} />
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white },
  top: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  close: { fontSize: 22, color: colors.muted },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  reset: { color: colors.primaryDark, fontWeight: '700' },
  body: { padding: 16, gap: 8, paddingBottom: 30 },
  h: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 12, backgroundColor: colors.bg, alignItems: 'center' },
  inputTxt: { fontSize: 16, color: colors.text },
  muted: { color: colors.muted },
  chips: { flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { fontSize: 14, fontWeight: '600', color: colors.text },
  opt: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  optTxt: { fontSize: 15, color: colors.text, flex: 1 },
  foot: { padding: 12, borderTopWidth: 1, borderColor: colors.border },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
