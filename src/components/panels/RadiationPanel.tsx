import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';

export function RadiationPanel() {
  const rad = useSimulation((s) => s.radiation);

  let status: SystemStatus = 'nominal';
  if (rad.external > 3.0) status = 'critical';
  else if (rad.external > 2.0) status = 'warning';

  return (
    <StatusPanel title="RADIATION" status={status}>
      <Reading label="External" value={rad.external} unit="mSv/hr" precision={2}
        status={rad.external > 3.0 ? 'critical' : rad.external > 2.0 ? 'warning' : 'nominal'} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-text-secondary truncate">Shield</span>
        <span className={`font-mono text-sm font-medium shrink-0 ${rad.shieldStatus ? 'text-green' : 'text-red'}`}>
          {rad.shieldStatus ? 'ACTIVE' : 'OFFLINE'}
        </span>
      </div>
    </StatusPanel>
  );
}
