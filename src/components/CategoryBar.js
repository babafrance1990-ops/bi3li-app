// Rangée de catégories qui défile (comme sur l'accueil du site).
// grid : deux lignes qui défilent horizontalement + bouton « Toutes les catégories » (accueil).
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../categories';
import { useLang } from '../i18n';
import { colors } from '../theme';

export default function CategoryBar({ value, onChange, grid = false }) {
  const { lang, t, rtl } = useLang();
  const [all, setAll] = useState(false);
  // Position de défilement de la grille, pour la barre qui montre qu'il y a d'autres catégories
  const [bar, setBar] = useState({ view: 0, content: 0, x: 0, track: 0 });
  const thumbW = bar.content > 0 ? Math.max(30, bar.track * Math.min(1, bar.view / bar.content)) : 0;
  const room = Math.max(1, bar.track - thumbW);
  const max = Math.max(1, bar.content - bar.view);
  const prog = Math.min(1, Math.max(0, bar.x / max));
  // Liste inversée en arabe : on part de la droite
  const thumbLeft = rtl ? (1 - prog) * room : prog * room;
  const items = [{ id: null, fr: t('all'), ar: t('all'), icon: '🗂️', c: colors.primary }, ...CATEGORIES];

  const pick = (id) => { onChange(id); setAll(false); };
  const chip = (item, extra) => {
    const on = value === item.id;
    return (
      <Pressable key={String(item.id)} onPress={() => pick(item.id)} style={[s.chip, extra, on && { backgroundColor: item.c, borderColor: item.c }]}>
        <Text style={s.icon}>{item.icon}</Text>
        <Text style={[s.label, on && { color: '#fff' }]} numberOfLines={1}>{item[lang]}</Text>
      </Pressable>
    );
  };

  if (!grid) {
    return (
      <FlatList
        horizontal
        inverted={rtl}
        data={items}
        keyExtractor={(c) => String(c.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 10 }}
        renderItem={({ item }) => chip(item, { marginHorizontal: 4 })}
      />
    );
  }

  // Deux catégories par colonne : la grille défile horizontalement, ligne 1 et ligne 2
  const columns = [];
  for (let i = 0; i < items.length; i += 2) columns.push(items.slice(i, i + 2));

  return (
    <View style={s.frame}>
      <FlatList
        horizontal
        inverted={rtl}
        data={columns}
        keyExtractor={(col) => String(col[0].id)}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => setBar((b) => ({ ...b, x: e.nativeEvent.contentOffset.x }))}
        scrollEventThrottle={16}
        onLayout={(e) => setBar((b) => ({ ...b, view: e.nativeEvent.layout.width }))}
        onContentSizeChange={(w) => setBar((b) => ({ ...b, content: w }))}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6 }}
        renderItem={({ item: col }) => (
          <View style={s.column}>
            {col.map((c) => chip(c, { marginVertical: 3 }))}
          </View>
        )}
        ListFooterComponent={
          <Pressable onPress={() => setAll(true)} style={s.more}>
            <Text style={s.moreTxt}>{lang === 'ar' ? 'كل الفئات' : 'Toutes les catégories'}</Text>
            <Text style={s.moreArrow}>›</Text>
          </Pressable>
        }
      />

      {/* Barre sous la grille : la partie claire montre ce qui est visible, le reste se trouve en glissant */}
      <View style={s.track} onLayout={(e) => setBar((b) => ({ ...b, track: e.nativeEvent.layout.width }))}>
        {bar.content > bar.view && bar.track > 0 && (
          <View style={[s.thumb, { width: thumbW, left: thumbLeft }]} />
        )}
      </View>

      <Modal visible={all} animationType="slide" transparent onRequestClose={() => setAll(false)}>
        <Pressable style={s.backdrop} onPress={() => setAll(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{lang === 'ar' ? 'كل الفئات' : 'Toutes les catégories'}</Text>
            <Pressable onPress={() => setAll(false)} hitSlop={10}><Text style={s.close}>✕</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={s.wrap}>
            {items.map((c) => {
              const on = value === c.id;
              return (
                <Pressable key={String(c.id)} onPress={() => pick(c.id)} style={[s.tile, on && { backgroundColor: c.c, borderColor: c.c }]}>
                  <Text style={s.icon}>{c.icon}</Text>
                  <Text style={[s.tileTxt, on && { color: '#fff' }]} numberOfLines={2}>{c[lang]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { marginHorizontal: 8, marginTop: 8, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingBottom: 8, overflow: 'hidden' },
  track: { height: 4, marginHorizontal: 16, marginTop: 2, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  thumb: { position: 'absolute', top: 0, bottom: 0, borderRadius: 2, backgroundColor: colors.primary },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, maxWidth: 200 },
  column: { marginHorizontal: 4, justifyContent: 'center' },
  icon: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 },
  more: { justifyContent: 'center', alignItems: 'center', marginHorizontal: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white },
  moreTxt: { fontSize: 14, fontWeight: '700', color: colors.primary },
  moreArrow: { fontSize: 18, fontWeight: '700', color: colors.primary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '75%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  close: { fontSize: 18, color: colors.muted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
  tile: { width: '31%', minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  tileTxt: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
