import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Electron loads the built files straight off disk with loadFile, so every
  // asset reference has to be relative — an absolute /assets/… path resolves
  // to the filesystem root and the window comes up blank.
  base: './',
  server: { port: 5273, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        display: resolve(__dirname, 'display.html'),
      },
    },
  },
})
