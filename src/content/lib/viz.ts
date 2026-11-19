/* Helpers for writing topic animations. Pure functions: safe to run in Node. */
import type { BarP, CellP, Cost, EdgeP, Frame, LineP, PointerP, Prim, RegionP, Role, Scene, TextP } from '../../types';

export const W = 1000;
export const H = 440;

export const cell = (id: string, x: number, y: number, value?: string | number, o: Partial<CellP> = {}): CellP => ({
  kind: 'cell',
  id,
  x,
  y,
  value,
  ...o,
});
export const edge = (from: string, to: string, o: Partial<EdgeP> = {}): EdgeP => ({
  kind: 'edge',
  id: o.id ?? `e:${from}>${to}`,
  from,
  to,
  ...o,
});
export const ptr = (text: string, target: string, role: Role, o: Partial<PointerP> = {}): PointerP => ({
  kind: 'pointer',
  id: o.id ?? `p:${text}`,
  text,
  target,
  role,
  ...o,
});
export const txt = (id: string, x: number, y: number, text: string, o: Partial<TextP> = {}): TextP => ({
  kind: 'text',
  id,
  x,
  y,
  text,
  ...o,
});
export const bar = (id: string, x: number, h: number, o: Partial<BarP> = {}): BarP => ({
  kind: 'bar',
  id,
  x,
  y: o.y ?? 380,
  w: o.w ?? 46,
  h,
  ...o,
});
export const region = (id: string, x: number, y: number, w: number, h: number, o: Partial<RegionP> = {}): RegionP => ({
  kind: 'region',
  id,
  x,
  y,
  w,
  h,
  ...o,
});
export const line = (id: string, x1: number, y1: number, x2: number, y2: number, o: Partial<LineP> = {}): LineP => ({
  kind: 'line',
  id,
  x1,
  y1,
  x2,
  y2,
  ...o,
});
export const icon = (id: string, x: number, y: number, emoji: string, size = 64): Prim => ({ kind: 'icon', id, x, y, emoji, size });

export const scene = (prims: Prim[], w = W, h = H): Scene => ({ prims, w, h });

/** x positions for n items centred in width W. */
export function spread(n: number, gap = 110, cx = W / 2): number[] {
  const start = cx - ((n - 1) * gap) / 2;
  return Array.from({ length: n }, (_, i) => start + i * gap);
}

/** A row of array cells a[0..n) with ids `${prefix}${i}` and index labels. */
export function arrayRow(
  values: (string | number)[],
  o: { y?: number; gap?: number; prefix?: string; roles?: Record<number, Role>; w?: number; cx?: number; idx?: boolean; glow?: number[] } = {},
): CellP[] {
  const gap = o.gap ?? 100;
  const xs = spread(values.length, gap, o.cx);
  return values.map((v, i) =>
    cell(`${o.prefix ?? 'a'}${i}`, xs[i], o.y ?? 220, v, {
      w: o.w ?? Math.min(86, gap - 10),
      role: o.roles?.[i],
      sub: o.idx === false ? undefined : String(i),
      glow: o.glow?.includes(i),
    }),
  );
}

/** Build frames step by step. */
export class Frames {
  list: Frame[] = [];
  add(prims: Prim[], say: string, extra: Partial<Frame> = {}) {
    this.list.push({ scene: scene(prims), say, ...extra });
    return this;
  }
  get() {
    return this.list;
  }
}

export const cost = (op: string, time: string, space?: string): Cost => ({ op, time, space });

/** Linked list helpers */
export interface LLNode {
  id: string;
  v: number;
}
export function listPrims(
  nodes: LLNode[],
  o: { y?: number; gap?: number; roles?: Record<string, Role>; noneId?: string; x0?: number; skipEdge?: string[] } = {},
): Prim[] {
  const gap = o.gap ?? 175;
  const xs = o.x0 !== undefined ? nodes.map((_, i) => o.x0! + i * gap) : spread(nodes.length + 1, gap);
  const y = o.y ?? 210;
  const out: Prim[] = [];
  nodes.forEach((n, i) => {
    out.push(cell(n.id, xs[i], y, n.v, { shape: 'node', role: o.roles?.[n.id] }));
  });
  const noneX = xs[nodes.length] ?? xs[xs.length - 1] + gap;
  out.push(cell(o.noneId ?? 'none', noneX, y, 'None', { w: 92, role: 'muted' }));
  nodes.forEach((n, i) => {
    const to = nodes[i + 1]?.id ?? o.noneId ?? 'none';
    if (!o.skipEdge?.includes(n.id)) out.push(edge(n.id, to));
  });
  return out;
}
