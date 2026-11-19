import type { ProgressDoc, ProgressStore } from './types';

const KEY = 'dsa-lab:progress';

export const localStore: ProgressStore = {
  kind: 'local',
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ProgressDoc) : null;
    } catch {
      return null;
    }
  },
  async save(doc) {
    try {
      localStorage.setItem(KEY, JSON.stringify(doc));
    } catch {
      /* storage full or blocked */
    }
  },
};
