import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { createReadStream, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

/*
  Python (Pyodide) is bundled into the site instead of loaded from a CDN,
  so the code editor and tests work offline once the site has been opened.
*/
const require = createRequire(import.meta.url);
const PYODIDE_DIR = dirname(require.resolve('pyodide/package.json'));
const PY_FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const TYPES: Record<string, string> = { mjs: 'text/javascript', wasm: 'application/wasm', zip: 'application/zip', json: 'application/json' };

function pyodideAssets(): Plugin {
  return {
    name: 'pyodide-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/\/pyodide\/([^?#]+)/);
        if (!m || !PY_FILES.includes(m[1])) return next();
        const file = join(PYODIDE_DIR, m[1]);
        if (!existsSync(file)) return next();
        res.setHeader('Content-Type', TYPES[m[1].split('.').pop()!] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      for (const f of PY_FILES) this.emitFile({ type: 'asset', fileName: `pyodide/${f}`, source: readFileSync(join(PYODIDE_DIR, f)) });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    pyodideAssets(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'DSA Lab',
        short_name: 'DSA Lab',
        description: 'Learn data structures & algorithms by watching, listening, writing and building.',
        theme_color: '#1e2b28',
        background_color: '#1e2b28',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // everything the app needs, including Python and the fonts, is saved on first visit
        globPatterns: ['**/*.{js,mjs,css,html,woff2,wasm,zip,json,png,svg}'],
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*', '**/*greek*'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1600 },
});
