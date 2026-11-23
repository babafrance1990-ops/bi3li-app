// Rangée de catégories qui défile (comme sur l'accueil du site)
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { CATEGORIES } from '../categories';
import { useLang } from '../i18n';
import { colors } from '../theme';

export default function CategoryBar({ value, onChange }) {
  const { lang, t, rtl } = useLang();
  const items = [{ id: null, fr: t('all'), ar: t('all'), icon: '🗂️', c: colors.primary }, ...CATEGORIES];

  return (
    <FlatList
      horizontal
      inverted={rtl}
      data={items}
      keyExtractor={(c) => String(c.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 10 }}
      renderItem={({ item }) => {
        const on = value === item.id;
        return (
          <Pressable onPress={() => onChange(item.id)} style={[s.chip, on && { backgroundColor: item.c, borderColor: item.c }]}>
            <Text style={s.icon}>{item.icon}</Text>
            <Text style={[s.label, on && { color: '#fff' }]}>{item[lang]}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  icon: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
});
