// Vidéo et message vocal sur la fiche d'une annonce (comme sur le site)
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
import { videoPoster } from '../videoPoster';
import { voiceFile } from '../voiceFile';
import { colors, radius } from '../theme';

// Vidéo : on affiche une image de la vidéo ; la lecture ne démarre qu'à l'appui (économie de données)
export function AdVideo({ url, width, label }) {
  const [poster, setPoster] = useState(null);
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer(started ? url : null, (p) => { p.loop = false; });

  useEffect(() => {
    let on = true;
    videoPoster(url).then((u) => { if (on) setPoster(u); });
    return () => { on = false; };
  }, [url]);

  useEffect(() => { if (started && player) player.play(); }, [started, player]);

  return (
    <View style={[styles.video, { width, height: width * 0.75 }]}>
      {started ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />
      ) : (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setStarted(true)}>
          {poster && <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
          <View style={styles.playWrap}>
            <View style={styles.play}><Text style={styles.playTxt}>▶</Text></View>
          </View>
          <Text style={styles.tag}>🎬 {label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Lecteur du message vocal : le fichier est préparé à partir du texte de l'annonce
export function AdVoice({ adId, dataUrl, label }) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    let on = true;
    voiceFile(adId, dataUrl).then((u) => { if (on) setUri(u); }).catch(() => {});
    return () => { on = false; };
  }, [adId, dataUrl]);
  if (!uri) return null;
  return <VoicePlayer uri={uri} label={label} />;
}

function VoicePlayer({ uri, label }) {
  const player = useAudioPlayer({ uri });
  return (
    <Pressable onPress={() => { player.seekTo(0); player.play(); }} style={styles.voice}>
      <Text style={styles.voiceTxt}>🎙️ ▶ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  video: { backgroundColor: '#2b2b2b', overflow: 'hidden' },
  // Bouton ▶ au centre : position calculée (moitié de la taille), sans dépendre du conteneur
  playWrap: { position: 'absolute', top: '50%', left: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -32 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  playTxt: { color: '#fff', fontSize: 26, marginLeft: 4 },
  tag: { position: 'absolute', bottom: 10, left: 10, color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', fontWeight: '700' },
  voice: { backgroundColor: '#EEF5F0', borderRadius: radius.m, padding: 14, alignItems: 'center', marginTop: 10 },
  voiceTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
});
