import { useEffect, useState } from 'react';

/** Minimal hash router: works on any static host with no rewrites. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export const go = (path: string) => {
  window.location.hash = '#/' + path.replace(/^\//, '');
};
export const href = (path: string) => '#/' + path.replace(/^\//, '');
