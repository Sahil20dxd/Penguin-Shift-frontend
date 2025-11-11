// src/pages/Auth/VerifyEmailPage.tsx
// --------------------------------------------------------------
// Verifies user's email when visiting ?token=... link.
// Shows friendly states: waiting, success, or failed.
// --------------------------------------------------------------
import React, { useEffect, useState } from 'react'

export default function VerifyEmailPage() {
  const params = new URLSearchParams(window.location.search)
  const incomingStatus = params.get('status') // 'pending' | 'success' | 'failed'
  const token = params.get('token')
  const email = params.get('email') || ''
  const [status, setStatus] = useState<string | null>(incomingStatus)

  // If user opens raw email link with ?token=..., verify automatically
  useEffect(() => {
    if (!token || incomingStatus) return
    ;(async () => {
      try {
        const res = await fetch(
          `https://penguinshift-production.up.railway.app/auth/verify?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            redirect: 'follow',
            credentials: 'include',
          }
        )
        if (!res.redirected) {
          setStatus(res.ok ? 'success' : 'failed')
        }
      } catch (err) {
        console.error('Email verification request failed:', err)
        setStatus('failed')
      }
    })()
  }, [token, incomingStatus])

  // Friendly “waiting” message
  if (status === 'pending' || (!status && !token)) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='bg-white p-8 rounded-xl shadow-lg text-center max-w-md'>
          <h1 className='text-2xl font-semibold mb-2 text-blue-600'>
            Verify your email
          </h1>
          <p className='text-gray-600'>
            We’ve sent a verification link to your inbox. Please click the link to
            activate your account.
          </p>

          <a
            href={`/auth/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className='inline-block mt-4 text-blue-600 hover:underline'
          >
            Didn’t get it? Send the link again
          </a>
        </div>
      </div>
    )
  }

  // Friendly success / failure messages
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white p-8 rounded-xl shadow-lg text-center max-w-md'>
        {status === 'success' ? (
          <>
            <h1 className='text-2xl font-semibold mb-2 text-green-600'>
              Email verified successfully
            </h1>
            <p className='text-gray-600 mb-6'>
              Your email address has been verified. You can now log in to your account.
            </p>
            <a
              href='/auth?mode=login'
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Go to Login
            </a>
          </>
        ) : (
          <>
            <h1 className='text-2xl font-semibold mb-2 text-red-600'>
              Verification link not valid
            </h1>
            <p className='text-gray-600 mb-6'>
              The link you used may have expired or already been used. Please
              request a new verification link or register again.
            </p>

            <a
              href={`/auth/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className='inline-block mb-4 text-blue-600 hover:underline'
            >
              Request new verification email
            </a>

            <a
              href='/auth?mode=register'
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Register Again
            </a>
          </>
        )}
      </div>
    </div>
  )
}
