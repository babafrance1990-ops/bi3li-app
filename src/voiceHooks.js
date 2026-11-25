// Lecture du message vocal d'une annonce (sur la carte, la fiche et le formulaire)
import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { voiceFile } from './voiceFile';

// Après un enregistrement, iOS reste en mode « micro » : on repasse en mode lecture pour entendre le son
export function playbackMode() {
  return setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

// Adresse du fichier audio prête à lire (null tant que le fichier n'est pas prêt)
export function useVoiceUri(adId, dataUrl) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    if (!dataUrl) { setUri(null); return undefined; }
    let on = true;
    voiceFile(adId, dataUrl).then((u) => { if (on) setUri(u); });
    return () => { on = false; };
  }, [adId, dataUrl]);
  return uri;
}

// Lecteur : toggle() lance le son depuis le début, ou l'arrête s'il joue
export function useVoicePlayer(uri) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  async function toggle() {
    if (!uri) return;
    if (status.playing) { player.pause(); return; }
    await playbackMode();
    player.seekTo(0);
    player.play();
  }
  return { toggle, playing: !!status.playing, ready: !!uri };
}
