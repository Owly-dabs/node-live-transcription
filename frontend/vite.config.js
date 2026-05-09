import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Load mkcert certs when present so the dev server can serve HTTPS.
// HTTPS is required for getUserMedia on non-localhost origins (e.g. iPad on LAN).
// Generate with:
//   mkcert -install
//   mkdir -p frontend/certs && cd frontend/certs
//   mkcert 192.168.1.29 localhost 127.0.0.1
//   mv 192.168.1.29+2.pem cert.pem && mv 192.168.1.29+2-key.pem key.pem
function loadHttps() {
  const dir = path.resolve(import.meta.dirname, 'certs');
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }
  return undefined;
}

const httpsConfig = loadHttps();
if (httpsConfig) {
  console.log('[vite] HTTPS enabled via certs/key.pem + certs/cert.pem');
}

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 8080,
    strictPort: true,
    open: false,
    host: true,
    https: httpsConfig,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8081',
        changeOrigin: true,
        ws: true
      }
    }
  },
  preview: {
    port: 4173,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
