// Un seul écran « Se connecter / Créer un compte », comme sur le site :
// 1) numéro → le serveur dit si le compte existe ; 2a) code → connexion ; 2b) nom + code + confirmation → création
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { api, cleanPhone } from '../src/api';
import { useAuth } from '../src/auth';
import { useLang } from '../src/i18n';
import { useWaJob } from '../src/wa';
import { colors, radius } from '../src/theme';

export default function Connexion() {
  const { t, rtl } = useLang();
  const { login, register, signInWith } = useAuth();
  const [step, setStep] = useState('phone'); // phone | login | create
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [support, setSupport] = useState('');
  const [newPin, setNewPin] = useState(null); // { a, b } : choix d'un nouveau code après « code oublié »
  const { lang } = useLang();
  const F = lang === 'ar'
    ? { forgotWa: 'استرجاع حسابي عبر واتساب', wait: 'في انتظار رسالتك على واتساب…', from: 'أرسل الرسالة من واتساب الرقم', again: 'فتح واتساب مرة أخرى', cancel: 'إلغاء', expired: 'انتهت صلاحية الرمز. أعد المحاولة.', noWa: 'لا يوجد واتساب على هذا الرقم؟ راسل فريق بيعلي', npT: 'اختر رمزك السري الجديد', np1: 'الرمز الجديد', np2: 'أكّد الرمز', npSave: 'حفظ رمزي الجديد', npLater: 'لاحقاً', tooMany: 'طلبات كثيرة. أعد المحاولة بعد ساعة.' }
    : { forgotWa: 'Récupérer mon compte par WhatsApp', wait: 'En attente de votre message WhatsApp…', from: 'Envoyez le message depuis le WhatsApp du numéro', again: 'Ouvrir WhatsApp à nouveau', cancel: 'Annuler', expired: 'Le code a expiré. Recommencez.', noWa: 'Pas de WhatsApp sur ce numéro ? Écrivez à l’équipe Bi3li', npT: 'Choisissez votre nouveau code secret', np1: 'Nouveau code', np2: 'Confirmez le code', npSave: 'Enregistrer mon nouveau code', npLater: 'Plus tard', tooMany: 'Trop de demandes. Réessayez dans une heure.' };
  // « Code oublié » : message WhatsApp → connexion automatique → choix d'un nouveau code
  const wa = useWaJob(lang, async (r) => { if (r.token) { await signInWith(r); setNewPin({ a: '', b: '' }); } });

  useEffect(() => { api.config().then((c) => setSupport(c.support)).catch(() => {}); }, []);

  function explain(e) {
    const m = {
      phone: t('errPhone'), pin_format: t('errCode'), pin_weak: t('errWeak'), name: t('errName'), blocked: t('errBlocked'),
      badpass: t('errBad') + (e.data?.left ?? ''), locked: t('errLocked') + (e.data?.min ?? ''),
    }[e.code];
    return m || t('netErr');
  }

  async function run(fn) {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(explain(e)); } finally { setBusy(false); }
  }

  const onPhone = () => run(async () => {
    if (cleanPhone(phone).length !== 8) throw { code: 'phone' };
    const r = await api.check(phone);
    if (r.blocked) throw { code: 'blocked' };
    setStep(r.exists ? 'login' : 'create');
  });

  const onLogin = () => run(async () => {
    if (!/^\d{4}$/.test(code)) throw { code: 'pin_format' };
    await login(phone, code);
    router.back();
  });

  const onCreate = () => run(async () => {
    if (!name.trim()) throw { code: 'name' };
    if (!/^\d{4}$/.test(code)) throw { code: 'pin_format' };
    if (code !== code2) { setErr(t('errSame')); return; }
    await register(phone, code, name.trim());
    router.replace('/verifier'); // comme le site : proposer tout de suite de vérifier le numéro
  });

  const input = [s.input, rtl && { textAlign: 'right' }];

  async function savePin() {
    if (!/^\d{4}$/.test(newPin.a)) { setErr(t('errCode')); return; }
    if (newPin.a !== newPin.b) { setErr(t('errSame')); return; }
    setBusy(true); setErr('');
    try { await api.setPin(newPin.a); router.back(); }
    catch (e) { setErr(e.code === 'pin_weak' ? t('errWeak') : t('netErr')); } finally { setBusy(false); }
  }
  if (newPin) {
    return (
      <View style={s.wrap}>
        <Text style={s.title}>🔑 {F.npT}</Text>
        <TextInput style={[input, s.pin]} value={newPin.a} onChangeText={(v) => setNewPin({ ...newPin, a: v })} placeholder={F.np1} keyboardType="number-pad" maxLength={4} secureTextEntry autoFocus />
        <TextInput style={[input, s.pin]} value={newPin.b} onChangeText={(v) => setNewPin({ ...newPin, b: v })} placeholder={F.np2} keyboardType="number-pad" maxLength={4} secureTextEntry />
        {!!err && <Text style={s.err}>{err}</Text>}
        <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={savePin}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{F.npSave}</Text>}
        </Pressable>
        <Pressable onPress={() => router.back()}><Text style={[s.link, { color: colors.muted }]}>{F.npLater}</Text></Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
      <Text style={s.title}>{t('login')}</Text>

      <TextInput style={input} value={phone} onChangeText={setPhone} placeholder={t('phone')}
        keyboardType="phone-pad" maxLength={12} editable={step === 'phone'} />

      {step === 'login' && (
        <>
          <Text style={s.hint}>{t('welcomeBack')}</Text>
          <TextInput style={[input, s.pin]} value={code} onChangeText={setCode} placeholder={t('code')}
            keyboardType="number-pad" maxLength={4} secureTextEntry autoFocus />
        </>
      )}

      {step === 'create' && (
        <>
          <Text style={s.hint}>{t('newAccount')}</Text>
          <TextInput style={input} value={name} onChangeText={setName} placeholder={t('name')} maxLength={30} autoFocus />
          <TextInput style={[input, s.pin]} value={code} onChangeText={setCode} placeholder={t('code')}
            keyboardType="number-pad" maxLength={4} secureTextEntry />
          <TextInput style={[input, s.pin]} value={code2} onChangeText={setCode2} placeholder={t('code2')}
            keyboardType="number-pad" maxLength={4} secureTextEntry />
        </>
      )}

      {!!err && <Text style={s.err}>{err}</Text>}

      <Pressable disabled={busy} style={[s.btn, busy && { opacity: 0.6 }]}
        onPress={step === 'phone' ? onPhone : step === 'login' ? onLogin : onCreate}>
        {busy ? <ActivityIndicator color="#fff" /> :
          <Text style={s.btnTxt}>{step === 'phone' ? t('next') : step === 'login' ? t('enter') : t('create')}</Text>}
      </Pressable>

      {step === 'login' && !wa.job && (
        <Pressable onPress={() => wa.start('reset', phone)}>
          <Text style={s.link}>🟢 {t('forgot')} — {F.forgotWa}</Text>
        </Pressable>
      )}
      {!!wa.error && <Text style={s.err}>{wa.error === 'too_many' ? F.tooMany : t('netErr')}</Text>}
      {wa.job && (
        <View style={s.waBox}>
          {wa.job.expired ? <Text style={s.hint}>⌛ {F.expired}</Text> : (
            <>
              <ActivityIndicator color="#25D366" />
              <Text style={s.hint}>{F.wait}</Text>
              <Text style={{ textAlign: 'center', color: colors.muted }}>{F.from} {'\u2066+222 ' + cleanPhone(phone) + '\u2069'}</Text>
            </>
          )}
          <Pressable onPress={wa.job.expired ? () => wa.start('reset', phone) : wa.reopen}><Text style={s.link}>{wa.job.expired ? F.forgotWa : F.again}</Text></Pressable>
          <Pressable onPress={wa.cancel}><Text style={[s.link, { color: colors.muted }]}>{F.cancel}</Text></Pressable>
          {!!support && (
            <Pressable onPress={() => Linking.openURL('https://wa.me/' + support + '?text=' + encodeURIComponent('نسيت الرقم السري — ' + cleanPhone(phone)))}>
              <Text style={[s.link, { color: colors.muted, fontSize: 13 }]}>{F.noWa}</Text>
            </Pressable>
          )}
        </View>
      )}
      {step !== 'phone' && (
        <Pressable onPress={() => { setStep('phone'); setCode(''); setCode2(''); setErr(''); }}>
          <Text style={s.link}>↩︎ {t('phone')}</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 12, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  hint: { textAlign: 'center', color: colors.primaryDark, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: 14, fontSize: 18, backgroundColor: colors.bg },
  pin: { letterSpacing: 8, textAlign: 'center' },
  err: { color: colors.danger, textAlign: 'center' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.m, padding: 16, alignItems: 'center', marginTop: 4 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  waBox: { gap: 10, padding: 14, borderRadius: radius.m, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#25D366', alignItems: 'center' },
  link: { color: colors.primaryDark, textAlign: 'center', padding: 8, fontWeight: '600' },
});
