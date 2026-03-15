import { useSimulation } from '../store/simulation';
import { getAllBases } from '../data/base-registry';

export function BaseSwitcher() {
  const baseType = useSimulation((s) => s.baseType);
  const beginTransition = useSimulation((s) => s.beginTransition);
  const bases = getAllBases();
  const current = bases.find(b => b.type === baseType)!;

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-2 py-1 rounded border border-panel-border group-hover:border-cyan/30 transition-colors bg-panel/50 cursor-pointer select-none">
        <span className="font-mono text-[10px] tracking-widest text-text-dim">{current.subtitle}</span>
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-cyan" style={{ textShadow: '0 0 20px currentColor' }}>
          {current.name}
        </span>
        <span className="text-text-dim text-[10px]">&#9662;</span>
      </div>
      {/* Invisible bridge so hover doesn't break between trigger and dropdown */}
      <div className="absolute top-full left-0 h-1 w-full" />
      <div className="absolute top-[calc(100%+4px)] left-0 hidden group-hover:block z-50">
        <div className="bg-panel border border-panel-border rounded shadow-lg py-1 min-w-[200px]">
          {bases.map(base => (
            <button
              key={base.type}
              onClick={() => base.type !== baseType ? beginTransition(base.type) : undefined}
              className={`w-full px-3 py-2 text-left font-mono text-xs flex items-center gap-3 transition-colors ${
                base.type === baseType ? 'text-cyan bg-cyan/[0.06]' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-[10px] tracking-widest text-text-dim w-8">{base.subtitle.toUpperCase()}</span>
              <span className="tracking-[0.15em]">{base.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
