export function ControlsPanel() {
  return (
    <div
      className="relative min-w-0 rounded border border-panel-border corner-brackets overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,16,24,0.95) 0%, rgba(6,10,18,0.9) 100%)' }}
    >
      {/* Panel grid overlay */}
      <div className="absolute inset-0 panel-grid pointer-events-none" />

      {/* Header */}
      <div className="relative px-3 py-2 border-b border-panel-border bg-cyan/[0.02] flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">MAP CONTROLS</span>
      </div>

      {/* Content */}
      <div className="relative p-4 space-y-4">
        {/* WASD visual layout */}
        <div>
          <div className="font-mono text-[10px] text-text-secondary tracking-wider mb-2">MOVEMENT</div>
          <div className="flex items-start gap-4">
            {/* Key cluster */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Key char="W" />
              <div className="flex gap-1">
                <Key char="A" />
                <Key char="S" />
                <Key char="D" />
              </div>
            </div>
            {/* Labels */}
            <div className="font-mono text-[10px] leading-relaxed pt-0.5">
              <div><span className="text-text-primary">W</span> <span className="text-text-dim">Forward</span></div>
              <div><span className="text-text-primary">S</span> <span className="text-text-dim">Backward</span></div>
              <div><span className="text-text-primary">A</span> <span className="text-text-dim">Strafe left</span></div>
              <div><span className="text-text-primary">D</span> <span className="text-text-dim">Strafe right</span></div>
            </div>
          </div>
        </div>

        {/* Q/E vertical */}
        <div>
          <div className="font-mono text-[10px] text-text-secondary tracking-wider mb-2">ALTITUDE</div>
          <div className="flex items-start gap-4">
            <div className="flex gap-1 shrink-0">
              <Key char="Q" />
              <Key char="E" />
            </div>
            <div className="font-mono text-[10px] leading-relaxed pt-0.5">
              <div><span className="text-text-primary">E</span> <span className="text-text-dim">Ascend</span></div>
              <div><span className="text-text-primary">Q</span> <span className="text-text-dim">Descend</span></div>
            </div>
          </div>
        </div>

        {/* Mouse controls */}
        <div>
          <div className="font-mono text-[10px] text-text-secondary tracking-wider mb-2">CAMERA</div>
          <div className="font-mono text-[10px] space-y-1">
            <div><span className="text-text-primary">LMB Drag</span> <span className="text-text-dim">Orbit</span></div>
            <div><span className="text-text-primary">RMB Drag</span> <span className="text-text-dim">Pan</span></div>
            <div><span className="text-text-primary">Scroll</span> <span className="text-text-dim">Zoom</span></div>
            <div><span className="text-text-primary">Click</span> <span className="text-text-dim">Select module</span></div>
          </div>
        </div>

        {/* Viewpoints hint */}
        <div className="font-mono text-[9px] text-text-dim">
          Keys <span className="text-text-secondary">1–8</span> for viewpoints
        </div>
      </div>
    </div>
  );
}

function Key({ char }: { char: string }) {
  return (
    <kbd className="
      flex items-center justify-center
      w-7 h-7
      font-mono text-xs text-text-primary font-medium
      rounded border border-panel-border
      bg-cyan/[0.04]
      select-none
    ">
      {char}
    </kbd>
  );
}
