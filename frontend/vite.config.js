import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const srcLogo = 'C:/Users/ASUS/.gemini/antigravity/brain/6aa42937-53f4-42db-b7c0-08c86689c0ea/.user_uploaded/media_1789534422084.png';
const destLogo = path.resolve(__dirname, 'public/stroke-logo.png');

const srcDoctor = 'C:/Users/ASUS/.gemini/antigravity/brain/6aa42937-53f4-42db-b7c0-08c86689c0ea/.user_uploaded/media_1789535443025.png';
const destDoctor = path.resolve(__dirname, 'public/hero-doctor.png');

try {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (fs.existsSync(srcLogo)) fs.copyFileSync(srcLogo, destLogo);
  if (fs.existsSync(srcDoctor)) fs.copyFileSync(srcDoctor, destDoctor);
} catch (e) {
  console.warn('File copy:', e);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});

