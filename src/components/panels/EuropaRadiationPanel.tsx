import { useSimulation } from '../../store/simulation';
import type { EuropaSimulationState } from '../../lib/europa-simulation';

export function EuropaRadiationPanel() {
  const facilities = useSimulation((s) => (s as unknown as EuropaSimulationState).facilities);

  if (!facilities || !facilities.radiationShield) return null;

  const shield = facilities.radiationShield;
  const drill = facilities.iceDrill;

  const fluxColor = shield.fluxLevel > 3 ? '#ff3040' : shield.fluxLevel > 1.5 ? '#f0a000' : '#40a0e0';
  const shelterStatus = shield.shelterActive ? 'ACTIVE' : 'STANDBY';
  const shelterColor = shield.shelterActive ? '#ff3040' : '#6b7d94';

  return (
    <div className="relative rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${shield.fluxLevel > 2 ? 'bg-amber pulse-warning' : 'bg-cyan pulse-nominal'}`} />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">JUPITER RADIATION</span>
      </div>

      <div className="relative px-4 py-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Flux Level</span>
          <span className="font-mono text-[11px] tabular-nums font-medium" style={{ color: fluxColor }}>{shield.fluxLevel.toFixed(2)} Sv/hr</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Shield Integrity</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{shield.shieldIntegrity.toFixed(1)}%</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Orbital Phase</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{(shield.orbitalPhase * 360).toFixed(0)}°</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Shelter</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: shelterColor }}>{shelterStatus}</span>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Ice Drill Depth</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{drill.depth.toFixed(0)} m</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Drill Rate</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{drill.drillRate.toFixed(2)} m/hr</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Breakthrough</span>
            <span className="font-mono text-[11px] tabular-nums" style={{ color: drill.breakthroughReached ? '#00e070' : '#6b7d94' }}>
              {drill.breakthroughReached ? 'YES' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
