// Lecteur de message vocal façon WhatsApp : lecture / pause, reculer et avancer de 10 s, barre de progression.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getInfoAsync } from 'expo-file-system/legacy';
import { playbackMode } from '../voiceHooks';
import { colors } from '../theme';

const mmss = (n) => { const x = Math.floor(n || 0); return Math.floor(x / 60) + ':' + ('0' + (x % 60)).slice(-2); };

// uri : fichier audio prêt (null tant qu'il n'est pas prêt) · dark : sur fond sombre (carte) · compact : version de la carte
export default function VoicePlayer({ uri, dark, compact, mime }) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const st = useAudioPlayerStatus(player);
  const [want, setWant] = useState(false);
  const [barW, setBarW] = useState(0);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(null);
  // Échec = la durée reste à zéro : le fichier n'a pas pu être chargé (même si le bouton a changé d'état)
  useEffect(() => {
    if (!failed || !uri) return;
    getInfoAsync(uri).then((i) => setSize(i.exists ? i.size : -1)).catch(() => setSize(-1));
  }, [failed, uri]);
  // Si le son ne démarre pas (format non lu par ce téléphone), on le signale au lieu de rester muet
  useEffect(() => {
    if (!uri || !want) return undefined;
    const id = setTimeout(() => { if (!(live.current.duration > 0)) setFailed(true); }, 3000);
    return () => clearTimeout(id);
  }, [uri, want]);
  useEffect(() => { if (st.duration > 0) { setFailed(false); setSize(null); } }, [st.duration]);
  const live = useRef(st);
  live.current = st; // état le plus récent, lu par les minuteries
  const cur = st.currentTime || 0;
  const dur = st.duration || 0;

  async function play() {
    await playbackMode();
    if (dur && cur >= dur - 0.3) player.seekTo(0); // fini : on repart du début
    player.play();
  }
  // Si le fichier n'est pas encore prêt, la lecture démarre dès qu'il l'est
  useEffect(() => {
    if (uri && want) { setWant(false); play(); }
  }, [uri, want]);

  function toggle() {
    if (!uri) { setWant(true); return; }
    if (st.playing) { player.pause(); return; }
    play();
    setTimeout(() => { if (!(live.current.duration > 0)) setFailed(true); }, 3000);
  }
  function skip(sec) {
    if (!uri) return;
    player.seekTo(Math.max(0, Math.min(dur || 0, cur + sec)));
  }
  function seekAt(x) {
    if (!uri || !dur || !barW) return;
    player.seekTo(Math.max(0, Math.min(1, x / barW)) * dur);
  }

  const ink = dark ? '#fff' : colors.primaryDark;
  const fill = dark ? '#fff' : colors.primary;
  const track = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)';
  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;
  const playing = st.playing || (want && !uri);
  const big = compact ? 30 : 44;

  if (failed) {
    return (
      <View style={[s.row, compact && s.rowC]}>
        <Text style={[s.warn, { color: ink }]}>⚠️ Vocal non lisible{mime ? ' (' + mime + ')' : ''}{size !== null ? ' · fichier : ' + (size < 0 ? 'introuvable' : size + ' octets') : ''}</Text>
      </View>
    );
  }
  return (
    <View style={[s.row, compact && s.rowC]}>
      <Pressable onPress={() => skip(-10)} hitSlop={6} style={s.skip}>
        <Text style={[s.skipTxt, { color: ink }, compact && s.skipC]}>⏪</Text>
      </Pressable>
      <Pressable onPress={toggle} hitSlop={6} style={[s.play, { width: big, height: big, borderRadius: big / 2, backgroundColor: dark ? 'rgba(255,255,255,0.22)' : colors.primary }]}>
        <Text style={[s.playTxt, { fontSize: compact ? 13 : 20, color: '#fff' }]}>{playing ? '❚❚' : '▶'}</Text>
      </Pressable>
      <Pressable onPress={() => skip(10)} hitSlop={6} style={s.skip}>
        <Text style={[s.skipTxt, { color: ink }, compact && s.skipC]}>⏩</Text>
      </Pressable>
      <View style={s.barBox}>
        <Pressable onPress={(e) => seekAt(e.nativeEvent.locationX)} onLayout={(e) => setBarW(e.nativeEvent.layout.width)} hitSlop={10} style={s.barHit}>
          <View style={[s.track, { backgroundColor: track }]}>
            <View style={[s.fill, { width: pct + '%', backgroundColor: fill }]} />
          </View>
        </Pressable>
        {!compact && <Text style={[s.time, { color: ink }]}>{mmss(cur)} / {mmss(dur)}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' },
  rowC: { gap: 3, paddingHorizontal: 6, paddingVertical: 4 },
  skip: { paddingHorizontal: 2 },
  skipTxt: { fontSize: 18 },
  skipC: { fontSize: 13 },
  play: { alignItems: 'center', justifyContent: 'center' },
  playTxt: { fontWeight: '700' },
  barBox: { flex: 1, minWidth: 40 },
  barHit: { justifyContent: 'center', height: 22 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  time: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  warn: { fontSize: 12, fontWeight: '700', textAlign: 'center', flex: 1 },
});
