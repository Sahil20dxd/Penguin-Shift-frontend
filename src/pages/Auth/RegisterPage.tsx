// src/pages/Auth/RegisterPage.tsx
// --------------------------------------------------------------------
// Registration page using Cloudflare Turnstile.
// Validates inputs, shows password strength, renders Turnstile if available,
// and handles friendly user feedback.
// --------------------------------------------------------------------
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import {
  loadTurnstile,
  renderTurnstile,
  getTurnstileToken,
  resetTurnstile,
} from '@/utils/security/turnstile'

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE || 'https://penguinshift-production.up.railway.app'
const TURNSTILE_SITE_KEY =
  (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || ''

// helpers
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const hasMinLen = (v: string, n: number) => v.trim().length >= n

export default function RegisterPage() {
  const { showToast, Toast } = useToast()

  // form state
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // inline errors
  const [usernameErr, setUsernameErr] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [passwordErr, setPasswordErr] = useState<string | null>(null)
  const [confirmErr, setConfirmErr] = useState<string | null>(null)

  // password strength
  const [passwordStrength, setPasswordStrength] = useState<{
    label: string
    color: string
    score: number
  }>({ label: '', color: 'gray', score: 0 })

  // render Turnstile on mount
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!TURNSTILE_SITE_KEY) return
      try {
        await loadTurnstile()
        if (!active) return
        await renderTurnstile('captcha-register')
      } catch {
        showToast(
          'We had trouble loading the verification widget. Please refresh the page.',
          'error'
        )
      }
    })()
    return () => {
      active = false
      resetTurnstile()
    }
  }, [showToast])

  // password strength evaluation
  function evaluatePasswordStrength(pw: string) {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    let label = 'Weak'
    let color = 'red'
    if (score >= 3) {
      label = 'Medium'
      color = 'yellow'
    }
    if (score === 4) {
      label = 'Strong'
      color = 'green'
    }
    setPasswordStrength({ label, color, score })
  }

  // field completeness check
  function validateFields(): boolean {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please complete all required fields.', 'warning')
      return false
    }
    return true
  }

  // handle registration
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateFields()) return

    // client-side validation
    if (!hasMinLen(username, 3)) {
      setUsernameErr('Username must be at least 3 characters.')
      showToast('Please enter a longer username (min 3 characters).', 'warning')
      return
    }
    if (!isValidEmail(email)) {
      setEmailErr('Enter a valid email like name@example.com.')
      showToast('Please enter a valid email address.', 'warning')
      return
    }
    if (!hasMinLen(password, 8)) {
      setPasswordErr('Password must be 8+ characters.')
      showToast('Your password should be at least 8 characters long.', 'warning')
      return
    }
    if (password !== confirmPassword) {
      setConfirmErr('Passwords do not match.')
      showToast('Passwords do not match. Please re-enter.', 'warning')
      return
    }

    // CAPTCHA
    let captchaToken: string | null = 'TEST_PASS'
    if (TURNSTILE_SITE_KEY) {
      captchaToken = getTurnstileToken()
      if (!captchaToken) {
        showToast('Please complete the verification before submitting.', 'warning')
        return
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          captchaToken,
        }),
      })

      let payload: any = null
      try {
        payload = await res.json()
      } catch {}

      if (res.ok) {
        showToast(
          'Account created successfully! Please check your inbox to verify your email.',
          'success'
        )
        resetTurnstile()
        window.location.href = '/verify-email?status=pending&email=' + encodeURIComponent(email)
        return
      }

      // too many requests
      if (res.status === 429) {
        const retryAfter = payload?.retryAfterSec ?? 60
        showToast(
          `Too many attempts. Please wait ${retryAfter} seconds and try again.`,
          'warning'
        )
        return
      }

      // conflict (email or username already exists)
      if (res.status === 409) {
        showToast(
          payload?.error ||
            'This email or username is already registered. Try signing in instead.',
          'warning'
        )
        return
      }

      // validation or bad input
      if (res.status === 400) {
        showToast(
          payload?.error || 'Please review your input and try again.',
          'error'
        )
        resetTurnstile()
        return
      }

      // fallback error
      showToast('Something went wrong. Please try again later.', 'error')
    } catch (err) {
      console.error('Registration failed:', err)
      showToast(
        'We couldn’t connect to the server. Please check your connection.',
        'error'
      )
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <form
        onSubmit={handleRegister}
        className='w-full max-w-md bg-white p-8 rounded-lg shadow-lg'
        noValidate
      >
        <h1 className='text-2xl font-bold text-center mb-1 text-gray-900'>
          Create Account
        </h1>
        <p className='text-sm text-gray-600 text-center mb-6'>
          Start syncing your playlists seamlessly.
        </p>

        {/* Username */}
        <label className='block text-sm font-medium mb-1'>Username</label>
        <Input
          type='text'
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() =>
            !hasMinLen(username, 3)
              ? setUsernameErr('Username must be at least 3 characters.')
              : setUsernameErr(null)
          }
          placeholder='e.g. David46'
          className={`mb-1 ${usernameErr ? 'border-red-300 focus:ring-red-200' : ''}`}
        />
        {usernameErr && (
          <p className='text-xs text-red-600 mb-3'>{usernameErr}</p>
        )}

        {/* Email */}
        <label className='block text-sm font-medium mb-1'>Email</label>
        <Input
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() =>
            !isValidEmail(email)
              ? setEmailErr('Enter a valid email like name@example.com.')
              : setEmailErr(null)
          }
          placeholder='name@example.com'
          className={`mb-1 ${emailErr ? 'border-red-300 focus:ring-red-200' : ''}`}
        />
        {emailErr && <p className='text-xs text-red-600 mb-3'>{emailErr}</p>}

        {/* Password */}
        <label className='block text-sm font-medium mb-1'>Password</label>
        <div className='relative mb-1'>
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              evaluatePasswordStrength(e.target.value)
              if (passwordErr && hasMinLen(e.target.value, 8)) setPasswordErr(null)
            }}
            placeholder='At least 8 characters'
            className={`pr-10 ${passwordErr ? 'border-red-300 focus:ring-red-200' : ''}`}
          />
          <Button
            variant='ghost'
            size='icon'
            type='button'
            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
          </Button>
        </div>
        {passwordErr && (
          <p className='text-xs text-red-600 mb-2'>{passwordErr}</p>
        )}

        {/* Password strength meter */}
        {password && (
          <div className='mb-4'>
            <div className='flex justify-between items-center text-sm mb-1'>
              <span
                className={`font-medium ${
                  passwordStrength.color === 'red'
                    ? 'text-red-500'
                    : passwordStrength.color === 'yellow'
                    ? 'text-yellow-500'
                    : 'text-green-600'
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
            <div className='h-1.5 rounded-full bg-gray-200 overflow-hidden'>
              <div
                className={`h-full transition-all duration-500 ${
                  passwordStrength.color === 'red'
                    ? 'bg-red-500'
                    : passwordStrength.color === 'yellow'
                    ? 'bg-yellow-400'
                    : 'bg-green-500'
                }`}
                style={{ width: `${passwordStrength.score * 25}%` }}
              />
            </div>
          </div>
        )}

        {/* Confirm password */}
        <label className='block text-sm font-medium mb-1'>Confirm Password</label>
        <div className='relative mb-1'>
          <Input
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (confirmErr && e.target.value === password) setConfirmErr(null)
            }}
            placeholder='Re-enter your password'
            className={`pr-10 ${confirmErr ? 'border-red-300 focus:ring-red-200' : ''}`}
          />
          <Button
            variant='ghost'
            size='icon'
            type='button'
            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
          </Button>
        </div>
        {confirmErr && <p className='text-xs text-red-600 mb-2'>{confirmErr}</p>}

        {/* CAPTCHA */}
        {TURNSTILE_SITE_KEY && <div id='captcha-register' className='mb-4' />}

        {/* Submit */}
        <Button
          type='submit'
          className='w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600'
        >
          Register
        </Button>

        {/* Google Register */}
        <Button
          type='button'
          onClick={() => {
            document.cookie =
              'PS_OAUTH_INTENT=register; Path=/; Max-Age=300; SameSite=Lax'
            window.location.href = `${API_BASE}/oauth2/authorization/google`
          }}
          className='mt-3 w-full border border-gray-300 bg-white text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50'
        >
          Register with Google
        </Button>

        {/* Redirect link */}
        <div className='mt-4 text-sm text-center text-gray-600'>
          Already have an account?{' '}
          <Link to='/auth?mode=login' className='text-blue-600 hover:underline'>
            Sign in
          </Link>
        </div>

        {Toast}
      </form>
    </div>
  )
}
