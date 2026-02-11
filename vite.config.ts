import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({

  base: '/notificaciones/',
  plugins: [
    react({
      babel: {

        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    // Proxy para evitar errores CORS en desarrollo
    proxy: {
      // Proxy para la API de stories
      '/api/stories': {
        target: 'https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stories/, '/stories'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ [Proxy Error]', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 [Proxy Request]', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 [Proxy Response]', proxyRes.statusCode, req.url)
          })
        }
      },
      // Proxy para la API de notificaciones existente
      '/api/notifications': {
        target: 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notifications/, '/notificaciones'),
        secure: true
      }
    }
  }
})
