import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading, BarReading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';
import type { MarsSimulationState } from '../../lib/mars-simulation';

export function PowerPanel() {
  const power = useSimulation((s) => s.power);
  const baseType = useSimulation((s) => s.baseType);
  const windOutput = useSimulation((s) =>
    s.baseType === 'mars' ? (s as unknown as MarsSimulationState).facilities.wind.totalOutput : 0
  );

  let status: SystemStatus = 'nominal';
  if (power.batteryLevel < 15) status = 'critical';
  else if (power.batteryLevel < 30) status = 'warning';

  const totalGen = power.solarGeneration + windOutput;
  const netPower = totalGen - power.consumption;

  return (
    <StatusPanel title="POWER" status={status}>
      <Reading label="Solar Output" value={power.solarGeneration} unit="kW" />
      {baseType === 'mars' && (
        <Reading label="Wind Output" value={windOutput} unit="kW" />
      )}
      <Reading label="Consumption" value={power.consumption} unit="kW" />
      <Reading label="Net" value={netPower} unit="kW"
        status={netPower < -10 ? 'critical' : netPower < 0 ? 'warning' : 'nominal'} />
      <BarReading label="Battery" value={power.batteryLevel} max={100} unit="%"
        warningThreshold={30} criticalThreshold={15} />
    </StatusPanel>
  );
}
