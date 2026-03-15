import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading, BarReading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';

export function AtmospherePanel() {
  const atm = useSimulation((s) => s.atmosphere);

  let status: SystemStatus = 'nominal';
  if (atm.co2 > 1500 || atm.pressure < 98.5) status = 'critical';
  else if (atm.co2 > 1000 || atm.pressure < 99.5) status = 'warning';

  return (
    <StatusPanel title="ATMOSPHERE" status={status}>
      <Reading label="Pressure" value={atm.pressure} unit="kPa"
        status={atm.pressure < 98.5 ? 'critical' : atm.pressure < 99.5 ? 'warning' : 'nominal'} />
      <Reading label="Oxygen" value={atm.o2} unit="%"
        status={atm.o2 < 19 ? 'critical' : atm.o2 < 19.5 ? 'warning' : 'nominal'} />
      <BarReading label="CO₂" value={atm.co2} max={2000} unit="ppm"
        warningThreshold={1000} criticalThreshold={1500} inverted />
      <Reading label="Humidity" value={atm.humidity} unit="%"
        status={atm.humidity < 30 || atm.humidity > 65 ? 'warning' : 'nominal'} />
    </StatusPanel>
  );
}
