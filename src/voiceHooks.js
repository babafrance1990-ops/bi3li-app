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

// Lecteur : toggle() lance le son depuis le début, ou l'arrête s'il joue.
// Si le fichier n'est pas encore prêt, la lecture démarre dès qu'il l'est (le bouton reste actif).
export function useVoicePlayer(uri) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  const [want, setWant] = useState(false);
  async function play() {
    await playbackMode();
    player.seekTo(0);
    player.play();
  }
  useEffect(() => {
    if (uri && want) { setWant(false); play(); }
  }, [uri, want]);
  function toggle() {
    if (!uri) { setWant(true); return; }
    if (status.playing) { player.pause(); return; }
    play();
  }
  return { toggle, playing: !!status.playing || (want && !uri), ready: true };
}
