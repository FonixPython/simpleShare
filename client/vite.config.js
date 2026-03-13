import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require("path")

export default defineConfig({
  root: path.resolve(__dirname, './'),
  plugins: [vue()],
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/login': 'http://localhost:3000',
      '/verifySession': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/quota': 'http://localhost:3000',
      '/getAllFiles': 'http://localhost:3000',
      '/checkFile': 'http://localhost:3000',
      '/files': 'http://localhost:3000',
      '/delete': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
      '/upload-group': 'http://localhost:3000',
      '/upload-multiple-individual': 'http://localhost:3000',
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, '/admin')
      }
    }
  }
})
