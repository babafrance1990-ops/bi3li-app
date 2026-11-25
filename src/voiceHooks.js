// Lecture du message vocal d'une annonce (sur la carte comme sur la fiche)
import { useEffect, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { voiceFile } from './voiceFile';

// Adresse du fichier audio prête à lire (null tant que le fichier n'est pas prêt)
export function useVoiceUri(adId, dataUrl) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    if (!dataUrl) return undefined;
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
  function toggle() {
    if (!uri) return;
    if (status.playing) { player.pause(); return; }
    player.seekTo(0);
    player.play();
  }
  return { toggle, playing: !!status.playing, ready: !!uri };
}
