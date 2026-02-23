// src/auth/authService.ts
import type { LoginCredentials, AuthToken } from './authTypes'

const AUTH_URL = 'https://asistente.eluniversal.com.mx/service/?do=ldpa'

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      const body = {
        usuario: credentials.username,
        pass: credentials.password
      }
      
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const responseText = await response.text()
      
      if (responseText.trim().startsWith('<')) {
        throw new Error('El servidor no responde correctamente. Contacte al administrador.')
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Error al procesar la respuesta del servidor')
      }

      // Debug: mostrar datos recibidos de la API
      console.log('🔍 API:', { grupos: data.grupos, ou: data.data?.find((item: string) => item === 'OU=TI') || null })

      if (!data || typeof data !== 'object') {
        throw new Error('La contraseña o usuario son incorrectos. Por favor verifica e intenta de nuevo.')
      }

      // Validar respuesta exitosa
      if (data.success !== true) {
        throw new Error('La contraseña o usuario son incorrectos. Por favor verifica e intenta de nuevo.')
      }


      // Identificar tipo de usuario
      // notif_push: grupo "Notificaciones Push"
      // tester: grupo "Tester"
      // sin permisos: ninguno de los anteriores
      let tipoUsuario: 'notif_push' | 'tester' | 'sin_permisos' = 'sin_permisos';
      if (data.grupos && Array.isArray(data.grupos)) {
        if (data.grupos.includes('Tester')) {
          tipoUsuario = 'tester';
        } else if (data.grupos.includes('Notificaciones Push')) {
          tipoUsuario = 'notif_push';
        }
      } else {
        // Si no viene el campo grupos, rechazar por seguridad
        throw new Error('No se pudo verificar tus permisos. Contacta al administrador.');
      }

      // Validación para notif_push
      if (tipoUsuario === 'notif_push') {
        // Si está en notif_push, acceso permitido
        // No requiere OU adicional
      } else if (tipoUsuario === 'tester') {
        // Si es tester, primero debe pasar validación push (ya está aquí)
        // Luego, debe pasar validación OU=TI
        let userOU: string | null = null;
        if (data.data && Array.isArray(data.data)) {
          const ouTI = data.data.find((item: string) => item === 'OU=TI');
          if (ouTI) {
            userOU = 'TI';
          }
        }
        if (userOU !== 'TI') {
          throw new Error('No tienes permisos para acceder a esta aplicación.\n\nSolo testers de la unidad organizacional TI pueden acceder.');
        }
      } else {
        // Sin permisos
        throw new Error('No tienes permisos para acceder a esta aplicación.');
      }

      // Para notif_push y tester (si llegó aquí, pasó las validaciones)
      let userOU: string | undefined = undefined;
      if (data.data && Array.isArray(data.data)) {
        const ouTI = data.data.find((item: string) => item === 'OU=TI');
        if (ouTI) {
          userOU = 'TI';
        }
      }

      const basicAuth = btoa(`${credentials.username}:${credentials.password}`)
      const expiresIn = 3600 // 1 hora
      const expiresAt = Date.now() + (expiresIn * 1000)

      return {
        accessToken: basicAuth,
        expiresAt,
        username: credentials.username,
        grupos: data.grupos || [],
        ou: userOU,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error al iniciar sesión. Por favor intente nuevamente.')
    }
  }

  static async renewToken(credentials: LoginCredentials): Promise<AuthToken> {
    return this.login(credentials)
  }

  static getAuthHeader(token: string | null): Record<string, string> {
    if (!token) {
      return {}
    }
    return {
      'Authorization': `Basic ${token}`,
    }
  }
}
