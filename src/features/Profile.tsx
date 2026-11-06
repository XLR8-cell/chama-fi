import { useState, type FormEvent } from 'react'
import { Badge, Button, Card, ErrorNote, Field, Skeleton } from '../components/ui'
import { useApp } from '../context'
import { useApi } from '../hooks'
import { kes, periodName } from '../lib/format'
import { isOfficial, permissionsFor, roleLabel } from '../lib/roles'
import { loanMark, loanTone, statusMark, statusTone } from '../lib/status'
import { api } from '../mocks/api'

export default function Profile() {
  const { meId, toast } = useApp()
  const { data, error, loading } = useApi(() => api.profile(meId))
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (form.next !== form.confirm) return setFormError('The two new passwords do not match.')
    setBusy(true)
    try {
      await api.changePassword(meId, form.current, form.next)
      setForm({ current: '', next: '', confirm: '' })
      toast('Password changed.')
    } catch (err) { setFormError((err as Error).message) } finally { setBusy(false) }
  }

  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  const { member, counts } = data
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">{member.name}</h1>
          <Badge tone={isOfficial(member.role) ? 'warn' : 'grey'}>{roleLabel[member.role]}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink/60">{member.email} · {member.phone}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div><p className="text-sm text-ink/60">Saved so far</p><p className="font-display text-xl font-bold">{kes(data.savings)}</p></div>
          <div><p className="text-sm text-ink/60">Paid</p><p className="font-display text-xl font-bold">{counts.paid}</p></div>
          <div><p className="text-sm text-ink/60">Pending</p><p className="font-display text-xl font-bold">{counts.pending}</p></div>
          <div><p className="text-sm text-ink/60">Late</p><p className="font-display text-xl font-bold">{counts.late}</p></div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">What your role lets you do</h2>
        <ul className="space-y-1.5 text-sm">
          {permissionsFor(member.role).map((p) => (
            <li key={p.label} className="flex items-center gap-2">
              <Badge tone={p.allowed ? 'ok' : 'grey'}>{p.allowed ? '✓ Can' : '– Cannot'}</Badge>{p.label}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Your contributions</h2>
        <ul className="divide-y divide-ink/10">
          {data.contributions.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span>{periodName(c.period)}</span>
              <span className="flex items-center gap-3">{kes(c.amount)}<Badge tone={statusTone[c.status]}>{statusMark[c.status]} {c.status}</Badge></span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Your loans</h2>
        {data.loans.length === 0 ? <p className="text-sm text-ink/60">You have no loans. Request one on the Loans page.</p> : (
          <ul className="divide-y divide-ink/10">
            {data.loans.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>{kes(l.amount)} over {l.months} months</span>
                <Badge tone={loanTone[l.status]}>{loanMark[l.status]} {l.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Change password</h2>
        <form onSubmit={changePassword} className="max-w-sm space-y-4">
          <Field label="Current password" type="password" autoComplete="current-password" required value={form.current} onChange={set('current')} />
          <Field label="New password (8 or more characters)" type="password" autoComplete="new-password" minLength={8} required value={form.next} onChange={set('next')} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={form.confirm} onChange={set('confirm')} />
          {formError && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{formError}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Saving' : 'Change password'}</Button>
        </form>
      </Card>
    </div>
  )
}
