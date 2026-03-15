import { useEffect } from 'react';
import { startSimulation, stopSimulation, restartSimulation, useSimulation } from './store/simulation';
import { getBaseEntry } from './data/base-registry';
import { TopBar } from './components/TopBar';
import { AlertFeed } from './components/AlertFeed';
import { BaseMap } from './components/base-map/BaseMap';
import { AtmospherePanel } from './components/panels/AtmospherePanel';
import { WaterPanel } from './components/panels/WaterPanel';
import { PowerPanel } from './components/panels/PowerPanel';
import { CommsPanel } from './components/panels/CommsPanel';
import { CrewPanel } from './components/panels/CrewPanel';
import { RadiationPanel } from './components/panels/RadiationPanel';
import { ControlsPanel } from './components/panels/ControlsPanel';
import { ModuleDetail } from './components/panels/ModuleDetail';
import { TransitionOverlay } from './components/TransitionOverlay';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useAmbientAudio } from './hooks/useAmbientAudio';

export default function App() {
  const baseType = useSimulation((s) => s.baseType);
  const entry = getBaseEntry(baseType);

  useDocumentTitle();
  useAmbientAudio();

  const simSpeed = useSimulation((s) => s.simSpeed);

  useEffect(() => {
    startSimulation(2000 / simSpeed);
    return () => stopSimulation();
  }, []);

  // Restart interval when speed changes
  useEffect(() => {
    restartSimulation(2000 / simSpeed);
  }, [simSpeed]);

  return (
    <div data-base={baseType} className="h-full w-full flex flex-col bg-void overflow-hidden vignette">
      <TopBar />

      <div className="flex-1 grid grid-cols-[320px_1fr_320px] grid-rows-[1fr] min-h-0">
        {/* Left panels */}
        <div className="sidebar-left border-r border-panel-border overflow-y-auto overflow-x-hidden p-4 min-w-0 flex flex-col">
          <div className="space-y-3">
            <AtmospherePanel />
            <WaterPanel />
            <RadiationPanel />
            {entry.leftPanels?.map((Panel, i) => <Panel key={i} />)}
          </div>
          <div className="flex-1" />
          <div className="mt-3">
            <ControlsPanel />
          </div>
        </div>

        {/* Center — 3D base map */}
        <div className="min-h-0 min-w-0 relative overflow-hidden">
          <BaseMap />
        </div>

        {/* Right panels */}
        <div className="sidebar-right border-l border-panel-border overflow-y-auto overflow-x-hidden p-4 space-y-3 min-w-0">
          <PowerPanel />
          <CommsPanel />
          <CrewPanel />
          {entry.rightPanels?.map((Panel, i) => <Panel key={i} />)}
          <ModuleDetail />
        </div>
      </div>

      {/* Bottom — Alert feed */}
      <AlertFeed />

      <TransitionOverlay />
    </div>
  );
}
