import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSimulation } from '../../store/simulation';
import { getBaseEntry } from '../../data/base-registry';
import { PlanetView } from './PlanetView';

const MOVE_SPEED = 4; // units per second
const FOCUS_LERP = 3; // smoothing speed for click-to-focus
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

function CameraController({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const keys = useRef<Set<string>>(new Set());
  const bookmarkOffset = useRef<[number, number, number] | null>(null);
  const { camera } = useThree();
  const focusTarget = useSimulation((s) => s.focusTarget);
  const setFocusTarget = useSimulation((s) => s.setFocusTarget);
  const baseType = useSimulation((s) => s.baseType);

  // Reset camera to overview on mount (handles return from planet view)
  // and reposition when switching bases
  const prevBase = useRef<string | null>(null);
  useEffect(() => {
    const entry = getBaseEntry(baseType);
    const bm = entry.bookmarks[0]; // Overview
    if (prevBase.current === null) {
      // First mount (or remount after planet view) — snap to overview
      camera.position.set(
        bm.target[0] + bm.offset[0],
        bm.target[1] + bm.offset[1],
        bm.target[2] + bm.offset[2],
      );
      if (controlsRef.current) {
        controlsRef.current.target.set(bm.target[0], bm.target[1], bm.target[2]);
      }
      prevBase.current = baseType;
      return;
    }
    if (prevBase.current === baseType) return;
    prevBase.current = baseType;
    setFocusTarget(bm.target);
    bookmarkOffset.current = bm.offset;
  }, [baseType, setFocusTarget, camera, controlsRef]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if ('wasdqe'.includes(key)) {
        keys.current.add(key);
      }
      const entry = getBaseEntry(baseType);
      const bookmarks = entry.bookmarks;
      const num = parseInt(e.key);
      if (num >= 1 && num <= bookmarks.length && controlsRef.current) {
        const bm = bookmarks[num - 1];
        setFocusTarget(bm.target);
        bookmarkOffset.current = bm.offset;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    const onBlur = () => keys.current.clear();

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [setFocusTarget, baseType]);

  useFrame((_, dt) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Click-to-focus: smoothly move orbit target to the clicked module
    if (focusTarget) {
      _targetPos.set(focusTarget[0], focusTarget[1], focusTarget[2]);
      const lerpFactor = 1 - Math.exp(-FOCUS_LERP * dt);

      controls.target.lerp(_targetPos, lerpFactor);

      if (bookmarkOffset.current) {
        // For bookmarks, also lerp camera position to target + offset
        const desiredCamPos = _targetPos.clone().add(new THREE.Vector3(...bookmarkOffset.current));
        camera.position.lerp(desiredCamPos, lerpFactor);
      } else {
        // For module clicks, maintain current camera offset
        const offset = camera.position.clone().sub(controls.target);
        camera.position.copy(controls.target).add(offset);
      }

      // Clear once we're close enough
      if (controls.target.distanceTo(_targetPos) < 0.01) {
        controls.target.copy(_targetPos);
        if (bookmarkOffset.current) {
          camera.position.copy(_targetPos).add(new THREE.Vector3(...bookmarkOffset.current));
          bookmarkOffset.current = null;
        }
        setFocusTarget(null);
      }
    }

    // Keyboard movement
    if (keys.current.size === 0) return;

    // Cancel any active focus animation when user moves
    if (focusTarget) setFocusTarget(null);

    const speed = MOVE_SPEED * dt;

    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();

    _right.set(-_forward.z, 0, _forward.x);

    _delta.set(0, 0, 0);

    if (keys.current.has('w')) _delta.add(_forward);
    if (keys.current.has('s')) _delta.sub(_forward);
    if (keys.current.has('d')) _delta.add(_right);
    if (keys.current.has('a')) _delta.sub(_right);
    if (keys.current.has('e')) _delta.y += 1;
    if (keys.current.has('q')) _delta.y -= 1;

    if (_delta.lengthSq() === 0) return;
    _delta.normalize().multiplyScalar(speed);

    camera.position.add(_delta);
    controls.target.add(_delta);
  });

  return null;
}

function Scene() {
  const baseType = useSimulation((s) => s.baseType);
  const viewMode = useSimulation((s) => s.viewMode);
  const activeSubview = useSimulation((s) => s.activeSubview);
  if (viewMode === 'planet') return <PlanetView />;
  const entry = getBaseEntry(baseType);
  // Check for active subview
  if (activeSubview && entry.subviews) {
    const sv = entry.subviews.find((s) => s.id === activeSubview);
    if (sv) return <sv.Scene />;
  }
  const SceneComponent = entry.Scene;
  return <SceneComponent />;
}

/** Tracks camera azimuth and calls back with the angle each frame */
function CameraAngleTracker({ onAngle }: { onAngle: (angle: number) => void }) {
  const { camera } = useThree();
  const _dir = useRef(new THREE.Vector3());

  useFrame(() => {
    camera.getWorldDirection(_dir.current);
    const azimuth = Math.atan2(_dir.current.x, _dir.current.z);
    onAngle(azimuth);
  });

  return null;
}

/** SVG compass overlay — rotates with camera */
function Compass({ angle }: { angle: number }) {
  const rotation = (-angle * 180) / Math.PI;
  const size = 56;
  const r = 22;
  const tickLen = 4;
  const labelR = r - 10;

  return (
    <div className="absolute top-4 right-4 pointer-events-none z-10">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(${rotation})`}>
          {/* Outer ring */}
          <circle r={r} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-cyan/30" />
          {/* Cardinal ticks + labels */}
          {[
            { angle: 0, label: 'N', primary: true },
            { angle: 90, label: 'E', primary: false },
            { angle: 180, label: 'S', primary: false },
            { angle: 270, label: 'W', primary: false },
          ].map(({ angle: a, label, primary }) => {
            const rad = (a * Math.PI) / 180;
            const x1 = Math.sin(rad) * r;
            const y1 = -Math.cos(rad) * r;
            const x2 = Math.sin(rad) * (r - tickLen);
            const y2 = -Math.cos(rad) * (r - tickLen);
            const lx = Math.sin(rad) * labelR;
            const ly = -Math.cos(rad) * labelR;
            return (
              <g key={label}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="currentColor"
                  strokeWidth={primary ? 1.5 : 0.8}
                  className={primary ? 'text-cyan' : 'text-text-dim'}
                />
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={primary ? 'text-cyan' : 'text-text-dim'}
                  style={{
                    fontSize: primary ? 8 : 6,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: primary ? 600 : 400,
                    fill: 'currentColor',
                  }}
                >
                  {label}
                </text>
              </g>
            );
          })}
          {/* Intermediate ticks */}
          {[45, 135, 225, 315].map((a) => {
            const rad = (a * Math.PI) / 180;
            const x1 = Math.sin(rad) * r;
            const y1 = -Math.cos(rad) * r;
            const x2 = Math.sin(rad) * (r - 2);
            const y2 = -Math.cos(rad) * (r - 2);
            return (
              <line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor" strokeWidth={0.5} className="text-text-dim" />
            );
          })}
          {/* North arrow */}
          <polygon
            points={`0,${-r + tickLen + 1} -2.5,${-r + tickLen + 6} 2.5,${-r + tickLen + 6}`}
            className="text-cyan"
            fill="currentColor"
            opacity={0.7}
          />
        </g>
        {/* Fixed center dot */}
        <circle cx={size / 2} cy={size / 2} r={1.5} className="text-cyan" fill="currentColor" opacity={0.5} />
      </svg>
    </div>
  );
}

/** Subview tabs — shown when a base has subviews */
function SubviewTabs({ entry }: { entry: ReturnType<typeof getBaseEntry> }) {
  const activeSubview = useSimulation((s) => s.activeSubview);
  const setActiveSubview = useSimulation((s) => s.setActiveSubview);
  if (!entry.subviews || entry.subviews.length === 0) return null;

  const tabs = [
    { id: null, label: entry.name },
    ...entry.subviews.map((sv) => ({ id: sv.id, label: sv.shortName })),
  ];

  return (
    <div className="absolute top-14 left-4 z-10 flex gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeSubview;
        return (
          <button
            key={tab.id ?? '__main'}
            onClick={() => setActiveSubview(tab.id)}
            className="px-2 py-0.5 font-mono text-[8px] tracking-[0.15em] rounded-sm transition-all duration-150 cursor-pointer"
            style={{
              border: `1px solid ${isActive ? 'var(--color-cyan)' : 'rgba(var(--color-cyan-rgb, 0,224,160), 0.2)'}`,
              background: isActive ? 'rgba(var(--color-cyan-rgb, 0,224,160), 0.12)' : 'rgba(11,16,24,0.5)',
              color: isActive ? 'var(--color-cyan)' : 'var(--color-text-dim)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Surface color for each body — used in the planet icon */
const BODY_COLORS: Record<string, string> = {
  moon: '#8a8a8a',
  mars: '#a04030',
  titan: '#8a5020',
  europa: '#b0b8c0',
  ceres: '#5a5550',
  venus: '#c0a060',
  phobos: '#6a6560',
};

function PlanetIcon({ active, onClick, baseType }: { active: boolean; onClick: () => void; baseType: string }) {
  const bodyColor = BODY_COLORS[baseType] ?? '#666';
  return (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
      style={{
        border: `1px solid ${active ? 'var(--color-cyan)' : 'rgba(var(--color-cyan-rgb, 0,224,160), 0.3)'}`,
        background: active ? 'rgba(var(--color-cyan-rgb, 0,224,160), 0.15)' : 'rgba(11,16,24,0.6)',
        backdropFilter: 'blur(4px)',
        boxShadow: active ? '0 0 8px rgba(var(--color-cyan-rgb, 0,224,160), 0.3)' : 'none',
      }}
      title={active ? 'Return to Base' : 'Orbital View'}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {/* Filled body disc */}
        <circle cx="9" cy="9" r="6" fill={bodyColor} opacity={active ? 0.9 : 0.5} />
        {/* Terminator shadow */}
        <path d="M 9 3 A 6 6 0 0 0 9 15" fill="rgba(0,0,0,0.4)" />
        {/* Subtle highlight */}
        <circle cx="7" cy="7" r="2" fill="rgba(255,255,255,0.12)" />
      </svg>
    </button>
  );
}

// Stable camera config — only used on Canvas mount; PlanetCamera handles planet view
const INITIAL_CAMERA = { position: [4, 12, 14] as [number, number, number], fov: 50 };

export function BaseMap() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const baseType = useSimulation((s) => s.baseType);
  const viewMode = useSimulation((s) => s.viewMode);
  const setViewMode = useSimulation((s) => s.setViewMode);
  const setActiveSubview = useSimulation((s) => s.setActiveSubview);
  const entry = getBaseEntry(baseType);
  const bgColor = entry.bgColor;
  const [compassAngle, setCompassAngle] = useState(0);
  const handleAngle = useCallback((a: number) => setCompassAngle(a), []);

  // Escape to return from planet view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'planet') {
        setViewMode('base');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode, setViewMode]);

  return (
    <div className="w-full h-full relative overflow-hidden" tabIndex={0}>
      <Canvas
        camera={INITIAL_CAMERA}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: bgColor }}
      >
        {/* Key forces clean unmount/mount — no stale Three.js objects across view switches */}
        <Scene key={viewMode} />
        {viewMode === 'base' && (
          <>
            <CameraController controlsRef={controlsRef} />
            <CameraAngleTracker onAngle={handleAngle} />
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={Math.PI / 8}
              maxDistance={50}
              minDistance={4}
              target={[4, 0, 6]}
            />
          </>
        )}
        {viewMode === 'base' && (
          <EffectComposer>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Planet view toggle */}
      {entry.PlanetScene && (
        <PlanetIcon
          active={viewMode === 'planet'}
          baseType={baseType}
          onClick={() => {
            if (viewMode === 'planet') {
              setViewMode('base');
            } else {
              setActiveSubview(null);
              setViewMode('planet');
            }
          }}
        />
      )}

      {/* Subview tabs (base view only, when subviews exist) */}
      {viewMode === 'base' && <SubviewTabs entry={entry} />}

      {/* Compass (base view only) */}
      {viewMode === 'base' && <Compass angle={compassAngle} />}

      {/* Corner bracket decorations (top-left omitted — planet icon occupies that corner) */}
      <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-cyan/20" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-cyan/20" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-cyan/20" />

      {/* Map label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] text-text-dim pointer-events-none">
        {viewMode === 'planet' ? 'ORBITAL VIEW' : 'BASE LAYOUT — OVERHEAD'}
      </div>
    </div>
  );
}
