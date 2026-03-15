import { useSimulation } from '../../store/simulation';
import { StatusPanel, Reading } from './StatusPanel';
import type { SystemStatus } from '../../data/base-config';
import type { MarsSimulationState } from '../../lib/mars-simulation';

export function WeatherPanel() {
  const weather = useSimulation((s) => (s as unknown as MarsSimulationState).weather);

  if (!weather) return null;

  let status: SystemStatus = 'nominal';
  if (weather.dustStormActive && weather.dustStormIntensity > 0.5) status = 'critical';
  else if (weather.dustStormActive) status = 'warning';
  else if (weather.dustOpacity > 1.0) status = 'warning';

  return (
    <StatusPanel title="WEATHER" status={status}>
      {weather.dustStormActive && (
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${weather.dustStormIntensity > 0.5 ? 'bg-red pulse-critical' : 'bg-amber pulse-warning'}`} />
          <span className="font-mono text-[11px] font-medium text-amber">
            DUST STORM — {(weather.dustStormIntensity * 100).toFixed(0)}%
          </span>
        </div>
      )}
      <Reading label="Wind Speed" value={weather.windSpeed} unit="m/s" precision={1} />
      <Reading label="Wind Dir" value={weather.windDirection} unit="°" precision={0} />
      <Reading label="Dust Opacity" value={weather.dustOpacity} unit="τ" precision={2}
        status={weather.dustOpacity > 2 ? 'critical' : weather.dustOpacity > 1 ? 'warning' : 'nominal'} />
      <Reading label="Surface Temp" value={weather.surfaceTemp} unit="°C" precision={1} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-text-secondary truncate">Season</span>
        <span className="font-mono text-[11px] text-text-primary">{weather.season.toUpperCase()}</span>
      </div>
    </StatusPanel>
  );
}
