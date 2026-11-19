import type { Prim, Scene } from '../types';

export type Box = [number, number, number, number];

/** Rough extents of a primitive (enough to frame the picture). */
function extent(p: Prim, cells: Map<string, Prim>): [number, number, number, number] | null {
  switch (p.kind) {
    case 'cell': {
      const shape = p.shape ?? 'box';
      const w = p.w ?? (shape === 'node' ? 120 : shape === 'circle' ? 70 : 96);
      const h = p.h ?? (shape === 'circle' ? w : 66);
      return [p.x - w / 2 - 6, p.y - h / 2 - (p.sup ? 34 : 6), p.x + w / 2 + 10, p.y + h / 2 + (p.sub ? 34 : 10)];
    }
    case 'pointer': {
      const t = cells.get(p.target) as any;
      if (!t) return null;
      const c = t.kind === 'bar' ? { x: t.x, y: t.y - t.h / 2, h: t.h } : t;
      const h = t.kind === 'bar' ? t.h : c.h ?? (c.shape === 'circle' ? c.w ?? 70 : 66);
      const reach = 104 + (p.slot ?? 0) * 44;
      return (p.side ?? 'top') === 'top'
        ? [c.x - 50, c.y - h / 2 - reach, c.x + 50, c.y]
        : [c.x - 50, c.y, c.x + 50, c.y + h / 2 + reach];
    }
    case 'text': {
      const size = p.size ?? 30;
      const w = p.text.length * size * 0.5;
      const a = p.anchor ?? 'middle';
      const x0 = a === 'start' ? p.x : a === 'end' ? p.x - w : p.x - w / 2;
      return [x0, p.y - size, x0 + w, p.y + size * 0.3];
    }
    case 'bar':
      return [p.x - p.w / 2, p.y - p.h - 36, p.x + p.w / 2 + 6, p.y + 34];
    case 'region':
      return [p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2];
    case 'line':
      return [Math.min(p.x1, p.x2) - 10, Math.min(p.y1, p.y2) - 30, Math.max(p.x1, p.x2) + 10, Math.max(p.y1, p.y2) + 10];
    case 'dot':
      return [p.x - 14, p.y - 30, p.x + 14 + (p.label ? p.label.length * 12 : 0), p.y + 14];
    case 'icon': {
      const s = (p.size ?? 56) / 2 + 4;
      return [p.x - s, p.y - s, p.x + s, p.y + s];
    }
    case 'path': {
      const xs = p.points.map((q) => q[0]);
      const ys = p.points.map((q) => q[1]);
      return [Math.min(...xs) - 8, Math.min(...ys) - 8, Math.max(...xs) + 8, Math.max(...ys) + 8];
    }
    default:
      return null;
  }
}

/** Union bounding box over scenes, padded, with a minimum size so small pictures don't over-zoom. */
export function fitBox(scenes: Scene[], minW = 560, minH = 260): Box | undefined {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of scenes) {
    const cells = new Map(s.prims.filter((p) => p.kind === 'cell' || p.kind === 'bar').map((p) => [p.id, p] as [string, Prim]));
    for (const p of s.prims) {
      const e = extent(p, cells);
      if (!e) continue;
      x0 = Math.min(x0, e[0]);
      y0 = Math.min(y0, e[1]);
      x1 = Math.max(x1, e[2]);
      y1 = Math.max(y1, e[3]);
    }
  }
  if (!Number.isFinite(x0)) return undefined;
  const pad = 24;
  let w = x1 - x0 + pad * 2;
  let h = y1 - y0 + pad * 2;
  let x = x0 - pad;
  let y = y0 - pad;
  if (w < minW) {
    x -= (minW - w) / 2;
    w = minW;
  }
  if (h < minH) {
    y -= (minH - h) / 2;
    h = minH;
  }
  return [x, y, w, h];
}
