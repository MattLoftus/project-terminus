import { useState } from 'react';
import { useSimulation } from '../../store/simulation';
import type { CrewMember } from '../../lib/crew';
import { StatusPanel, Reading } from './StatusPanel';

const ROLE_ABBREV: Record<string, string> = {
  Commander: 'CMD',
  Engineer: 'ENG',
  Scientist: 'SCI',
  Medical: 'MED',
  Pilot: 'PLT',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#00d4e0',
  resting: '#a0afc3',
  eva: '#f0a000',
  medical: '#ff3040',
};

function CrewRow({ member }: { member: CrewMember }) {
  const statusColor = STATUS_COLOR[member.status] || '#a0afc3';
  const moduleLabel = member.currentModule?.toUpperCase().slice(0, 5) ?? '—';

  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] leading-tight py-0.5">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
      <span className="text-text-dim w-7 shrink-0">{ROLE_ABBREV[member.role] ?? member.role.slice(0, 3).toUpperCase()}</span>
      <span className="text-text-primary truncate flex-1">
        {member.firstName} {member.lastName}
      </span>
      <span className="text-text-dim w-12 text-right shrink-0">[{moduleLabel}]</span>
      <span className="text-text-dim w-14 text-right shrink-0 tabular-nums">
        M:{Math.round(member.morale)} H:{Math.round(member.health)}
      </span>
    </div>
  );
}

export function CrewPanel() {
  const crew = useSimulation((s) => s.crew);
  const crewRoster = useSimulation((s) => s.crewRoster) as CrewMember[];
  const [expanded, setExpanded] = useState(false);

  return (
    <StatusPanel title="CREW STATUS">
      <Reading label="Personnel" value={crew.total} unit="active" precision={0} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-text-secondary truncate">EVA Active</span>
        <span className={`font-mono text-sm font-medium shrink-0 ${crew.evaActive > 0 ? 'text-amber' : 'text-text-primary'}`}>
          {crew.evaActive}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-text-secondary truncate">Medical Alerts</span>
        <span className={`font-mono text-sm font-medium shrink-0 ${crew.medicalAlerts > 0 ? 'text-red' : 'text-green'}`}>
          {crew.medicalAlerts > 0 ? crew.medicalAlerts : 'CLEAR'}
        </span>
      </div>

      {crewRoster.length > 0 && (
        <div className="pt-1 border-t border-panel-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-1 text-[10px] font-mono tracking-widest text-text-dim hover:text-text-secondary transition-colors"
          >
            <span>ROSTER [{crewRoster.length}]</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>
          {expanded && (
            <div className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
              {crewRoster.map(member => (
                <CrewRow key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      )}
    </StatusPanel>
  );
}
