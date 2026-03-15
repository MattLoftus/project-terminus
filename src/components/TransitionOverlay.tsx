import { useCallback, useEffect, useState } from 'react';
import { useSimulation } from '../store/simulation';
import { getBaseEntry } from '../data/base-registry';

type Phase = 'idle' | 'fading-out' | 'fading-in';

export function TransitionOverlay() {
  const isTransitioning = useSimulation((s) => s.isTransitioning);
  const transitionTarget = useSimulation((s) => s.transitionTarget);
  const completeTransition = useSimulation((s) => s.completeTransition);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bgColor, setBgColor] = useState('#000000');

  useEffect(() => {
    if (isTransitioning && transitionTarget) {
      const entry = getBaseEntry(transitionTarget);
      setBgColor(entry.bgColor);
      // Small delay to ensure the component renders transparent first
      requestAnimationFrame(() => {
        setPhase('fading-out');
      });
    }
  }, [isTransitioning, transitionTarget]);

  const handleTransitionEnd = useCallback(() => {
    if (phase === 'fading-out') {
      // Fully opaque — now switch the base
      completeTransition();
      // Wait a frame for the new scene to mount, then fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('fading-in');
        });
      });
    } else if (phase === 'fading-in') {
      setPhase('idle');
    }
  }, [phase, completeTransition]);

  if (phase === 'idle' && !isTransitioning) return null;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className="fixed inset-0 z-50"
      style={{
        backgroundColor: bgColor,
        opacity: phase === 'fading-out' ? 1 : 0,
        transition: 'opacity 500ms ease-in-out',
        pointerEvents: phase !== 'idle' ? 'all' : 'none',
      }}
    />
  );
}
