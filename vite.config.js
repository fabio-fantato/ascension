// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// StackBlitz lida melhor com config em JS do que TS
export default defineConfig({
  plugins: [react()],
})
