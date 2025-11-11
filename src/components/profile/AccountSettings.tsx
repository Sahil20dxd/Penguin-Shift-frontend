// src/pages/profile/AccountSettings.tsx
/**
 * Account Settings (per-row edit UX)
 * - Rows: Name (display only), Username (edit), Email (edit), Password (edit or hidden for Google)
 * - Uses /auth/me to discover canChangePassword + authProvider
 * - Debounced username availability (only when changed & >= 3 chars)
 * - Delete account with confirmation
 */

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  LogOut,
  Check,
  X,
  Pencil,
  XCircle,
  AlertTriangle,
  MailCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/useAuth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import PasswordSection from '@/components/profile/PasswordSection'

type MeResponse = {
  username: string
  email: string
  role: string
  verified: boolean
  canChangePassword: boolean
  authProvider?: 'LOCAL' | 'GOOGLE'
}

const API_BASE = 'http://127.0.0.1:8080'

export default function AccountSettings() {
  const { user, authFetch, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast, Toast } = useToast()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [emailChangePending, setEmailChangePending] = useState(false)
  const [emailChangeBannerTo, setEmailChangeBannerTo] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const originalUsername = me?.username ?? user?.username ?? ''
  const originalEmail = me?.email ?? user?.email ?? ''

  // --- Fetch /auth/me ---
  useEffect(() => {
    ;(async () => {
      try {
        const res = await authFetch(`${API_BASE}/auth/me`)
        if (!res.ok) return
        const data: MeResponse = await res.json()
        setMe(data)
        setUsername(data.username)
        setEmail(data.email)
        setPendingEmail(data.email)
      } catch {
        /* ignore */
      }
    })()
  }, [authFetch])

  // --- Reset fields when /me resolves ---
  useEffect(() => {
    setUsername(originalUsername)
    setEmail(originalEmail)
    setPendingEmail(originalEmail)
    setEmailChangeBannerTo(null)
    setEmailChangePending(false)
  }, [originalUsername, originalEmail])

  // --- Debounced username availability ---
  useEffect(() => {
    if (!editingUsername) return
    const trimmed = username.trim()
    if (trimmed === originalUsername || trimmed.length < 3) {
      setUsernameAvailable(null)
      return
    }
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/auth/check-username?username=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((d) => setUsernameAvailable(!!d.available))
        .catch(() => setUsernameAvailable(null))
    }, 500)
    return () => clearTimeout(timer)
  }, [username, editingUsername, originalUsername])

  // --- Logout with unsaved-change check ---
  const handleLogout = () => {
    if (editingUsername || editingEmail) {
      const confirmLeave = window.confirm('You have unsaved changes. Log out anyway?')
      if (!confirmLeave) return
    }
    logout()
    navigate('/')
    showToast('You’ve been signed out successfully.', 'info')
  }

  // --- Save username ---
  const saveUsername = async () => {
    const trimmed = username.trim()
    if (!trimmed) {
      showToast('Please enter a valid username.', 'warning')
      return
    }
    if (trimmed === originalUsername) {
      setEditingUsername(false)
      return
    }
    if (trimmed.length < 3) {
      showToast('Username must be at least 3 characters long.', 'warning')
      return
    }
    if (usernameAvailable === false) {
      showToast('That username is already taken. Please choose another.', 'warning')
      return
    }

    setSavingUsername(true)
    try {
      const res = await authFetch(`${API_BASE}/auth/update`, {
        method: 'PUT',
        json: {
          email: originalEmail,
          newEmail: originalEmail,
          newUsername: trimmed,
        },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast('Your username has been updated successfully.', 'success')
        setMe((prev) => (prev ? { ...prev, username: trimmed } : prev))
        setEditingUsername(false)
      } else {
        showToast(data?.error || 'We couldn’t update your username. Please try again.', 'error')
      }
    } catch {
      showToast('We couldn’t connect to the server. Please try again later.', 'error')
    } finally {
      setSavingUsername(false)
    }
  }

  // --- Save email ---
  const saveEmail = async () => {
    const trimmed = pendingEmail.trim()
    if (!trimmed) {
      showToast('Please enter a valid email address.', 'warning')
      return
    }
    if (trimmed === originalEmail) {
      setEditingEmail(false)
      return
    }

    setSavingEmail(true)
    try {
      const res = await authFetch(`${API_BASE}/auth/email-change`, {
        method: 'PUT',
        json: { newEmail: trimmed },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEditingEmail(false)
        setEmailChangePending(true)
        setEmailChangeBannerTo(trimmed)
        showToast('Verification sent! Check your new inbox to confirm.', 'success')
      } else {
        showToast(data.error || 'We couldn’t start your email change. Please try again.', 'error')
      }
    } catch {
      showToast('We couldn’t connect to the server. Please try again.', 'error')
    } finally {
      setSavingEmail(false)
    }
  }

  // --- Auto-dismiss email change banner after 30s ---
  useEffect(() => {
    if (!emailChangeBannerTo) return
    const timer = setTimeout(() => setEmailChangeBannerTo(null), 30000)
    return () => clearTimeout(timer)
  }, [emailChangeBannerTo])

  // --- Delete account ---
  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await authFetch(`${API_BASE}/auth/me`, { method: 'DELETE' })
      if (res.ok || res.status === 401 || res.status === 403) {
        showToast('Your account has been deleted. We’re sorry to see you go.', 'success')
        logout()
        window.location.assign('/')
        return
      }
      const msg = await res.text()
      showToast(msg || 'We couldn’t delete your account. Please try again.', 'error')
    } catch {
      showToast('We couldn’t connect to the server. Please try again.', 'error')
    } finally {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  // --- Prevent accidental submit ---
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const preventSubmit = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('submit', preventSubmit, true)
    return () => el.removeEventListener('submit', preventSubmit, true)
  }, [])

  // --- Helper: name capitalization ---
  const NameDisplay = useMemo(() => {
    const nameLike = originalUsername
      .split(/[-_.]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
    return nameLike
  }, [originalUsername])

  return (
    <>
      <div ref={rootRef}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 hidden md:block'>
          <div className='flex items-center gap-2 mb-4'>
            <ChevronDown className='w-5 h-5 text-gray-600' />
            <h2 className='text-2xl font-bold text-gray-900'>Account Settings</h2>
          </div>
          <p className='text-gray-600'>Manage your profile information and password securely.</p>
        </motion.div>

        <Card className='bg-white shadow-lg rounded-2xl overflow-hidden'>
          <CardHeader className='border-b border-gray-100 p-6'>
            <CardTitle className='text-xl font-semibold text-gray-900'>Account Information</CardTitle>
          </CardHeader>

          {emailChangeBannerTo && (
            <div className='mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 flex items-start gap-2'>
              <MailCheck className='w-5 h-5 text-amber-600 mt-0.5' />
              <div className='text-sm text-amber-800'>
                Verification sent to <span className='font-semibold'>{emailChangeBannerTo}</span>. Please check your inbox.
              </div>
              <button
                onClick={() => setEmailChangeBannerTo(null)}
                className='ml-auto text-amber-700 hover:underline text-sm'
              >
                Dismiss
              </button>
            </div>
          )}

          <CardContent className='p-6 space-y-6'>
            {/* Name */}
            <div className='space-y-2'>
              <Label htmlFor='displayName'>Name</Label>
              <Input id='displayName' value={NameDisplay} readOnly aria-label='Display name' className='w-full bg-gray-50' />
              <p className='text-xs text-gray-500'>This is your display name, derived from your username.</p>
            </div>

            {/* Username */}
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='username'
                  aria-label='Username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!editingUsername}
                  className={`w-full ${editingUsername ? '' : 'bg-gray-50'}`}
                />
                {editingUsername ? (
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={() => {
                      setUsername(originalUsername)
                      setEditingUsername(false)
                    }}
                    aria-label='Cancel username edit'
                  >
                    <XCircle className='w-4 h-4' />
                  </Button>
                ) : (
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={() => setEditingUsername(true)}
                    aria-label='Edit username'
                  >
                    <Pencil className='w-4 h-4' />
                  </Button>
                )}

                {editingUsername &&
                  username.trim() !== originalUsername &&
                  username.trim().length >= 3 &&
                  (usernameAvailable === true ? (
                    <Check className='text-green-500 w-5 h-5' />
                  ) : usernameAvailable === false ? (
                    <X className='text-red-500 w-5 h-5' />
                  ) : null)}
              </div>
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='email'
                  aria-label='Email address'
                  type='email'
                  value={editingEmail ? pendingEmail : originalEmail}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  disabled={!editingEmail}
                  className={`w-full ${editingEmail ? '' : 'bg-gray-50'}`}
                />
                {editingEmail ? (
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={() => {
                      setEmail(originalEmail)
                      setEditingEmail(false)
                    }}
                    aria-label='Cancel email edit'
                  >
                    <XCircle className='w-4 h-4' />
                  </Button>
                ) : (
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={() => setEditingEmail(true)}
                    aria-label='Edit email'
                  >
                    <Pencil className='w-4 h-4' />
                  </Button>
                )}
              </div>
              {emailChangePending && (
                <p className='text-xs text-amber-600 mt-1'>
                  Pending email change — check your new inbox for a confirmation link.
                </p>
              )}
            </div>

            {/* Password */}
            {me?.canChangePassword ? (
              <div className='space-y-2'>
                <Label>Password</Label>
                <PasswordSection
                  withStrengthMeter
                  onSubmit={async (oldP, newP, confirmP) => {
                    if (newP !== confirmP) {
                      showToast('The new passwords don’t match. Please re-enter them.', 'error')
                      return
                    }
                    try {
                      const res = await authFetch(`${API_BASE}/auth/change-password`, {
                        method: 'PUT',
                        json: { email: originalEmail, oldPassword: oldP, newPassword: newP },
                      })
                      const data = await res.json()
                      if (res.ok) showToast('Password updated successfully.', 'success')
                      else showToast(data.error || 'We couldn’t update your password. Please try again.', 'error')
                    } catch {
                      showToast('We couldn’t connect to the server. Please try again.', 'error')
                    }
                  }}
                />
              </div>
            ) : (
              <div className='rounded-md border p-4 bg-gray-50'>
                <p className='text-sm text-gray-600'>
                  Your account uses Google sign-in. There’s no local password to change.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-3 pt-4 border-t border-gray-100 mt-4'>
              <Button
                type='button'
                onClick={() => {
                  if (editingUsername) void saveUsername()
                  if (editingEmail) void saveEmail()
                }}
                disabled={!editingUsername && !editingEmail}
                className='bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg disabled:opacity-60'
              >
                {savingUsername || savingEmail ? (
                  <span className='flex items-center gap-2'>
                    <svg className='w-4 h-4 animate-spin' viewBox='0 0 24 24'>
                      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' className='opacity-25' />
                      <path
                        d='M4 12a8 8 0 018-8'
                        stroke='currentColor'
                        strokeWidth='4'
                        strokeLinecap='round'
                        className='opacity-75'
                      />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={handleLogout}
                className='text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700'
              >
                <LogOut className='w-5 h-5 mr-2' />
                Log Out
              </Button>
            </div>

            {/* Delete account */}
            <div className='pt-6 border-t border-gray-100'>
              {!confirmingDelete ? (
                <button
                  type='button'
                  onClick={() => setConfirmingDelete(true)}
                  className='text-red-600 text-sm hover:underline'
                >
                  Delete my account
                </button>
              ) : (
                <div className='mt-3 rounded-md border border-red-200 bg-red-50 p-4'>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='w-5 h-5 text-red-600 mt-0.5' />
                    <div className='flex-1'>
                      <p className='text-red-700 font-medium mb-1'>
                        Permanently delete your account?
                      </p>
                      <p className='text-red-700/90 text-sm mb-3'>
                        This action can’t be undone. Your profile and related data will be removed.
                      </p>
                      <div className='flex gap-2'>
                        <Button variant='destructive' disabled={deleting} onClick={handleDeleteAccount}>
                          {deleting ? 'Deleting…' : 'Yes, delete my account'}
                        </Button>
                        <Button variant='outline' onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {Toast}
    </>
  )
}
