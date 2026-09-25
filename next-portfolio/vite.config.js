import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/Mike_portfolio/vite/' : '/',
  server: {
    proxy: {
      '/data': 'http://127.0.0.1:5173',
      '/images': 'http://127.0.0.1:5173',
      '/__api': 'http://127.0.0.1:5173',
    },
  },
}))
