import { useEffect } from 'react';
import { useSimulation } from '../store/simulation';
import { audioManager } from '../lib/audio';

export function useAmbientAudio() {
  const baseType = useSimulation((s) => s.baseType);
  const audioEnabled = useSimulation((s) => s.audioEnabled);

  useEffect(() => {
    if (audioEnabled && audioManager.initialized) {
      audioManager.switchAmbient(baseType);
    }
  }, [baseType, audioEnabled]);
}
