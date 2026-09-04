import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 1337, host: '0.0.0.0', allowedHosts: 'all' },
  preview: { port: 1337, host: '0.0.0.0', allowedHosts: 'all' },
})
