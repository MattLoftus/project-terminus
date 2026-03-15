import { useState } from 'react';
import { useSimulation } from '../../store/simulation';
import { getBaseEntry } from '../../data/base-registry';
import { getStatusColor } from '../../data/base-config';
import type { SystemStatus } from '../../data/base-config';
import type { FacilitiesData } from '../../lib/simulation';
import type { MarsFacilitiesData } from '../../lib/mars-simulation';
import type { CrewMember } from '../../lib/crew';
import type { Alert } from '../../lib/shared-simulation';

// ---------------------------------------------------------------------------
// Collapsible section wrapper
// ---------------------------------------------------------------------------

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-panel-border pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-text-dim hover:text-text-secondary transition-colors mb-1"
      >
        <span>{title}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crew assigned to module
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  active: '#00d4e0',
  resting: '#a0afc3',
  eva: '#f0a000',
  medical: '#ff3040',
};

const ROLE_ABBREV: Record<string, string> = {
  Commander: 'CMD', Engineer: 'ENG', Scientist: 'SCI', Medical: 'MED', Pilot: 'PLT',
};

function CrewAssigned({ moduleId }: { moduleId: string }) {
  const crewRoster = useSimulation((s) => s.crewRoster) as CrewMember[];
  const assigned = crewRoster.filter(m => m.currentModule === moduleId);

  if (assigned.length === 0) {
    return (
      <Section title="CREW ASSIGNED">
        <div className="font-mono text-[10px] text-text-dim italic">UNOCCUPIED</div>
      </Section>
    );
  }

  return (
    <Section title={`CREW ASSIGNED [${assigned.length}]`}>
      <div className="space-y-0.5">
        {assigned.map(m => (
          <div key={m.id} className="flex items-center gap-1.5 font-mono text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[m.status] }} />
            <span className="text-text-dim w-7 shrink-0">{ROLE_ABBREV[m.role]}</span>
            <span className="text-text-primary truncate">{m.firstName} {m.lastName}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Event log (recent alerts for this module's system)
// ---------------------------------------------------------------------------

const MODULE_SYSTEM_MAP: Record<string, string[]> = {
  lifesupport: ['ATM', 'HAB'],
  power: ['PWR', 'NUK'],
  comms: ['COM'],
  'relay-comms': ['COM', 'RLY'],
  medical: ['MED'],
  airlock: ['ALK', 'EVA'],
  greenhouse: ['GRN'],
  greenhouse2: ['GR2'],
  greenhouse3: ['GR3'],
  research: ['LAB'],
  observatory: ['OBS'],
  command: ['SYS', 'CMD'],
  habitation: ['HAB'],
  workshop: ['FAB'],
  fabrication: ['FAB', 'MFG'],
  storage: ['STR'],
  docking: ['DCK'],
  bioprocessing: ['BIO'],
  logistics: ['LOG'],
};

function EventLog({ moduleId }: { moduleId: string }) {
  const alerts = useSimulation((s) => s.alerts) as Alert[];
  const systems = MODULE_SYSTEM_MAP[moduleId] || [];
  const relevant = alerts
    .filter(a => systems.includes(a.system))
    .slice(-5)
    .reverse();

  return (
    <Section title="EVENT LOG" defaultOpen={false}>
      {relevant.length === 0 ? (
        <div className="font-mono text-[10px] text-text-dim italic">No recent events</div>
      ) : (
        <div className="space-y-1">
          {relevant.map(a => (
            <div key={a.id} className="font-mono text-[10px] leading-tight">
              <span className="text-text-dim">[{a.system}]</span>{' '}
              <span className={a.severity === 'critical' ? 'text-red' : a.severity === 'warning' ? 'text-amber' : 'text-text-secondary'}>
                {a.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Detail panel (core layout — unchanged structure)
// ---------------------------------------------------------------------------

function DetailPanel({
  name, shortName, label, description, status, readings, onClose, moduleId,
}: {
  name: string;
  shortName: string;
  label: string;
  description: string;
  status: SystemStatus;
  readings: { label: string; value: string }[];
  onClose: () => void;
  moduleId?: string;
}) {
  const statusColor = getStatusColor(status);
  const borderColor = status === 'critical' ? 'border-red/25' : status === 'warning' ? 'border-amber/25' : 'border-panel-border';
  const glowClass = status === 'critical' ? 'glow-red' : status === 'warning' ? 'glow-amber' : '';

  return (
    <div className={`relative min-w-0 rounded border ${borderColor} ${glowClass} corner-brackets overflow-hidden`}
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.97) 0%, rgba(6,10,18,0.95) 100%)' }}
    >
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      {/* Header */}
      <div className="relative px-4 py-2.5 border-b border-panel-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'critical' ? 'bg-red pulse-critical' :
              status === 'warning' ? 'bg-amber pulse-warning' :
              'bg-cyan pulse-nominal'
            }`}
          />
          <div>
            <div className="font-mono text-xs tracking-wide text-text-primary">{name}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-text-dim">{shortName} — {label}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-[10px] text-text-dim hover:text-text-primary transition-colors px-2 py-1"
        >
          [CLOSE]
        </button>
      </div>

      {/* Content */}
      <div className="relative px-4 py-3 max-h-[60vh] overflow-y-auto space-y-3">
        <div className="font-mono text-[10px] text-text-secondary leading-relaxed">
          {description}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-text-dim">STATUS</span>
          <span className="font-mono text-[11px] font-medium" style={{ color: statusColor }}>
            {status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-1.5">
          {readings.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-text-secondary">{r.label}</span>
              <span className="font-mono text-[11px] text-text-primary tabular-nums">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Enhanced sections for modules (not facilities) */}
        {moduleId && !moduleId.startsWith('facility-') && (
          <>
            <CrewAssigned moduleId={moduleId} />
            <EventLog moduleId={moduleId} />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Facility detail renderers (unchanged)
// ---------------------------------------------------------------------------

function FacilityDetail({ facilityId, onClose, facilities }: {
  facilityId: string;
  onClose: () => void;
  facilities: FacilitiesData;
}) {
  if (facilityId === 'facility-reactor') {
    const r = facilities.reactor;
    return (
      <DetailPanel
        name="Nuclear Reactor"
        shortName="NUK"
        label="FACILITY DETAIL"
        description="Fission power generation — primary base power source providing continuous energy independent of solar cycle."
        status={r.status}
        readings={[
          { label: 'Core Temperature', value: `${r.coreTemp.toFixed(1)}°C` },
          { label: 'Power Output', value: `${r.outputKW.toFixed(1)} kW` },
          { label: 'Control Rods', value: r.rodStatus.toUpperCase() },
          { label: 'Coolant Flow', value: `${r.coolantFlow.toFixed(1)}%` },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-isru') {
    const i = facilities.isru;
    return (
      <DetailPanel
        name="ISRU Processing Plant"
        shortName="ISRU"
        label="FACILITY DETAIL"
        description="In-Situ Resource Utilization — extracts oxygen, water, and construction materials from lunar regolith."
        status={i.status}
        readings={[
          { label: 'Throughput', value: `${i.throughput.toFixed(1)} kg/hr` },
          { label: 'Total Processed', value: `${(i.regolithProcessed / 1000).toFixed(1)} t` },
          { label: 'O₂ Production', value: `${i.o2ProductionRate.toFixed(1)} kg/hr` },
          { label: 'H₂O Production', value: `${i.h2oProductionRate.toFixed(1)} kg/hr` },
          { label: 'Hopper', value: i.hopperStatus.toUpperCase() },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId.startsWith('facility-pad-')) {
    const padId = facilityId.replace('facility-', '');
    const pad = facilities.launchPads.find(p => p.id === padId);
    if (!pad) return null;
    return (
      <DetailPanel
        name={`Launch ${pad.id.toUpperCase()}`}
        shortName={pad.id.toUpperCase()}
        label="FACILITY DETAIL"
        description="Cargo and crew launch/landing facility with integrated fueling systems and beacon guidance."
        status={pad.status}
        readings={[
          { label: 'Fuel Level', value: `${pad.fuelLevel.toFixed(1)}%` },
          { label: 'Pad Status', value: pad.padStatus.toUpperCase().replace('-', ' ') },
        ]}
        onClose={onClose}
      />
    );
  }

  return null;
}

function MarsFacilityDetail({ facilityId, onClose, facilities }: {
  facilityId: string;
  onClose: () => void;
  facilities: MarsFacilitiesData;
}) {
  if (facilityId === 'facility-reactor') {
    const r = facilities.reactor;
    return (
      <DetailPanel
        name="Nuclear Reactor" shortName="NUK" label="FACILITY DETAIL"
        description="Fission power generation — primary base power source providing continuous energy independent of solar cycle."
        status={r.status}
        readings={[
          { label: 'Core Temperature', value: `${r.coreTemp.toFixed(1)}°C` },
          { label: 'Power Output', value: `${r.outputKW.toFixed(1)} kW` },
          { label: 'Control Rods', value: r.rodStatus.toUpperCase() },
          { label: 'Coolant Flow', value: `${r.coolantFlow.toFixed(1)}%` },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-icemine') {
    const i = facilities.iceMining;
    return (
      <DetailPanel
        name="Ice Mining Operation" shortName="ICE" label="FACILITY DETAIL"
        description="Subsurface ice extraction via thermal drilling — supplies water for base consumption, agriculture, and Sabatier process."
        status={i.status}
        readings={[
          { label: 'Drill Depth', value: `${i.drillDepth.toFixed(1)} m` },
          { label: 'Total Extracted', value: `${(i.iceExtracted / 1000).toFixed(1)} t` },
          { label: 'Melt Rate', value: `${i.meltRate.toFixed(1)} kg/hr` },
          { label: 'Pump', value: i.pumpStatus.toUpperCase() },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-landing') {
    const l = facilities.landingField;
    return (
      <DetailPanel
        name="Landing Field" shortName="LND" label="FACILITY DETAIL"
        description="Surface lander operations — methane/LOX powered descent/ascent vehicles for Earth transit."
        status={l.status}
        readings={[
          { label: 'Landers Present', value: `${l.landersPresent}` },
          { label: 'Fuel Reserve', value: `${l.fuelReserve.toFixed(1)}%` },
          { label: 'Field Status', value: l.fieldStatus.toUpperCase().replace('-', ' ') },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-sabatier') {
    const s = facilities.sabatier;
    return (
      <DetailPanel
        name="Sabatier Plant" shortName="SAB" label="FACILITY DETAIL"
        description="Propellant production via Sabatier reaction — converts CO₂ + H₂ into methane and liquid oxygen."
        status={s.status}
        readings={[
          { label: 'CH₄ Production', value: `${s.ch4Production.toFixed(1)} kg/hr` },
          { label: 'LOX Production', value: `${s.loxProduction.toFixed(1)} kg/hr` },
          { label: 'Reactor Temp', value: `${s.reactorTemp.toFixed(0)}°C` },
          { label: 'CO₂ Consumption', value: `${s.co2Consumption.toFixed(1)} kg/hr` },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-wind') {
    const w = facilities.wind;
    return (
      <DetailPanel
        name="Wind Turbine Array" shortName="WIND" label="FACILITY DETAIL"
        description="Darrieus-type vertical axis wind turbines — supplemental power from Mars's thin atmosphere."
        status="nominal"
        readings={[
          { label: 'Turbines', value: `${w.turbineCount} active` },
          { label: 'Total Output', value: `${w.totalOutput.toFixed(1)} kW` },
          { label: 'Avg Wind', value: `${w.avgWindSpeed.toFixed(1)} m/s` },
        ]}
        onClose={onClose}
      />
    );
  }

  if (facilityId === 'facility-weather') {
    return (
      <DetailPanel
        name="Weather Station" shortName="WTH" label="FACILITY DETAIL"
        description="Meteorological instruments — anemometer, barometric sensor, dust counter, temperature probe."
        status="nominal"
        readings={[
          { label: 'Status', value: 'OPERATIONAL' },
        ]}
        onClose={onClose}
      />
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ModuleDetail() {
  const selectedId = useSimulation((s) => s.selectedModule);
  const setSelectedModule = useSimulation((s) => s.setSelectedModule);
  const baseType = useSimulation((s) => s.baseType);
  const moduleState = useSimulation((s) => s.modules.find((m) => m.id === selectedId));
  const facilities = useSimulation((s) => s.facilities);
  const atmosphere = useSimulation((s) => s.atmosphere);
  const power = useSimulation((s) => s.power);
  const water = useSimulation((s) => s.water);

  if (!selectedId) return null;

  // Facility detail — use registry FacilityDetail if available, else fallbacks
  if (selectedId.startsWith('facility-')) {
    const entry = getBaseEntry(baseType);
    if (entry.FacilityDetail) {
      return <entry.FacilityDetail facilityId={selectedId} onClose={() => setSelectedModule(null)} facilities={facilities} />;
    }
    // Legacy fallbacks for Moon and Mars (until migrated to registry)
    if (baseType === 'mars') {
      const marsFac = facilities as unknown as MarsFacilitiesData;
      return <MarsFacilityDetail facilityId={selectedId} onClose={() => setSelectedModule(null)} facilities={marsFac} />;
    }
    return <FacilityDetail facilityId={selectedId} onClose={() => setSelectedModule(null)} facilities={facilities as FacilitiesData} />;
  }

  // Dome detail — Mars central habitat dome
  if (selectedId === 'dome' && moduleState) {
    return (
      <DetailPanel
        name="Central Habitat Dome"
        shortName="DOME"
        label="Mars Central Dome"
        description="Primary pressurized habitat — operations, recreation, manufacturing"
        status={moduleState.status}
        moduleId="dome"
        readings={[
          { label: 'Temperature', value: `${moduleState.temperature.toFixed(1)}°C` },
          { label: 'Pressure', value: `${atmosphere.pressure.toFixed(1)} kPa` },
          { label: 'O₂ Level', value: `${atmosphere.o2.toFixed(1)}%` },
          { label: 'CO₂', value: `${atmosphere.co2.toFixed(0)} ppm` },
          { label: 'Humidity', value: `${atmosphere.humidity.toFixed(1)}%` },
          { label: 'Power Draw', value: `${(power.consumption * 0.35).toFixed(1)} kW` },
        ]}
        onClose={() => setSelectedModule(null)}
      />
    );
  }

  // Module detail
  if (!moduleState) return null;
  const moduleConfigs = getBaseEntry(baseType).modules;
  const config = moduleConfigs.find((m) => m.id === selectedId);
  if (!config) return null;

  const status = moduleState.status;

  const readings: { label: string; value: string }[] = [
    { label: 'Temperature', value: `${moduleState.temperature.toFixed(1)}°C` },
  ];

  if (selectedId === 'lifesupport') {
    readings.push(
      { label: 'CO₂ Level', value: `${atmosphere.co2.toFixed(0)} ppm` },
      { label: 'Pressure', value: `${atmosphere.pressure.toFixed(1)} kPa` },
      { label: 'O₂ Level', value: `${atmosphere.o2.toFixed(1)}%` },
    );
  } else if (selectedId === 'power') {
    readings.push(
      { label: 'Solar Output', value: `${power.solarGeneration.toFixed(1)} kW` },
      { label: 'Battery', value: `${power.batteryLevel.toFixed(1)}%` },
      { label: 'Consumption', value: `${power.consumption.toFixed(1)} kW` },
    );
  } else if (selectedId.startsWith('greenhouse') || selectedId === 'bioprocessing') {
    readings.push(
      { label: 'Humidity', value: `${atmosphere.humidity.toFixed(1)}%` },
    );
  } else if (selectedId === 'habitation' || selectedId === 'recreation') {
    readings.push(
      { label: 'Humidity', value: `${atmosphere.humidity.toFixed(1)}%` },
      { label: 'Water Reserves', value: `${water.reserves.toFixed(0)} L` },
    );
  }

  return (
    <DetailPanel
      name={config.name}
      shortName={config.shortName}
      label="MODULE DETAIL"
      description={config.description}
      status={status}
      readings={readings}
      moduleId={selectedId}
      onClose={() => setSelectedModule(null)}
    />
  );
}
