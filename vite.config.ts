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
  }
})
