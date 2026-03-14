/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:4000';
  const workspaceRoot = resolve(__dirname, '../..');
  const sharedPath = resolve(__dirname, '../../shared');

  return {
    plugins: [react(), legacy()],
    resolve: {
      alias: [
        {
          find: /^@inspectos\/domains\/(.+)$/,
          replacement: resolve(__dirname, "../../packages/domains/$1/index.ts"),
        },
        {
          find: /^@inspectos\/platform\/(.+)$/,
          replacement: resolve(__dirname, "../../packages/platform/$1/index.ts"),
        },
      ],
    },
    server: {
      fs: {
        allow: [workspaceRoot, sharedPath],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
