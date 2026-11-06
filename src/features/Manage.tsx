import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Badge, Button, Card, ErrorNote, Skeleton } from '../components/ui'
import { useApp } from '../context'
import { useApi } from '../hooks'
import { kes, periodName } from '../lib/format'
import { isOfficial } from '../lib/roles'
import { statusMark, statusTone } from '../lib/status'
import { api } from '../mocks/api'
import type { Frequency } from '../types'

const when = (ts: number) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Manage() {
  const { user, can, refresh, toast } = useApp()
  const { data, error, loading } = useApi(api.collections)
  const [busy, setBusy] = useState(false)
  if (user && !isOfficial(user.role)) return <Navigate to="/" replace />

  async function run(fn: () => Promise<string>) {
    setBusy(true)
    try { toast(await fn()); refresh() } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-24" /></div>
  const canRecord = can('payments.record')
  const canRemind = can('reminders.send')

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Manage</h1>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">{periodName(data.period)} collections</h2>
            <p className="text-sm text-ink/60">{data.paid} of {data.total} members have paid {kes(data.amount)}.</p>
          </div>
          {canRemind && data.unpaid.length > 0 && (
            <Button variant="ghost" disabled={busy} onClick={() => run(async () => `Reminder sent to ${await api.remindAll()} members.`)}>
              Remind everyone ({data.unpaid.length})
            </Button>
          )}
        </div>
        {data.unpaid.length === 0 ? <p className="text-sm">Everyone has paid for {periodName(data.period)}.</p> : (
          <ul className="divide-y divide-ink/10">
            {data.unpaid.map((u) => (
              <li key={u.memberId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-ink/60">{u.lastReminded ? `Reminded ${when(u.lastReminded)}` : 'Not reminded yet'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone[u.status]}>{statusMark[u.status]} {u.status}</Badge>
                  {canRecord && <Button disabled={busy} onClick={() => run(async () => `Recorded ${kes(u.amount)} from ${await api.recordPayment(u.memberId, data.period)}.`)}>Record payment</Button>}
                  {canRemind && <Button variant="ghost" disabled={busy} onClick={() => run(async () => `Reminder sent to ${await api.remind(u.memberId)}.`)}>Remind</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!canRecord && <p className="mt-3 text-sm text-ink/60">Only the treasurer can record payments.</p>}
      </Card>

      {can('loans.decide') && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p>{data.pendingLoans === 0 ? 'No loan requests are waiting.' : `${data.pendingLoans} loan ${data.pendingLoans === 1 ? 'request is' : 'requests are'} waiting for a decision.`}</p>
          <Link to="/loans" className="font-semibold text-brand underline">Review loans</Link>
        </Card>
      )}

      {can('schedule.change') && (
        <Card>
          <h2 className="font-medium">Contribution schedule</h2>
          <p className="mb-3 text-sm text-ink/60">Members contribute {kes(data.amount)} every {data.noun}. In this demo, changing the schedule rebuilds everyone's contribution history.</p>
          <div role="group" aria-label="Contribution schedule" className="inline-flex rounded-xl bg-ink/5 p-0.5 text-sm">
            {(['weekly', 'fortnightly', 'monthly'] as Frequency[]).map((f) => (
              <button key={f} aria-pressed={data.frequency === f} disabled={busy}
                onClick={() => run(async () => { await api.setFrequency(f); return `Switched to ${f} contributions.` })}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize ${data.frequency === f ? 'bg-surface shadow-sm' : 'text-ink/60'}`}>{f}</button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
