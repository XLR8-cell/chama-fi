import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Button, Field } from '../components/ui'
import { useApp } from '../context'
import { api } from '../mocks/api'

export default function ForgotPassword() {
  const { user, toast } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { setDemoCode((await api.requestPasswordReset(email)).demoCode); setStep('code') })
  }
  const reset = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (password !== confirm) throw new Error('The two passwords do not match.')
      await api.resetPassword(email, code, password)
      toast('Password changed. Sign in with your new password.')
      navigate('/signin', { state: { email } })
    })
  }
  const errorBox = error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>

  return step === 'email' ? (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a 6-digit code.">
      <form onSubmit={sendCode} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {errorBox}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending code' : 'Send code'}</Button>
      </form>
      <p className="mt-4 text-sm"><Link to="/signin" className="font-semibold text-brand underline">Back to sign in</Link></p>
    </AuthShell>
  ) : (
    <AuthShell title="Enter your code" subtitle={`If an account exists for ${email}, a code is on its way. It expires in 15 minutes.`}>
      {demoCode && (
        <p className="mb-4 rounded-xl bg-gold/25 p-3 text-sm">Demo only, no email is sent. Your code is <strong>{demoCode}</strong>.</p>
      )}
      <form onSubmit={reset} className="space-y-4">
        <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
        <Field label="New password (8 or more characters)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {errorBox}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving' : 'Change password'}</Button>
      </form>
      <p className="mt-4 flex gap-4 text-sm">
        <button type="button" className="font-semibold text-brand underline" onClick={() => { setStep('email'); setError(null) }}>Use a different email</button>
        <Link to="/signin" className="font-semibold text-brand underline">Back to sign in</Link>
      </p>
    </AuthShell>
  )
}
