import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // 🔧 DEV ONLY: Proxy WebSocket MQTT to local simulate.js broker
    // When simulate.js is running, the app connects without any external broker.
    proxy: {
      '/mqtt': {
        target: 'ws://localhost:8884',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser', 
    terserOptions: {
      compress: {
        drop_console: true, // 🛡️ PRODUCTION: Strip console.log to prevent telemetry & data leaks
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('framer-motion')) return 'vendor';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('recharts')) return 'charts';
            return 'vendor';
          }
        }
      },
    },
    // 🚀 PERFORMANCE: Ensure consistent asset naming for Capacitor
    assetsDir: 'assets',
    cssCodeSplit: true,
    sourcemap: false
  },
  resolve: {
    alias: {
      'react-is': 'react-is',
      '@config': path.resolve(__dirname, './config'),
    },
  },
});
