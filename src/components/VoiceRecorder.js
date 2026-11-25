// Message vocal d'annonce (1 minute au plus), facultatif, comme sur le site.
// Enregistré sur le téléphone ; l'annonce le reçoit à la publication (voir src/media.js).
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { notify } from '../notify';
import { colors, radius } from '../theme';
import { useVoiceUri } from '../voiceHooks';
import VoicePlayer from './VoicePlayer';

export const MAX_VOICE_SEC = 60;

const mmss = (n) => Math.floor(n / 60) + ':' + ('0' + (n % 60)).slice(-2);

// uri : fichier enregistré sur le téléphone · saved : message déjà présent sur l'annonce (modification)
export default function VoiceRecorder({ uri, saved, savedData, savedId, onRecorded, onRemove, t, rtl }) {
  const savedUri = useVoiceUri(savedId, !uri && saved ? savedData : null);
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [recording, setRecording] = useState(false);
  const [sec, setSec] = useState(0);
  const timer = useRef(null);
  const count = useRef(0);
  const stopping = useRef(false);

  useEffect(() => () => clearInterval(timer.current), []);

  async function stop() {
    if (stopping.current) return;
    stopping.current = true;
    clearInterval(timer.current);
    try {
      await recorder.stop();
      if (recorder.uri) onRecorded(recorder.uri);
      else notify(t('voiceErr'));
    } catch {
      notify(t('voiceErr'));
    }
    setRecording(false);
    stopping.current = false;
  }

  async function start() {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { notify(t('recDenied')); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      count.current = 0;
      setSec(0);
      setRecording(true);
      timer.current = setInterval(() => {
        count.current += 1;
        setSec(count.current);
        if (count.current >= MAX_VOICE_SEC) stop(); // 1 minute au plus
      }, 1000);
    } catch {
      notify(t('voiceErr'));
    }
  }

  const alignStyle = rtl ? { textAlign: 'right', writingDirection: 'rtl' } : null;
  const rowStyle = rtl ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' };

  return (
    <View style={{ gap: 8 }}>
      {uri || saved ? (
        <View style={[styles.row, rowStyle]}>
          {(uri || savedUri) ? <View style={styles.previewBox}><VoicePlayer uri={uri || savedUri} /></View> : <Text style={styles.ok}>🎙️ {t('voiceOk')}</Text>}
          <Pressable onPress={onRemove} hitSlop={8}><Text style={styles.del}>{t('voiceDel')}</Text></Pressable>
        </View>
      ) : recording ? (
        <Pressable style={[styles.btn, styles.recOn]} onPress={stop}>
          <Text style={styles.btnTxt}>⏹ {t('voiceStop')} · {mmss(sec)}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.btn} onPress={start}>
          <Text style={styles.btnTxt}>🎙️ {t('voiceRec')}</Text>
        </Pressable>
      )}
      <Text style={[styles.help, alignStyle]}>{t('voiceHelp')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  btn: { backgroundColor: '#EEF5F0', borderRadius: radius.m, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
  recOn: { backgroundColor: colors.danger, borderStyle: 'solid', borderColor: colors.danger },
  btnTxt: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  previewBox: { flex: 1, minWidth: 220, backgroundColor: '#EEF5F0', borderRadius: radius.m, padding: 10 },
  ok: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  del: { color: colors.danger, fontWeight: '700' },
  help: { fontSize: 13, color: colors.muted },
});
