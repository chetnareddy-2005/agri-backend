import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/agri-backend/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})