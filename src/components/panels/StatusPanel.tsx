import type { ReactNode } from 'react';
import type { SystemStatus } from '../../data/base-config';

interface StatusPanelProps {
  title: string;
  status?: SystemStatus;
  children: ReactNode;
}

export function StatusPanel({ title, children, status }: StatusPanelProps) {
  const glowClass = status === 'critical' ? 'glow-red' : status === 'warning' ? 'glow-amber' : '';
  const borderColor = status === 'critical' ? 'border-red/25' : status === 'warning' ? 'border-amber/25' : 'border-panel-border';
  const headerAccent = status === 'critical' ? 'bg-red/5' : status === 'warning' ? 'bg-amber/5' : 'bg-cyan/[0.02]';

  return (
    <div className={`relative min-w-0 rounded border ${borderColor} ${glowClass} corner-brackets scanline-sweep overflow-hidden`}
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.95) 0%, rgba(6,10,18,0.9) 100%)' }}
    >
      {/* Panel grid overlay */}
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      {/* Header */}
      <div className={`relative px-3 py-2 border-b border-panel-border ${headerAccent} flex items-center gap-2`}>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'critical' ? 'bg-red pulse-critical' :
            status === 'warning' ? 'bg-amber pulse-warning' :
            'bg-cyan pulse-nominal'
          }`}
        />
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">{title}</span>
      </div>

      {/* Content */}
      <div className="relative p-3 space-y-2.5">
        {children}
      </div>
    </div>
  );
}

interface ReadingProps {
  label: string;
  value: string | number;
  unit: string;
  status?: SystemStatus;
  precision?: number;
}

export function Reading({ label, value, unit, status = 'nominal', precision = 1 }: ReadingProps) {
  const displayValue = typeof value === 'number' ? value.toFixed(precision) : value;
  const color = status === 'critical' ? 'text-red' : status === 'warning' ? 'text-amber' : 'text-text-primary';

  return (
    <div className="flex items-baseline justify-between gap-3 min-w-0">
      <span className="text-[11px] text-text-secondary truncate">{label}</span>
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className={`font-mono text-sm font-medium tabular-nums ${color}`}>{displayValue}</span>
        <span className="font-mono text-[10px] text-text-dim w-11 text-right">{unit}</span>
      </div>
    </div>
  );
}

interface BarReadingProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  inverted?: boolean;
}

export function BarReading({ label, value, max, unit, warningThreshold, criticalThreshold, inverted }: BarReadingProps) {
  const pct = Math.min(100, (value / max) * 100);
  let status: SystemStatus = 'nominal';
  if (criticalThreshold != null) {
    if (inverted ? value > criticalThreshold : value < criticalThreshold) status = 'critical';
    else if (warningThreshold != null && (inverted ? value > warningThreshold : value < warningThreshold)) status = 'warning';
  }

  const barBg = status === 'critical' ? '#ff3040' : status === 'warning' ? '#f0a000' : '#00d4e0';

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <span className="text-[11px] text-text-secondary truncate">{label}</span>
        <div className="flex items-baseline gap-1.5 shrink-0">
          <span className="font-mono text-xs text-text-primary tabular-nums">{value.toFixed(1)}</span>
          <span className="font-mono text-[10px] text-text-dim w-11 text-right">{unit}</span>
        </div>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(26,37,53,0.8)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barBg}88, ${barBg})`,
            boxShadow: `0 0 6px ${barBg}40`,
          }}
        />
      </div>
    </div>
  );
}
