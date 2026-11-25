// Vus récemment : les annonces consultées sur ce téléphone
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import AdCard from '../src/components/AdCard';
import { useLang } from '../src/i18n';
import { clearSeen, loadSeen } from '../src/seen';
import { colors, radius } from '../src/theme';

export default function Vus() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const [list, setList] = useState([]);

  useFocusEffect(useCallback(() => { loadSeen().then(setList); }, []));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: ar ? 'شاهدتها مؤخراً' : 'Vus récemment' }} />
      {list.length > 0 && (
        <Pressable style={s.clear} onPress={async () => { await clearSeen(); setList([]); }}>
          <Text style={s.clearTxt}>{ar ? 'مسح السجل' : 'Effacer l’historique'}</Text>
        </Pressable>
      )}
      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AdCard ad={item} />}
        contentContainerStyle={{ padding: 5, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={s.empty}>{ar ? 'لم تشاهد أي إعلان بعد.' : 'Aucune annonce consultée pour l’instant.'}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  clear: { alignSelf: 'flex-end', margin: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  clearTxt: { color: colors.primary, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 15 },
});
