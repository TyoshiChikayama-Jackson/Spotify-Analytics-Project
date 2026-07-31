import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/spotify-analytics-dashboard/',
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true, // fail instead of silently picking a new port
  },
})
