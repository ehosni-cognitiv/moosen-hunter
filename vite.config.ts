import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/moosen-hunter/, so assets need the
  // repo name as their base path.
  base: '/moosen-hunter/',
  plugins: [react()],
  // Force a single copy of React/React-DOM/Three so React Three Fiber's
  // reconciler shares the same instance as the app — otherwise hooks called
  // inside <Canvas> fail with "Invalid hook call".
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
})
