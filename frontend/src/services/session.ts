import type { User } from '../types'

const SESSION_STORAGE_KEY = 'inventory_session_v2'

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: User
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null
}
