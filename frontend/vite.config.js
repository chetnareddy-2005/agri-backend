import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/agri-supply-chain-dashboard/app/',
  plugins: [react()],
  build: {
    outDir: 'dist/app',
  }
})