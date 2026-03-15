import { useEffect, useMemo, useRef } from 'react';
import { useSimulation } from '../store/simulation';
import { formatMissionTime } from '../lib/simulation';
import { getBaseEntry } from '../data/base-registry';
import { getModulePlacement } from '../data/shared-config';

export function AlertFeed() {
  const alerts = useSimulation((s) => s.alerts);
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const baseType = useSimulation((s) => s.baseType);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entry = getBaseEntry(baseType);
  const SYSTEM_MODULE_MAP = entry.systemMap;

  // Build module position lookup based on active base
  const modulePositions = useMemo(() => {
    const map: Record<string, [number, number, number]> = { ...entry.facilityPositions };
    for (const m of entry.modules) {
      const p = getModulePlacement(m, entry.junctions);
      map[m.id] = [p.cx, 0, p.cz];
    }
    return map;
  }, [baseType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [alerts.length]);

  const handleAlertClick = (system: string) => {
    const moduleId = SYSTEM_MODULE_MAP[system];
    if (!moduleId) return;
    const pos = modulePositions[moduleId];
    if (pos) setFocusTarget(pos);
    setSelectedModule(moduleId);
  };

  return (
    <div className="max-h-24 flex flex-col relative"
      style={{
        background: 'linear-gradient(0deg, rgba(6,10,18,0.98) 0%, rgba(11,16,24,0.9) 100%)',
        borderTop: '1px solid rgba(26,37,53,0.8)',
      }}
    >
      <div className="px-4 py-1.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(26,37,53,0.5)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan pulse-nominal" />
        <span className="font-mono text-[10px] tracking-widest text-text-secondary">EVENT LOG</span>
        <span className="font-mono text-[9px] text-text-dim">{alerts.length} EVENTS</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3 font-mono">
          <span className="text-[11px] tracking-widest text-text-dim">VIEWPOINTS</span>
          {entry.viewpointLabels.map((name, i) => (
            <div key={i} className="flex items-center gap-1">
              <kbd className="flex items-center justify-center w-4 h-4 text-[10px] text-text-primary rounded border border-panel-border bg-cyan/[0.06] select-none leading-none">
                {i + 1}
              </kbd>
              <span className="text-[10px] text-text-dim">{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {alerts.map((alert) => {
          const severityClass = `alert-severity alert-severity-${alert.severity}`;
          const day = Math.floor(alert.timestamp / 86400);
          const time = alert.timestamp % 86400;
          const systemColor = alert.severity === 'critical' ? '#ff3040' : alert.severity === 'warning' ? '#f0a000' : '#00d4e0';
          const isClickable = !!SYSTEM_MODULE_MAP[alert.system];
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 py-0.5 font-mono text-[11px] ${severityClass} ${isClickable ? 'cursor-pointer hover:bg-white/[0.03] transition-colors' : ''}`}
              onClick={isClickable ? () => handleAlertClick(alert.system) : undefined}
            >
              <span className="text-text-dim shrink-0">
                D{day} {formatMissionTime(time)}
              </span>
              <span className="shrink-0 w-8 text-center font-semibold" style={{ color: systemColor }}>
                {alert.system}
              </span>
              <span className="text-text-secondary">{alert.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
