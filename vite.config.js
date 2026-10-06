import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  test: {
    include: ['test/**/*.test.js'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js']
  }
}) 
