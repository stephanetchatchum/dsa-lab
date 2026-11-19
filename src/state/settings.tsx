import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'mix' | 'chalk' | 'blocks';
export interface Settings {
  theme: Theme;
  /** speak each animation step automatically */
  narrate: boolean;
  rate: number;
  voice: string;
  skipCode: boolean;
  focus: boolean;
  scale: number;
  /** animation speed multiplier */
  speed: number;
  /** must write before Next unlocks on writing steps */
  requireWriting: boolean;
}

const KEY = 'dsa-lab:settings';
const DEFAULTS: Settings = {
  theme: 'mix',
  narrate: true,
  rate: 1,
  voice: '',
  skipCode: true,
  focus: false,
  scale: 1,
  speed: 1,
  requireWriting: true,
};

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

interface Ctx extends Settings {
  set: (patch: Partial<Settings>) => void;
}
const SettingsCtx = createContext<Ctx>({ ...DEFAULTS, set: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* private mode: ignore */
    }
    const html = document.documentElement;
    html.dataset.theme = s.theme;
    html.classList.toggle('focus', s.focus);
    html.style.setProperty('--scale', String(s.scale));
  }, [s]);
  return (
    <SettingsCtx.Provider value={{ ...s, set: (p) => setS((o) => ({ ...o, ...p })) }}>{children}</SettingsCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);
