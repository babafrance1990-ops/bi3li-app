// Choix de la ville : liste groupée par wilaya, avec recherche
import { useMemo, useState } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WILAYAS } from '../places';
import { useLang } from '../i18n';
import { colors, radius } from '../theme';

// onAll (facultatif) : ligne « Toutes les villes » en haut de la liste
export default function CityPicker({ visible, value, onPick, onClose, onAll }) {
  const { lang, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const sections = useMemo(() => {
    const s = q.trim().toLowerCase();
    return WILAYAS.map((w) => ({
      title: w[lang],
      data: w.cities.filter(([fr, ar]) => !s || fr.toLowerCase().includes(s) || ar.includes(s)),
    })).filter((x) => x.data.length);
  }, [q, lang]);

  const align = rtl ? { textAlign: 'right' } : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
        <View style={[s.top, rtl && { flexDirection: 'row-reverse' }]}>
          <TextInput style={[s.search, align]} value={q} onChangeText={setQ} placeholder={lang === 'ar' ? 'ابحث عن مدينة' : 'Chercher une ville'} />
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.close}>✕</Text></Pressable>
        </View>
        {onAll && (
          <Pressable style={s.row} onPress={() => { onAll(); setQ(''); }}>
            <Text style={[s.city, align, !value && { color: colors.primaryDark, fontWeight: '800' }]}>
              {!value ? '✓ ' : ''}{lang === 'ar' ? 'كل المدن' : 'Toutes les villes'}
            </Text>
          </Pressable>
        )}
        <SectionList
          sections={sections}
          keyExtractor={([fr]) => fr}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderSectionHeader={({ section }) => <Text style={[s.head, align]}>{section.title}</Text>}
          renderItem={({ item: [fr, ar] }) => (
            <Pressable style={s.row} onPress={() => { onPick(fr); setQ(''); }}>
              <Text style={[s.city, align, value === fr && { color: colors.primaryDark, fontWeight: '800' }]}>
                {value === fr ? '✓ ' : ''}{lang === 'ar' ? ar : fr}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  search: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 12, fontSize: 16, backgroundColor: colors.bg },
  close: { fontSize: 22, color: colors.muted, padding: 4 },
  head: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingVertical: 6, color: colors.muted, fontWeight: '700' },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
  city: { fontSize: 16, color: colors.text },
});
