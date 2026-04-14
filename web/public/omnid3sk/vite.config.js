import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    // ── Production build: output directly to the repo root dist/
    // so FastAPI can serve it at runtime without any manual copy step.
    build: {
        outDir: resolve(__dirname, '../../../dist'),
        emptyOutDir: true,
    },

    // ── Dev server: proxy API + WS to the local Python backend
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:8080',
                ws: true,
            }
        }
    }
});
