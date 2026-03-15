import { useEffect } from 'react';
import { useSimulation } from '../store/simulation';
import { getBaseEntry } from '../data/base-registry';

export function useDocumentTitle() {
  const baseType = useSimulation((s) => s.baseType);
  const missionDay = useSimulation((s) => s.missionDay);
  const entry = getBaseEntry(baseType);

  useEffect(() => {
    document.title = `${entry.name} — Day ${missionDay} | PROJECT TERMINUS`;
  }, [entry.name, missionDay]);
}
