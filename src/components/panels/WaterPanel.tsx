import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading, BarReading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';

export function WaterPanel() {
  const water = useSimulation((s) => s.water);

  let status: SystemStatus = 'nominal';
  if (water.reserves < 35000 || water.recyclingRate < 85) status = 'critical';
  else if (water.reserves < 40000 || water.recyclingRate < 90) status = 'warning';

  return (
    <StatusPanel title="WATER SYSTEMS" status={status}>
      <BarReading label="Reserves" value={water.reserves} max={55000} unit="L"
        warningThreshold={40000} criticalThreshold={35000} />
      <Reading label="Recycling Rate" value={water.recyclingRate} unit="%"
        status={water.recyclingRate < 85 ? 'critical' : water.recyclingRate < 90 ? 'warning' : 'nominal'} />
      <Reading label="Daily Use" value={water.dailyConsumption} unit="L/day" precision={0} />
    </StatusPanel>
  );
}
