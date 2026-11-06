import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Button, Field } from '../components/ui'
import { useApp } from '../context'
import { api } from '../mocks/api'
import { DEMO_PASSWORD } from '../mocks/db'

const demo = [['Member', 'wanjiru'], ['Treasurer', 'otieno'], ['Secretary', 'achieng'], ['Chairperson', 'kiprop']]

export default function SignIn() {
  const { user, signIn } = useApp()
  const prefill = (useLocation().state as { email?: string } | null)?.email ?? ''
  const [email, setEmail] = useState(prefill)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try { signIn(await api.signIn(email, password)) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <AuthShell title="Sign in" subtitle="Use the email you registered with your chama.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="-mt-2 text-sm"><Link to="/forgot-password" className="font-semibold text-brand underline">Forgot password?</Link></p>
        {error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in' : 'Sign in'}</Button>
      </form>
      <p className="mt-4 text-sm text-ink/60">New to the chama? <Link to="/signup" className="font-semibold text-brand underline">Create an account</Link></p>
      <div className="mt-8 border-t border-ink/10 pt-4">
        <p className="mb-2 text-sm font-medium">Demo accounts (password {DEMO_PASSWORD})</p>
        <div className="flex flex-wrap gap-2">
          {demo.map(([label, first]) => (
            <Button key={first} variant="ghost" className="!min-h-9" onClick={() => { setEmail(`${first}@umoja.co.ke`); setPassword(DEMO_PASSWORD) }}>{label}</Button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
