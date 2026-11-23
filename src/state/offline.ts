import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/*
  Offline support. On the first online visit the service worker saves the whole app
  (pages, lessons, animations, fonts and Python) on this device. After that the site
  opens and works with no connection. New versions download automatically when online.
*/
type OfflineState = { ready: boolean; online: boolean; updating: boolean };
let state: OfflineState = {
  ready: typeof localStorage !== 'undefined' && localStorage.getItem('dsa-lab:offline-ready') === '1',
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  updating: false,
};
const subs = new Set<(s: OfflineState) => void>();
const set = (p: Partial<OfflineState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f(state));
};

export function registerOffline() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      try {
        localStorage.setItem('dsa-lab:offline-ready', '1');
      } catch {
        /* ignore */
      }
      set({ ready: true });
    },
    onRegisteredSW(_url, reg) {
      // a controlling worker means the app shell is already cached
      if (navigator.serviceWorker.controller) set({ ready: true });
      // check for new lessons now and then while online
      if (reg) window.setInterval(() => navigator.onLine && reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
  window.addEventListener('online', () => set({ online: true }));
  window.addEventListener('offline', () => set({ online: false }));
}

export function useOffline(): OfflineState {
  const [s, setS] = useState(state);
  useEffect(() => {
    subs.add(setS);
    return () => void subs.delete(setS);
  }, []);
  return s;
}
