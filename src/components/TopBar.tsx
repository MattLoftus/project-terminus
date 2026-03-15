import { useSimulation } from '../store/simulation';
import { formatMissionTime, getSystemStatus } from '../lib/simulation';
import { getStatusColor, type SystemStatus } from '../data/base-config';
import { BaseSwitcher } from './BaseSwitcher';
import { audioManager } from '../lib/audio';

function StatusBadge({ status }: { status: SystemStatus }) {
  const color = getStatusColor(status);
  const label = status.toUpperCase();
  const pulseClass = status === 'critical' ? 'pulse-critical' : status === 'warning' ? 'pulse-warning' : 'pulse-nominal';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${pulseClass}`} style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
      <span className="font-mono text-xs tracking-widest font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

const SPEEDS = [1, 2, 5, 10] as const;

function TimeControls() {
  const isPaused = useSimulation((s) => s.isPaused);
  const simSpeed = useSimulation((s) => s.simSpeed);
  const togglePause = useSimulation((s) => s.togglePause);
  const setSimSpeed = useSimulation((s) => s.setSimSpeed);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={togglePause}
        className="font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors"
        style={{
          color: isPaused ? '#f0a000' : '#00d4e0',
          borderColor: isPaused ? 'rgba(240,160,0,0.3)' : 'rgba(0,212,224,0.2)',
          background: isPaused ? 'rgba(240,160,0,0.08)' : 'rgba(0,212,224,0.05)',
        }}
      >
        {isPaused ? '\u25B6' : '\u275A\u275A'}
      </button>
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => setSimSpeed(s)}
          className="font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors"
          style={{
            color: simSpeed === s ? '#00d4e0' : 'rgba(160,175,195,0.5)',
            borderColor: simSpeed === s ? 'rgba(0,212,224,0.3)' : 'rgba(160,175,195,0.1)',
            background: simSpeed === s ? 'rgba(0,212,224,0.08)' : 'transparent',
          }}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}

function AudioToggle() {
  const audioEnabled = useSimulation((s) => s.audioEnabled);
  const setAudioEnabled = useSimulation((s) => s.setAudioEnabled);
  const baseType = useSimulation((s) => s.baseType);

  const handleClick = async () => {
    if (!audioEnabled) {
      await audioManager.init();
      setAudioEnabled(true);
      audioManager.switchAmbient(baseType);
    } else {
      audioManager.toggleMute();
      if (audioManager.isMuted) {
        setAudioEnabled(false);
      }
    }
    audioManager.playUI('click');
  };

  return (
    <button
      onClick={handleClick}
      className="font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors"
      style={{
        color: audioEnabled ? '#00d4e0' : 'rgba(160,175,195,0.5)',
        borderColor: audioEnabled ? 'rgba(0,212,224,0.3)' : 'rgba(160,175,195,0.1)',
        background: audioEnabled ? 'rgba(0,212,224,0.08)' : 'transparent',
      }}
      title={audioEnabled ? 'Mute audio' : 'Enable audio'}
    >
      {audioEnabled ? 'SND' : 'MUTE'}
    </button>
  );
}

export function TopBar() {
  const { missionDay, missionTime, atmosphere, power, comms, crew, modules } = useSimulation();
  const isPaused = useSimulation((s) => s.isPaused);
  const overallStatus = getSystemStatus({ missionDay, missionTime, atmosphere, water: {} as any, power, comms, crew, radiation: {} as any, modules, alerts: [], facilities: {} as any });

  return (
    <div className="h-12 bg-panel/90 flex items-center justify-between px-6 relative topbar-border"
      style={{ borderBottom: '1px solid rgba(26,37,53,0.8)' }}
    >
      {/* Subtle scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative flex items-center gap-6">
        <BaseSwitcher />
        <div className="w-px h-5 bg-panel-border" />
        <StatusBadge status={overallStatus} />
      </div>

      <div className="relative flex items-center gap-8 font-mono text-xs text-text-secondary">
        <TimeControls />
        <div className="w-px h-4 bg-panel-border" />
        {isPaused && (
          <span className="text-[10px] tracking-widest animate-pulse" style={{ color: '#f0a000' }}>
            PAUSED
          </span>
        )}
        <span className={isPaused ? 'opacity-40' : ''}>
          DAY <span className="text-text-primary font-medium">{missionDay}</span>
        </span>
        <span className={isPaused ? 'opacity-40' : ''}>
          UTC <span className="text-text-primary font-medium">{formatMissionTime(missionTime)}</span>
        </span>
        <span>
          CREW <span className="text-text-primary font-medium">{crew.total}</span>
        </span>
        <AudioToggle />
      </div>
    </div>
  );
}
