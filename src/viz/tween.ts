import { useEffect, useRef, useState } from 'react';
import type { Prim, Scene } from '../types';

/** A primitive plus its current opacity during a transition. */
export type LivePrim = Prim & { _o: number };
export interface LiveScene {
  prims: LivePrim[];
  w: number;
  h: number;
}

const NUM_KEYS = ['x', 'y', 'w', 'h', 'x1', 'y1', 'x2', 'y2', 'r', 'size', 'curve'] as const;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function staticScene(s: Scene): LiveScene {
  return { prims: s.prims.map((p) => ({ ...p, _o: p.opacity ?? 1 })), w: s.w ?? 1000, h: s.h ?? 440 };
}

/** Blend two scenes, matching primitives by id. */
export function blend(from: LiveScene, to: Scene, raw: number): LiveScene {
  const t = ease(Math.min(1, Math.max(0, raw)));
  const prev = new Map(from.prims.map((p) => [p.id, p]));
  const out: LivePrim[] = [];
  const seen = new Set<string>();
  for (const p of to.prims) {
    seen.add(p.id);
    const q = prev.get(p.id);
    const target = p.opacity ?? 1;
    if (q && q.kind === p.kind) {
      const n: any = { ...p, _o: lerp(q._o, target, t) };
      for (const k of NUM_KEYS) {
        const a = (q as any)[k];
        const b = (p as any)[k];
        if (typeof a === 'number' && typeof b === 'number') n[k] = lerp(a, b, t);
      }
      if (p.kind === 'path' && q.kind === 'path' && p.points.length === q.points.length) {
        n.points = p.points.map(([x, y], i) => [lerp(q.points[i][0], x, t), lerp(q.points[i][1], y, t)]);
      }
      out.push(n);
    } else {
      out.push({ ...p, _o: target * t } as LivePrim);
    }
  }
  // fading out
  for (const q of from.prims) {
    if (!seen.has(q.id) && q._o > 0.01) out.push({ ...q, _o: q._o * (1 - t) });
  }
  return { prims: out, w: to.w ?? 1000, h: to.h ?? 440 };
}

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Animate towards `scene` whenever it changes. */
export function useTweenScene(scene: Scene, ms = 600): LiveScene {
  const [live, setLive] = useState<LiveScene>(() => staticScene(scene));
  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => {
    const from = liveRef.current;
    if (reduced() || ms <= 0) {
      setLive(staticScene(scene));
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / ms;
      setLive(blend(from, scene, t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  return live;
}
