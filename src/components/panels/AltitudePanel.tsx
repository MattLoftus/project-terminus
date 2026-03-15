import { useSimulation } from '../../store/simulation';
import type { VenusSimulationState } from '../../lib/venus-simulation';

export function AltitudePanel() {
  const facilities = useSimulation((s) => (s as unknown as VenusSimulationState).facilities);

  if (!facilities || !facilities.altitude) return null;

  const { altitude: alt, wind, acidCorrosion } = facilities;
  const altColor = alt.altitude < 48 || alt.altitude > 53 ? '#e05050' : '#00e070';
  const envelopeColor = alt.envelopeIntegrity < 80 ? '#e0a030' : '#6b7d94';
  const gustColor = wind.gustActive ? '#e0a030' : '#6b7d94';

  return (
    <div className="relative rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan pulse-nominal" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">ALTITUDE & WIND</span>
      </div>

      <div className="relative px-4 py-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Altitude</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: altColor }}>{alt.altitude.toFixed(1)} km</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Vert. Rate</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{alt.verticalRate > 0 ? '+' : ''}{alt.verticalRate.toFixed(2)} m/s</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Buoyancy Gas</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{alt.buoyancyGas.toFixed(0)}%</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Envelope</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: envelopeColor }}>{alt.envelopeIntegrity.toFixed(0)}%</span>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Wind Speed</span>
            <span className="font-mono text-[11px] tabular-nums" style={{ color: gustColor }}>{wind.windSpeed.toFixed(0)} m/s{wind.gustActive ? ' GUST' : ''}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Wind Power</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{wind.windPowerOutput.toFixed(0)} kW</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Turbine Health</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{wind.turbineHealth.toFixed(0)}%</span>
          </div>
        </div>

        <div className="border-t border-panel-border pt-1.5 mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Corrosion Rate</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{acidCorrosion.corrosionRate.toFixed(1)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-text-secondary">Maint. Queue</span>
            <span className="font-mono text-[11px] text-text-primary tabular-nums">{acidCorrosion.maintenanceQueue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
