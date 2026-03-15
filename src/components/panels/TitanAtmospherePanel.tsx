import { useSimulation } from '../../store/simulation';
import type { TitanSimulationState } from '../../lib/titan-simulation';

export function TitanAtmospherePanel() {
  const weather = useSimulation((s) => (s as unknown as TitanSimulationState).weather);

  if (!weather || weather.surfaceTemp === undefined) return null;

  const rainStatus = weather.methaneRainActive
    ? `ACTIVE (${(weather.methaneRainIntensity * 100).toFixed(0)}%)`
    : 'CLEAR';
  const rainColor = weather.methaneRainActive ? '#c07820' : '#6b7d94';

  return (
    <div className="relative rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${weather.methaneRainActive ? 'bg-amber pulse-warning' : 'bg-cyan pulse-nominal'}`} />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">TITAN ATMOSPHERE</span>
      </div>

      <div className="relative px-4 py-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Surface Temp</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{weather.surfaceTemp.toFixed(1)}°C</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Ext. Pressure</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{weather.atmosphericPressure.toFixed(1)} kPa</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Wind Speed</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{weather.windSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">Visibility</span>
          <span className="font-mono text-[11px] text-text-primary tabular-nums">{weather.visibility.toFixed(1)} km</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-text-secondary">CH₄ Rain</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: rainColor }}>{rainStatus}</span>
        </div>
      </div>
    </div>
  );
}
