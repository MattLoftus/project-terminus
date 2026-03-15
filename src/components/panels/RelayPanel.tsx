import { useSimulation } from '../../store/simulation';
import type { PhobosSimulationState } from '../../lib/phobos-simulation';

export function RelayPanel() {
  const facilities = useSimulation((s) => (s as unknown as PhobosSimulationState).facilities);

  if (!facilities || !facilities.marsRelay) return null;

  const { marsRelay, docking, fuelDepot } = facilities;
  const linkColor = marsRelay.linkActive ? '#00e070' : '#e05050';
  const qualityColor = marsRelay.signalQuality > 60 ? '#6b7d94' : marsRelay.signalQuality > 30 ? '#e0a030' : '#e05050';

  return (
    <div className="relative rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan pulse-nominal" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">MARS RELAY</span>
      </div>

      <div className="relative px-4 py-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Mars Link</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: linkColor }}>{marsRelay.linkActive ? 'ACTIVE' : 'LOST'}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Signal</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: qualityColor }}>{marsRelay.signalQuality.toFixed(0)}%</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Traffic</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{marsRelay.dataTraffic.toFixed(1)} Mbps</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Orbit Phase</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{(marsRelay.orbitalPhase * 360).toFixed(0)}°</span>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          {docking.bays.map(bay => (
            <div key={bay.id} className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-text-secondary">{bay.id.toUpperCase()}</span>
              <span className="font-mono text-[11px] text-text-primary tabular-nums">
                {bay.occupied ? bay.vesselName : 'EMPTY'}
              </span>
            </div>
          ))}
          {docking.approachingVessel && (
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-text-secondary">Approach</span>
              <span className="font-mono text-[11px] tabular-nums" style={{ color: '#e0a030' }}>
                {docking.approachingVessel} ({docking.eta}m)
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">CH₄</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{(fuelDepot.ch4Reserves / 1000).toFixed(1)} t</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">LOX</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{(fuelDepot.loxReserves / 1000).toFixed(1)} t</span>
          </div>
        </div>
      </div>
    </div>
  );
}
