// Liste des conversations, comme sur le site : la plus récente en haut, pastille verte = messages non lus
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { mediaUrl } from '../../src/api';
import { useAuth } from '../../src/auth';
import { shortTime, useConvs } from '../../src/chat';
import { useLang } from '../../src/i18n';
import { colors, radius } from '../../src/theme';

const T = {
  fr: { login: 'Connectez-vous pour parler avec les vendeurs et les acheteurs.', loginBtn: 'Se connecter / Créer un compte',
    empty: 'Aucun message pour l’instant', emptyTip: 'Sur une annonce, touchez « Message » pour écrire au vendeur.',
    you: 'Vous : ', photo: '📷 Photo', buying: 'Achat', selling: 'Vente', err: 'Connexion impossible' },
  ar: { login: 'سجّل الدخول للتحدث مع البائعين والمشترين.', loginBtn: 'تسجيل الدخول / إنشاء حساب',
    empty: 'لا توجد رسائل بعد', emptyTip: 'في أي إعلان، اضغط «رسالة» لمراسلة البائع.',
    you: 'أنت: ', photo: '📷 صورة', buying: 'شراء', selling: 'بيع', err: 'تعذّر الاتصال' },
};

export default function Messages() {
  const { user } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k) => T[lang][k];
  const { convs, error, refresh } = useConvs(8000);
  const [refreshing, setRefreshing] = useState(false);
  const al = rtl ? { textAlign: 'right' } : null;
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 44 }}>💬</Text>
        <Text style={s.muted}>{t('login')}</Text>
        <Pressable style={s.btn} onPress={() => router.push('/connexion')}><Text style={s.btnTxt}>{t('loginBtn')}</Text></Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={convs || []}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} colors={[colors.primary]}
        onRefresh={() => { setRefreshing(true); refresh().catch(() => {}).finally(() => setRefreshing(false)); }} />}
      ListHeaderComponent={error && !convs ? <Text style={[s.err]}>{t('err')}</Text> : null}
      ListEmptyComponent={convs ? (
        <View style={s.center}>
          <Text style={{ fontSize: 44 }}>💬</Text>
          <Text style={s.emptyT}>{t('empty')}</Text>
          <Text style={s.muted}>{t('emptyTip')}</Text>
        </View>
      ) : null}
      renderItem={({ item: c }) => {
        const last = c.msgs[c.msgs.length - 1] || {};
        const preview = (last.me ? t('you') : '') + (last.txt || (last.img ? t('photo') : ''));
        return (
          <Pressable style={({ pressed }) => [s.item, row, pressed && { backgroundColor: colors.bg }]} onPress={() => router.push('/conversation/' + c.id)}>
            {c.otherAvatar
              ? <Image source={mediaUrl(c.otherAvatar)} style={s.avatar} />
              : <View style={[s.avatar, s.avatarEmpty]}><Text style={s.initial}>{(c.seller || '?').trim().charAt(0).toUpperCase()}</Text></View>}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={[row, { justifyContent: 'space-between', gap: 8 }]}>
                <Text style={[s.name, al, { flex: 1 }]} numberOfLines={1}>{c.seller}</Text>
                <Text style={[s.time, c.unread > 0 && { color: colors.primary, fontWeight: '700' }]}>{shortTime(c.updated, lang)}</Text>
              </View>
              <Text style={[s.title, al]} numberOfLines={1}>{c.buyer ? '🛒 ' : '🏷️ '}{c.title}</Text>
              <View style={[row, { gap: 8, alignItems: 'center' }]}>
                <Text style={[s.preview, al, { flex: 1 }, c.unread > 0 && { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>{preview}</Text>
                {c.unread > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{c.unread}</Text></View>}
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  item: { gap: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarEmpty: { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.muted },
  title: { fontSize: 13, color: colors.primaryDark },
  preview: { fontSize: 14, color: colors.muted },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  center: { alignItems: 'center', padding: 30, gap: 12, marginTop: 40 },
  emptyT: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, textAlign: 'center', fontSize: 15 },
  err: { color: colors.danger, textAlign: 'center', padding: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 14, paddingHorizontal: 20 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
