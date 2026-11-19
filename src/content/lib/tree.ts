/* Tree helpers for animations (binary trees, BSTs, heaps, tries, recursion trees). */
import type { Prim, Role } from '../../types';
import { cell, edge } from './viz';

export interface BNode {
  id: string;
  v: number | string;
  left: BNode | null;
  right: BNode | null;
}
export interface GNode {
  id: string;
  v: number | string;
  kids: GNode[];
}

export type Pos = Map<string, { x: number; y: number }>;

/** Binary tree: x by in-order position, y by depth. Keeps BSTs readable. */
export function layoutBinary(root: BNode | null, o: { x0?: number; x1?: number; y0?: number; dy?: number } = {}): Pos {
  const order: { n: BNode; d: number }[] = [];
  const walk = (n: BNode | null, d: number) => {
    if (!n) return;
    walk(n.left, d + 1);
    order.push({ n, d });
    walk(n.right, d + 1);
  };
  walk(root, 0);
  const x0 = o.x0 ?? 80;
  const x1 = o.x1 ?? 920;
  const step = order.length > 1 ? Math.min(110, (x1 - x0) / (order.length - 1)) : 0;
  const mid = (x0 + x1) / 2;
  const start = mid - (step * (order.length - 1)) / 2;
  const pos: Pos = new Map();
  order.forEach(({ n, d }, i) => pos.set(n.id, { x: start + i * step, y: (o.y0 ?? 70) + d * (o.dy ?? 90) }));
  return pos;
}

/** General tree: leaves spread evenly, parents centred over their children. */
export function layoutTree(root: GNode, o: { x0?: number; x1?: number; y0?: number; dy?: number } = {}): Pos {
  const leaves: GNode[] = [];
  const findLeaves = (n: GNode) => (n.kids.length ? n.kids.forEach(findLeaves) : leaves.push(n));
  findLeaves(root);
  const x0 = o.x0 ?? 80;
  const x1 = o.x1 ?? 920;
  const step = leaves.length > 1 ? Math.min(120, (x1 - x0) / (leaves.length - 1)) : 0;
  const start = (x0 + x1) / 2 - (step * (leaves.length - 1)) / 2;
  const pos: Pos = new Map();
  let li = 0;
  const place = (n: GNode, d: number): number => {
    const y = (o.y0 ?? 60) + d * (o.dy ?? 80);
    if (!n.kids.length) {
      const x = start + li++ * step;
      pos.set(n.id, { x, y });
      return x;
    }
    const xs = n.kids.map((k) => place(k, d + 1));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    pos.set(n.id, { x, y });
    return x;
  };
  place(root, 0);
  return pos;
}

export function binaryPrims(
  root: BNode | null,
  pos: Pos,
  o: { roles?: Record<string, Role>; glow?: string[]; r?: number; edgeRoles?: Record<string, Role> } = {},
): Prim[] {
  const out: Prim[] = [];
  const walk = (n: BNode | null) => {
    if (!n) return;
    const p = pos.get(n.id)!;
    out.push(cell(n.id, p.x, p.y, n.v, { shape: 'circle', w: o.r ?? 62, role: o.roles?.[n.id], glow: o.glow?.includes(n.id) }));
    for (const c of [n.left, n.right]) if (c) out.push(edge(n.id, c.id, { directed: false, role: o.edgeRoles?.[c.id] }));
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  return out;
}

export function treePrims(
  root: GNode,
  pos: Pos,
  o: { roles?: Record<string, Role>; glow?: string[]; r?: number; labels?: Record<string, string>; edgeRoles?: Record<string, Role>; shape?: 'circle' | 'box'; w?: number } = {},
): Prim[] {
  const out: Prim[] = [];
  const walk = (n: GNode) => {
    const p = pos.get(n.id)!;
    out.push(
      cell(n.id, p.x, p.y, n.v, {
        shape: o.shape ?? 'circle',
        w: o.w ?? o.r ?? 56,
        h: o.shape === 'box' ? 46 : undefined,
        role: o.roles?.[n.id],
        glow: o.glow?.includes(n.id),
        sub: o.labels?.[n.id],
      }),
    );
    for (const k of n.kids) {
      out.push(edge(n.id, k.id, { directed: false, role: o.edgeRoles?.[k.id] }));
      walk(k);
    }
  };
  walk(root);
  return out;
}

/* ---- BST utilities (pure, ids stable by value) ---- */
export const bnode = (v: number): BNode => ({ id: `n${v}`, v, left: null, right: null });
export function bstInsert(root: BNode | null, v: number): BNode {
  if (!root) return bnode(v);
  if (v < (root.v as number)) root.left = bstInsert(root.left, v);
  else if (v > (root.v as number)) root.right = bstInsert(root.right, v);
  return root;
}
export function bstFrom(vals: number[]): BNode | null {
  let r: BNode | null = null;
  for (const v of vals) r = bstInsert(r, v);
  return r;
}
export function cloneB(n: BNode | null): BNode | null {
  return n ? { ...n, left: cloneB(n.left), right: cloneB(n.right) } : null;
}
export function inorder(n: BNode | null, out: BNode[] = []): BNode[] {
  if (n) {
    inorder(n.left, out);
    out.push(n);
    inorder(n.right, out);
  }
  return out;
}
export function height(n: BNode | null): number {
  return n ? 1 + Math.max(height(n.left), height(n.right)) : 0;
}

/** Heap stored as array -> binary tree nodes with ids by slot content id. */
export function heapPrims(arr: { id: string; v: number }[], o: { roles?: Record<string, Role>; glow?: string[]; y0?: number; cx?: number; width?: number; dy?: number } = {}): Prim[] {
  const out: Prim[] = [];
  const width = o.width ?? 640;
  const cx = o.cx ?? 500;
  arr.forEach((e, i) => {
    const d = Math.floor(Math.log2(i + 1));
    const first = 2 ** d - 1;
    const count = 2 ** d;
    const slotW = width / count;
    const x = cx - width / 2 + slotW * (i - first + 0.5);
    const y = (o.y0 ?? 70) + d * (o.dy ?? 82);
    out.push(cell(e.id, x, y, e.v, { shape: 'circle', w: 58, role: o.roles?.[e.id], glow: o.glow?.includes(e.id) }));
    if (i > 0) out.push(edge(arr[Math.floor((i - 1) / 2)].id, e.id, { directed: false, id: `he${i}` }));
  });
  return out;
}
