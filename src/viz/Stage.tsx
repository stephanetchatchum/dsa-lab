import { useId, type JSX } from 'react';
import type { CellP, Role, Scene } from '../types';
import { useSettings } from '../state/settings';
import { useTweenScene, type LivePrim } from './tween';
import { fitBox, type Box } from './bounds';
import { useMemo } from 'react';

/** Role -> CSS colour. CSS variables switch with the theme. */
export const roleColor = (r?: Role) => `var(--${r && r !== 'default' ? r : 'default'})`;

const CELL_W = 96;
const CELL_H = 66;

function cellSize(c: CellP) {
  const shape = c.shape ?? 'box';
  const w = c.w ?? (shape === 'node' ? 120 : shape === 'circle' ? 70 : CELL_W);
  const h = c.h ?? (shape === 'circle' ? w : CELL_H);
  return { w, h, shape };
}

/** Point on the border of a cell in the direction of (tx,ty). */
function border(c: CellP, tx: number, ty: number) {
  const { w, h, shape } = cellSize(c);
  const dx = tx - c.x;
  const dy = ty - c.y;
  const len = Math.hypot(dx, dy) || 1;
  if (shape === 'circle') return { x: c.x + (dx / len) * (w / 2), y: c.y + (dy / len) * (w / 2) };
  const s = Math.min(w / 2 / Math.abs(dx || 1e-6), h / 2 / Math.abs(dy || 1e-6));
  return { x: c.x + dx * s, y: c.y + dy * s };
}

function arrowHead(x: number, y: number, ang: number, size: number, filled: boolean, color: string, key: string) {
  const a1 = ang + Math.PI - 0.5;
  const a2 = ang + Math.PI + 0.5;
  const p1 = [x + Math.cos(a1) * size, y + Math.sin(a1) * size];
  const p2 = [x + Math.cos(a2) * size, y + Math.sin(a2) * size];
  return filled ? (
    <path key={key} d={`M${p1[0]},${p1[1]} L${x},${y} L${p2[0]},${p2[1]} Z`} fill={color} />
  ) : (
    <path key={key} d={`M${p1[0]},${p1[1]} L${x},${y} L${p2[0]},${p2[1]}`} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
  );
}

