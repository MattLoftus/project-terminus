import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';

export function CommsPanel() {
  const comms = useSimulation((s) => s.comms);
  const baseType = useSimulation((s) => s.baseType);
  const isMars = baseType === 'mars';

  const status: SystemStatus = comms.earthLink ? 'nominal' : 'warning';

  // Mars: display latency in minutes, not seconds
  const latencyDisplay = comms.earthLink
    ? isMars
      ? `${(comms.signalLatency / 60).toFixed(1)}`
      : `${comms.signalLatency.toFixed(2)}`
    : '—';
  const latencyUnit = comms.earthLink ? (isMars ? 'min' : 's') : '';

  return (
    <StatusPanel title="COMMUNICATIONS" status={status}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-text-secondary truncate">Earth Link</span>
        <span className={`font-mono text-sm font-medium shrink-0 ${comms.earthLink ? 'text-green' : 'text-amber'}`}>
          {comms.earthLink ? 'ONLINE' : isMars ? 'CONJUNCTION' : 'OFFLINE'}
        </span>
      </div>
      <Reading label="Latency" value={latencyDisplay} unit={latencyUnit} />
      <Reading label="Bandwidth" value={comms.earthLink ? comms.bandwidth : '—'} unit={comms.earthLink ? 'Mbps' : ''}
        precision={1} />
      {isMars && comms.earthLink && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] text-text-secondary truncate">Mode</span>
          <span className="font-mono text-[11px] text-text-primary">STORE & FORWARD</span>
        </div>
      )}
    </StatusPanel>
  );
}
