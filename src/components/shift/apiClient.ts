// src/components/shift/apiClient.ts
// --------------------------------------------------------------------
// API client wrapper for PenguinShift.
// Handles both Spotify ↔ YouTube directions (OAuth, playlists, transfer).
// --------------------------------------------------------------------

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_API_BASE) ||
  (process.env as any)?.REACT_APP_API_URL ||
  'https://penguinshift-production.up.railway.app/'

function getAuthToken(): string {
  return localStorage.getItem('authToken') || localStorage.getItem('jwt') || ''
}

// Generic JSON fetch
export async function apiJson(path: string, options: RequestInit = {}) {
  const token = getAuthToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error('HTTP ' + res.status + ': ' + (text || res.statusText))
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || 'Non-JSON response from server')
  }
}

// Generic blob fetch
export async function apiBlob(path: string, options: RequestInit = {}) {
  const token = getAuthToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  })
  if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText)
  return res.blob()
}

// --------------------------------------------------------------------
// Platform OAuth + Linking
// --------------------------------------------------------------------
export function checkLinkStatus(platform: 'spotify' | 'youtube') {
  return apiJson('/api/platforms/link-status?platform=' + platform)
}

export function getLinkUrl(platform: 'spotify' | 'youtube') {
  return apiJson('/api/platforms/link-url', {
    method: 'POST',
    body: JSON.stringify({ platform })
  })
}

export function forceReconnect(platform: 'spotify' | 'youtube') {
  // helper for manual reconnect (optional)
  return apiJson('/api/platforms/force-reconnect/' + platform, {
    method: 'POST'
  })
}

// --------------------------------------------------------------------
// Playlist APIs
// --------------------------------------------------------------------

// Get source playlists (Spotify or YouTube)
export function fetchPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson('/api/playlists/source?platform=' + platform)
}

// Get destination playlists for either Spotify or YouTube
export function listPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson('/api/playlists/destination?platform=' + platform)
}

// --------------------------------------------------------------------
// Transfer APIs (works for both directions)
// --------------------------------------------------------------------
export function startTransfer(request: any) {
  // backend auto-detects direction via sourcePlatform + destinationPlatform
  return apiJson('/api/transfer', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export function getTransferStatus(transferId: number) {
  return apiJson('/api/transfer/' + transferId)
}

// --------------------------------------------------------------------
// Unmatched Downloads (CSV, PDF, JSON)
// --------------------------------------------------------------------
export async function downloadFile(
  transferId: number,
  type: 'csv' | 'pdf' | 'json'
) {
  const blob = await apiBlob(
    '/api/transfer/' + transferId + '/download?type=' + type
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transfer-' + transferId + '.' + type
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadUnmatchedCsv(transferId: number) {
  return downloadFile(transferId, 'csv')
}

export async function downloadUnmatchedPdf(transferId: number) {
  return downloadFile(transferId, 'pdf')
}

export function fetchUnmatchedJson(transferId: number) {
  return apiJson('/api/transfer/' + transferId + '/unmatched.json')
}

// Simple CSV-only shortcut (legacy)
export async function downloadUnmatched(transferId: number) {
  const blob = await apiBlob('/api/transfer/' + transferId + '/unmatched')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'unmatched-' + transferId + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