export function Stage({ scene, ms = 600, label, box }: { scene: Scene; ms?: number; label?: string; box?: Box }) {
  const live = useTweenScene(scene, ms);
  const own = useMemo(() => (box ? undefined : fitBox([scene])), [scene, box]);
  const vb = box ?? own ?? [0, 0, scene.w ?? 1000, scene.h ?? 440];
  const { theme } = useSettings();
  const fid = useId().replace(/:/g, '');
  const chalk = theme === 'chalk';
  const blocks = theme === 'blocks';
  const handFont = blocks ? 'var(--font-block)' : 'var(--font-hand)';
  const chalkF = blocks ? undefined : `url(#c${fid})`;
  const cellF = chalk ? `url(#c${fid})` : undefined;

  const cells = new Map<string, CellP>();
  for (const p of live.prims) if (p.kind === 'cell') cells.set(p.id, p);
  /** things a pointer can point at: cells, and bars (by their top edge) */
  const targets = new Map<string, { x: number; y: number; h: number }>();
  for (const p of live.prims) {
    if (p.kind === 'cell') targets.set(p.id, { x: p.x, y: p.y, h: cellSize(p).h });
    if (p.kind === 'bar') targets.set(p.id, { x: p.x, y: p.y - p.h / 2, h: p.h + 2 });
  }

  const layers: Record<string, JSX.Element[]> = { back: [], edge: [], body: [], top: [] };

  for (const p of live.prims as LivePrim[]) {
    const o = p._o;
    if (o <= 0.01) continue;
    const col = roleColor(p.role);
    switch (p.kind) {
      case 'region': {
        layers.back.push(
          <g key={p.id} opacity={o}>
            <rect x={p.x - p.w / 2} y={p.y - p.h / 2} width={p.w} height={p.h} rx={blocks ? 12 : 6}
              fill={col} fillOpacity={0.08} stroke={col} strokeWidth={p.glow ? 4 : 2.5}
              strokeDasharray={p.dashed ? '8 8' : undefined} filter={chalkF} />
            {p.label && (
              <text x={p.x - p.w / 2 + 10} y={p.y - p.h / 2 + 28} fill={col} fontSize={26} fontFamily={handFont} fontWeight={700}>{p.label}</text>
            )}
          </g>,
        );
        break;
      }
      case 'line': {
        const ang = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
        layers.back.push(
          <g key={p.id} opacity={o} filter={chalkF}>
            <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={col} strokeWidth={p.width ?? 3}
              strokeDasharray={p.dashed ? '6 10' : undefined} strokeLinecap="round" />
            {p.arrow && arrowHead(p.x2, p.y2, ang, 14, blocks, col, 'h')}
            {p.label && (
              <text x={(p.x1 + p.x2) / 2} y={(p.y1 + p.y2) / 2 - 10} fill={col} fontSize={24} textAnchor="middle" fontFamily={handFont}>{p.label}</text>
            )}
          </g>,
        );
        break;
      }
      case 'path': {
        const d = p.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
        layers.back.push(
          <path key={p.id} d={d} opacity={o} fill="none" stroke={col} strokeWidth={p.width ?? 4}
            strokeDasharray={p.dashed ? '6 10' : undefined} strokeLinecap="round" strokeLinejoin="round" filter={chalkF} />,
        );
        break;
      }
      case 'edge': {
        const a = cells.get(p.from);
        const b = cells.get(p.to);
        if (!a || !b) break;
        const sa = cellSize(a);
        // start: pointer slot for list nodes, else border
        let s = sa.shape === 'node' ? { x: a.x + sa.w / 2 - 20, y: a.y } : border(a, b.x, b.y);
        const curve = p.curve ?? 0;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const nx = -(b.y - a.y) / (dist || 1);
        const ny = (b.x - a.x) / (dist || 1);
        const cx = mx + nx * curve * dist * 0.5;
        const cy = my + ny * curve * dist * 0.5;
        const e = border(b, curve ? cx : s.x, curve ? cy : s.y);
        if (sa.shape !== 'node') s = border(a, curve ? cx : b.x, curve ? cy : b.y);
        const ang = curve ? Math.atan2(e.y - cy, e.x - cx) : Math.atan2(e.y - s.y, e.x - s.x);
        const end = { x: e.x - Math.cos(ang) * 4, y: e.y - Math.sin(ang) * 4 };
        const d = curve ? `M${s.x},${s.y} Q${cx},${cy} ${end.x},${end.y}` : `M${s.x},${s.y} L${end.x},${end.y}`;
        const ecol = p.role ? col : 'var(--text)';
        const directed = p.directed !== false;
        layers.edge.push(
          <g key={p.id} opacity={o * (p.dashed ? 0.6 : 1)}>
            {blocks && !p.dashed && <path d={d} fill="none" stroke="var(--ink)" strokeWidth={p.glow ? 14 : 11} strokeLinecap="round" />}
            <g filter={chalkF}>
              <path d={d} fill="none" stroke={ecol} strokeWidth={blocks ? (p.glow ? 8 : 5) : p.glow ? 5 : 3.5}
                strokeDasharray={p.dashed ? '4 12' : undefined} strokeLinecap="round" />
              {directed && arrowHead(end.x, end.y, ang, blocks ? 16 : 15, blocks, ecol, 'h')}
            </g>
            {sa.shape === 'node' && <circle cx={s.x} cy={s.y} r={6} fill={blocks || !chalk ? 'var(--ink)' : ecol} />}
            {p.label && (
              <text x={curve ? cx : (s.x + e.x) / 2} y={(curve ? cy : (s.y + e.y) / 2) - 12} fill={ecol} fontSize={24}
                textAnchor="middle" fontFamily={handFont} fontWeight={700}>{p.label}</text>
            )}
          </g>,
        );
        break;
      }
      case 'bar': {
        const fill = p.role ? col : 'var(--default)';
        layers.body.push(
          <g key={p.id} opacity={o}>
            {!chalk && <rect x={p.x - p.w / 2 + 5} y={p.y - p.h + 5} width={p.w} height={p.h} rx={6} fill="var(--ink)" />}
            <rect x={p.x - p.w / 2} y={p.y - p.h} width={p.w} height={Math.max(p.h, 0)} rx={6}
              fill={chalk ? 'none' : fill} stroke={chalk ? fill : 'var(--ink)'} strokeWidth={chalk ? 3 : 3} filter={cellF} />
            {p.value !== undefined && (
              <text x={p.x} y={p.y - p.h - 10} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--text)" fontFamily="var(--font-block)">{p.value}</text>
            )}
            {p.sub && <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize={20} fill="var(--dim)" fontFamily={handFont}>{p.sub}</text>}
          </g>,
        );
        break;
      }
      case 'cell': {
        const { w, h, shape } = cellSize(p);
        const fill = p.role ? col : 'var(--default)';
        const x = p.x - w / 2;
        const y = p.y - h / 2;
        const val = p.value === undefined ? '' : String(p.value);
        const room = (shape === 'node' ? w - 40 : w) - 14;
        const fs = Math.max(13, Math.min(val.length > 4 ? 22 : val.length > 2 ? 28 : 34, room / (0.62 * Math.max(1, val.length)), h * 0.55));
        const textX = shape === 'node' ? x + (w - 40) / 2 : p.x;
        const solid = !chalk;
        const g = p.glow;
        layers.body.push(
          <g key={p.id} opacity={o}>
            {g && !chalk && (shape === 'circle'
              ? <circle cx={p.x} cy={p.y} r={w / 2 + 10} fill={fill} opacity={0.25} />
              : <rect x={x - 9} y={y - 9} width={w + 18} height={h + 18} rx={18} fill={fill} opacity={0.25} />)}
            <g filter={cellF}>
              {shape === 'circle' ? (
                <>
                  {solid && <circle cx={p.x + 5} cy={p.y + 5} r={w / 2} fill="var(--ink)" />}
                  <circle cx={p.x} cy={p.y} r={w / 2} fill={solid ? fill : 'none'} stroke={solid ? 'var(--ink)' : fill} strokeWidth={chalk ? (g ? 5 : 3.5) : 3} />
                </>
              ) : (
                <>
                  {solid && <rect x={x + 6} y={y + 6} width={w} height={h} rx={12} fill="var(--ink)" />}
                  <rect x={x} y={y} width={w} height={h} rx={12} fill={solid ? fill : 'none'} stroke={solid ? 'var(--ink)' : fill} strokeWidth={chalk ? (g ? 5 : 3.5) : 3} />
                  {shape === 'node' && (solid
                    ? <rect x={x + w - 40} y={y + 3} width={37} height={h - 6} rx={8} fill="var(--ink)" opacity={0.16} />
                    : <line x1={x + w - 40} y1={y + 2} x2={x + w - 40} y2={y + h - 2} stroke={fill} strokeWidth={3} />)}
                </>
              )}
            </g>
            <text x={textX} y={p.y + fs * 0.36} textAnchor="middle" fontSize={chalk ? fs * 1.15 : fs} fontWeight={800}
              fill={solid ? 'var(--node-text)' : 'var(--text)'} fontFamily={chalk ? 'var(--font-hand)' : 'var(--font-block)'}>{val}</text>
            {p.sub && <text x={p.x} y={y + h + 26} textAnchor="middle" fontSize={20} fill="var(--dim)" fontFamily={handFont}>{p.sub}</text>}
            {p.sup && <text x={p.x} y={y - 12} textAnchor="middle" fontSize={20} fill="var(--dim)" fontFamily={handFont}>{p.sup}</text>}
          </g>,
        );
        break;
      }
      case 'dot': {
        const r = p.r ?? 9;
        layers.body.push(
          <g key={p.id} opacity={o}>
            {!chalk && <circle cx={p.x + 3} cy={p.y + 3} r={r} fill="var(--ink)" />}
            <circle cx={p.x} cy={p.y} r={p.glow ? r + 4 : r} fill={p.role ? col : 'var(--text)'} stroke={chalk ? undefined : 'var(--ink)'} strokeWidth={2} />
            {p.label && <text x={p.x + r + 6} y={p.y - r} fontSize={22} fill={p.role ? col : 'var(--text)'} fontFamily={handFont}>{p.label}</text>}
          </g>,
        );
        break;
      }
      case 'pointer': {
        const c = targets.get(p.target);
        if (!c) break;
        const h = c.h;
        const slot = p.slot ?? 0;
        const top = (p.side ?? 'top') === 'top';
        const edgeY = top ? c.y - h / 2 - 8 : c.y + h / 2 + 8;
        if (blocks) {
          const ty = top ? edgeY - 30 - slot * 44 : edgeY + 30 + slot * 44;
          const tw = Math.max(64, p.text.length * 13 + 26);
          layers.top.push(
            <g key={p.id} opacity={o} transform={`translate(${c.x},${ty}) rotate(${slot % 2 ? 3 : -3})`}>
              <rect x={-tw / 2 + 3} y={-17 + 3} width={tw} height={34} rx={9} fill="var(--ink)" />
              <rect x={-tw / 2} y={-17} width={tw} height={34} rx={9} fill={col} stroke="var(--ink)" strokeWidth={3} />
              <text y={7} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--ink)" fontFamily="var(--font-block)">{p.text}</text>
            </g>,
          );
        } else {
          const ty = top ? edgeY - 50 - slot * 40 : edgeY + 60 + slot * 40;
          const ay1 = top ? ty + 10 : ty - 34;
          layers.top.push(
            <g key={p.id} opacity={o} filter={chalkF}>
              <text x={c.x} y={ty} textAnchor="middle" fontSize={34} fill={col} fontFamily="var(--font-hand)" fontWeight={700}>{p.text}</text>
              <path d={`M${c.x - 4},${ay1} Q${c.x + 6},${(ay1 + edgeY) / 2} ${c.x},${edgeY}`} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" />
              {arrowHead(c.x, edgeY, top ? Math.PI / 2 : -Math.PI / 2, 13, false, col, 'h')}
            </g>,
          );
        }
        break;
      }
      case 'text': {
        const hand = p.hand ?? true;
        layers.top.push(
          <text key={p.id} x={p.x} y={p.y} opacity={o} textAnchor={p.anchor ?? 'middle'} fontSize={p.size ?? (hand ? 30 : 22)}
            fill={p.role ? col : 'var(--text)'} fontFamily={hand ? handFont : 'var(--font-body)'} fontWeight={hand ? 700 : 600}
            filter={hand ? chalkF : undefined}>{p.text}</text>,
        );
        break;
      }
      case 'icon': {
        layers.top.push(
          <text key={p.id} x={p.x} y={p.y} opacity={o} textAnchor="middle" dominantBaseline="central" fontSize={p.size ?? 56}>{p.emoji}</text>,
        );
        break;
      }
    }
  }

  return (
    <div className="stage">
      <svg viewBox={vb.join(' ')} role="img" aria-label={label ?? 'Animated diagram'} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id={`c${fid}`} filterUnits="userSpaceOnUse" x={-3000} y={-3000} width={8000} height={8000}>
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={3} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={3} />
          </filter>
        </defs>
        {layers.back}
        {layers.edge}
        {layers.body}
        {layers.top}
      </svg>
    </div>
  );
}
