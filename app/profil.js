// Modifier mon profil : photo (visible par les acheteurs et dans la messagerie), nom, ville.
// Même enregistrement que le site (PUT /api/me) : le profil est identique sur bi3li.net.
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { api, mediaUrl } from '../src/api';
import { useAuth } from '../src/auth';
import CityPicker from '../src/components/CityPicker';
import { useLang } from '../src/i18n';
import { notify } from '../src/notify';
import { pickPhotos, preparePhoto } from '../src/photos';
import { cityName } from '../src/places';
import { colors, radius } from '../src/theme';

const T = {
  fr: {
    title: 'Mon profil', photo: 'Changer la photo', camera: 'Prendre une photo', remove: 'Retirer la photo', name: 'Nom affiché', city: 'Ville',
    noCity: 'Choisir ma ville', save: 'Enregistrer', saved: 'Profil enregistré.', errName: 'Écrivez votre nom.', err: 'Enregistrement impossible. Vérifiez votre connexion.',
    tip: 'Une vraie photo et un vrai nom donnent confiance aux acheteurs.', perm: 'Autorisez l’accès aux photos dans les réglages du téléphone.',
  },
  ar: {
    title: 'ملفي الشخصي', photo: 'تغيير الصورة', camera: 'التقاط صورة', remove: 'حذف الصورة', name: 'الاسم الظاهر', city: 'المدينة',
    noCity: 'اختر مدينتي', save: 'حفظ', saved: 'تم حفظ الملف الشخصي.', errName: 'اكتب اسمك.', err: 'تعذّر الحفظ. تحقق من الاتصال.',
    tip: 'الصورة الحقيقية والاسم الحقيقي يمنحان الثقة للمشترين.', perm: 'اسمح بالوصول إلى الصور من إعدادات الهاتف.',
  },
};

export default function Profil() {
  const { user, reloadUser } = useAuth();
  const { lang, rtl } = useLang();
  const t = (k) => T[lang][k];
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [photo, setPhoto] = useState(null);   // nouvelle photo choisie { uri, … } ; '' = retirer
  const [cityOpen, setCityOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const al = rtl ? { textAlign: 'right' } : null;
  if (!user) return null;

  const shown = photo === '' ? null : photo?.uri || (user.avatar ? mediaUrl(user.avatar) : null);

  async function choose(source) {
    try { const [p] = await pickPhotos(source, 1); if (p) setPhoto(p); } catch (e) { if (e.message === 'permission') notify(t('perm')); }
  }

  async function save() {
    if (!name.trim()) { notify(t('errName')); return; }
    setBusy(true);
    try {
      const body = { name: name.trim(), city };
      // photo de profil : petite (400 px) car le serveur limite à 600 Ko
      if (photo === '') body.avatar = '';
      else if (photo) body.avatar = await preparePhoto(photo, 400, 0.8);
      await api.updateMe(body);
      await reloadUser();
      notify(t('saved'));
      router.back();
    } catch { notify(t('err')); } finally { setBusy(false); }
  }

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('title') }} />
      <View style={{ alignItems: 'center', gap: 10 }}>
        {shown ? <Image source={shown} style={s.avatar} contentFit="cover" /> : (
          <View style={[s.avatar, s.avatarEmpty]}><Text style={s.initial}>{(name || '?').trim().charAt(0).toUpperCase()}</Text></View>
        )}
        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pressable style={s.chip} onPress={() => choose('library')}><Text style={s.chipTxt}>🖼️ {t('photo')}</Text></Pressable>
          <Pressable style={s.chip} onPress={() => choose('camera')}><Text style={s.chipTxt}>📷 {t('camera')}</Text></Pressable>
          {!!shown && <Pressable style={s.chip} onPress={() => setPhoto('')}><Text style={[s.chipTxt, { color: colors.danger }]}>✕ {t('remove')}</Text></Pressable>}
        </View>
        <Text style={s.tip}>{t('tip')}</Text>
      </View>

      <Text style={[s.label, al]}>{t('name')}</Text>
      <TextInput style={[s.input, al]} value={name} onChangeText={setName} maxLength={30} placeholderTextColor={colors.muted} />

      <Text style={[s.label, al]}>{t('city')}</Text>
      <Pressable style={s.input} onPress={() => setCityOpen(true)}>
        <Text style={[{ fontSize: 16, color: city ? colors.text : colors.muted }, al]}>📍 {city ? cityName(city, lang) : t('noCity')}</Text>
      </Pressable>

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={save}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{t('save')}</Text>}
      </Pressable>

      <CityPicker visible={cityOpen} value={city} onClose={() => setCityOpen(false)} onPick={(c) => { setCity(c); setCityOpen(false); }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 10, paddingBottom: 40 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarEmpty: { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 44, fontWeight: '800', color: colors.primaryDark },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
  chipTxt: { fontWeight: '700', color: colors.text },
  tip: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 13, fontSize: 16, backgroundColor: colors.white, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
