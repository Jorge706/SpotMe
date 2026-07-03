import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
      proxy: {
      '/user-api': {
        target: 'https://spotme.jafetguzman.me/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/user-api/, 'users/api/'),
      },
      '/tracking-api': {
        target: 'https://spotme.jafetguzman.me/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tracking-api/, 'tracking/api/'),
      }
    }
  },
})
