import { useSimulation } from '../../store/simulation';
import type { CeresSimulationState } from '../../lib/ceres-simulation';

export function MiningPanel() {
  const facilities = useSimulation((s) => (s as unknown as CeresSimulationState).facilities);

  if (!facilities || !facilities.miningRigs) return null;

  const { miningRigs, massDriver, oreStockpile, spinModule } = facilities;
  const chargeColor = massDriver.chargeLevel > 90 ? '#00e070' : massDriver.chargeLevel > 50 ? '#c0a030' : '#6b7d94';

  return (
    <div className="relative rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan pulse-nominal" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">MINING OPS</span>
      </div>

      <div className="relative px-4 py-3 space-y-1.5">
        {/* Mining rigs */}
        {miningRigs.map((rig) => (
          <div key={rig.id} className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">{rig.id.toUpperCase()}</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{rig.rate.toFixed(0)} kg/hr</span>
          </div>
        ))}

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Ore Stockpile</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{(oreStockpile.totalKg / 1000).toFixed(1)} t</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Processed</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{(oreStockpile.processedKg / 1000).toFixed(1)} t</span>
          </div>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Mass Driver</span>
            <span className="font-mono text-[11px] tabular-nums" style={{ color: chargeColor }}>{massDriver.chargeLevel.toFixed(0)}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Launches</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{massDriver.launchCount}</span>
          </div>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Spin Module</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{spinModule.gravityLevel.toFixed(2)}g @ {spinModule.rpm.toFixed(1)} rpm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
