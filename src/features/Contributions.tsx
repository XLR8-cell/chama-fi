import { useState } from 'react'
import { Badge, Button, Card, ErrorNote, Skeleton } from '../components/ui'
import { useApp } from '../context'
import { useApi } from '../hooks'
import { kes, periodLabel, periodName } from '../lib/format'
import { statusMark as mark, statusTone as tone } from '../lib/status'
import { api } from '../mocks/api'

export default function Contributions() {
  const { meId, can, refresh, toast } = useApp()
  const { data, error, loading } = useApi(api.grid)
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<string | void>, ok: (r: string) => string) {
    setBusy(true)
    try { toast(ok((await fn()) as string)); refresh() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <Skeleton className="h-80" />
  const mine = data.rows.find((r) => r.member.id === meId)?.cells.find((c) => c?.period === data.current)
  const canRecord = can('payments.record')
  const canRemind = can('reminders.send')
  const showActions = canRecord || canRemind
  const pay = () => run(async () => (await api.pay(meId, data.current)).ref, (ref) => `Payment received. M-Pesa ref ${ref}`)

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Contributions</h1>
      {mine && mine.status !== 'paid' && (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <p>Your {periodName(data.current)} contribution of {kes(data.amount)} is {mine.status}.</p>
          <Button onClick={pay} disabled={busy}>{busy ? 'Check your phone for the M-Pesa prompt' : 'Pay with M-Pesa'}</Button>
        </Card>
      )}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-ink/10 text-left text-ink/60">
            <th className="p-3 font-medium">Member</th>
            {data.periods.map((p) => <th key={p} className="p-3 font-medium">{periodLabel(p)}</th>)}
            {showActions && <th className="p-3 font-medium">Actions</th>}
          </tr></thead>
          <tbody>
            {data.rows.map(({ member, cells }) => {
              const owing = cells.find((c) => c && c.status !== 'paid')
              return (
                <tr key={member.id} className="border-b border-ink/5 last:border-0">
                  <th scope="row" className="p-3 text-left font-medium">{member.name}</th>
                  {cells.map((c, i) => <td key={c?.id ?? i} className="p-3">{c ? <Badge tone={tone[c.status]}>{mark[c.status]} {c.status}</Badge> : <span className="text-ink/40">n/a</span>}</td>)}
                  {showActions && (
                    <td className="p-3">
                      {owing ? (
                        <div className="flex gap-2">
                          {canRecord && <Button disabled={busy} onClick={() => run(() => api.recordPayment(member.id, owing.period), (n) => `Recorded ${periodLabel(owing.period)} payment for ${n}.`)}>Record payment</Button>}
                          {canRemind && <Button variant="ghost" disabled={busy} onClick={() => run(() => api.remind(member.id), (n) => `Reminder sent to ${n}.`)}>Remind</Button>}
                        </div>
                      ) : <span className="text-ink/50">Up to date</span>}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
