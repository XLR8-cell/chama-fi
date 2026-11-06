import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Button, Field } from '../components/ui'
import { useApp } from '../context'
import { api } from '../mocks/api'
import { CHAMA_CODE } from '../mocks/db'

export default function SignUp() {
  const { user, signIn, toast } = useApp()
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', code: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const m = await api.signUp(f)
      signIn(m)
      toast(`Welcome to Umoja, ${m.name.split(' ')[0]}.`)
    } catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <AuthShell title="Create your account" subtitle="You join as a member. Officials are appointed by the group.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" autoComplete="name" required value={f.name} onChange={set('name')} />
        <Field label="Phone (M-Pesa number)" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required value={f.phone} onChange={set('phone')} />
        <Field label="Email" type="email" autoComplete="email" required value={f.email} onChange={set('email')} />
        <Field label="Password (8 or more characters)" type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} />
        <Field label="Chama code" required value={f.code} onChange={set('code')} />
        <p className="-mt-2 text-xs text-ink/60">Ask your secretary for the code. In this demo it is {CHAMA_CODE}.</p>
        {error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating account' : 'Create account'}</Button>
      </form>
      <p className="mt-4 text-sm text-ink/60">Already registered? <Link to="/signin" className="font-semibold text-brand underline">Sign in</Link></p>
    </AuthShell>
  )
}
