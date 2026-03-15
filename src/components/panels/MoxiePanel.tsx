import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading, BarReading } from './StatusPanel';
import type { MarsSimulationState } from '../../lib/mars-simulation';

export function MoxiePanel() {
  const moxie = useSimulation((s) => (s as unknown as MarsSimulationState).facilities?.moxie);

  if (!moxie) return null;

  return (
    <StatusPanel title="MOXIE" status={moxie.status}>
      <Reading label="CO₂ Intake" value={moxie.co2Intake} unit="kg/hr" precision={1} />
      <Reading label="O₂ Output" value={moxie.o2Output} unit="kg/hr" precision={1} />
      <Reading label="Efficiency" value={moxie.efficiency} unit="%" precision={1}
        status={moxie.efficiency < 50 ? 'critical' : moxie.efficiency < 70 ? 'warning' : 'nominal'} />
      <Reading label="Electrolysis" value={moxie.electrolysisTemp} unit="°C" precision={0} />
      <BarReading label="Filter Life" value={moxie.filterLife} max={100} unit="%"
        warningThreshold={20} criticalThreshold={5} />
    </StatusPanel>
  );
}
