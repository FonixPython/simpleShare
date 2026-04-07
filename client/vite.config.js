import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + "/..", '')

  const backend = `http://localhost:${env.PORT}`

  return {
    root: path.resolve(__dirname, './'),
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [vue()],
    build: {
      outDir: '../dist/public',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/login': backend,
        '/verifySession': backend,
        '/logout': backend,
        '/register': backend,
        '/quota': backend,
        '/getAllFiles': backend,
        '/checkFile': backend,
        '/files': backend,
        '/delete': backend,
        '/upload': backend,
        '/upload-group': backend,
        '/upload-multiple-individual': backend,
        '/share-link': backend,
        '/api': backend,
        '^/[a-z]{6}$': backend,
        '/admin': {
          target: backend,
          changeOrigin: true
        }
      }
    }
  }
})