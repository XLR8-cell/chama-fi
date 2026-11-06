import { Badge, Button, Card, ErrorNote, Skeleton } from '../components/ui'
import { useApp } from '../context'
import { useApi } from '../hooks'
import { kes } from '../lib/format'
import { isOfficial, roleLabel } from '../lib/roles'
import { api } from '../mocks/api'
import type { Frequency } from '../types'

export default function Dashboard() {
  const { user, meId, can, refresh, toast } = useApp()
  const { data, error, loading } = useApi(() => api.summary(meId))
  async function changeFrequency(f: Frequency) {
    await api.setFrequency(f)
    toast(`Switched to ${f} contributions. Demo data reset.`)
    refresh()
  }
  async function resetDemo() {
    await api.resetDemo()
    toast('Demo data reset.')
    refresh()
  }
  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-24" /></div>
  const paid = data.dots.filter((d) => d.paid).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Hello, {user?.name.split(' ')[0]}</h1>
        {user && <Badge tone={isOfficial(user.role) ? 'warn' : 'grey'}>{roleLabel[user.role]}</Badge>}
      </div>
      <Card className="bg-gradient-to-br from-deep via-deep to-brand/30 text-white">
        <p className="text-sm text-white/70">{data.periodName} pot: {paid} of {data.dots.length} members have paid</p>
        <ul className="my-4 flex flex-wrap gap-2" aria-label="Members who have paid this month">
          {data.dots.map((d) => (
            <li key={d.id} title={`${d.name}: ${d.paid ? 'paid' : 'not yet'}`}
              className={`grid h-10 w-10 place-items-center rounded-full text-xs font-bold ${d.paid ? 'bg-gold text-deep' : 'border border-dashed border-white/40 text-white/60'}`}>
              {d.name.split(' ').map((p) => p[0]).join('')}
            </li>
          ))}
        </ul>
        <p className="font-display text-3xl font-bold">{kes(paid * data.amount)} collected</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-ink/60">Group savings</p><p className="font-display text-xl font-bold">{kes(data.pool)}</p></Card>
        <Card><p className="text-sm text-ink/60">Your savings</p><p className="font-display text-xl font-bold">{kes(data.mySavings)}</p></Card>
        <Card><p className="text-sm text-ink/60">Next payout goes to</p><p className="font-display text-xl font-bold">{data.nextPayout}</p></Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p>Everyone contributes {kes(data.amount)} every {data.noun}.</p>
        {can('schedule.change') && (
          <div role="group" aria-label="Contribution schedule" className="flex rounded-lg bg-ink/5 p-1 text-sm">
            {(['weekly', 'fortnightly', 'monthly'] as Frequency[]).map((f) => (
              <button key={f} aria-pressed={data.frequency === f} onClick={() => changeFrequency(f)}
                className={`rounded-md px-3 py-1 font-medium capitalize ${data.frequency === f ? 'bg-surface shadow-sm' : 'text-ink/60'}`}>{f}</button>
            ))}
          </div>
        )}
      </Card>
      {can('loans.decide') && (
        <Card><p className="font-medium">{data.pendingLoans} loan {data.pendingLoans === 1 ? 'request needs' : 'requests need'} your decision.</p></Card>
      )}
      <Button variant="ghost" onClick={resetDemo}>Reset demo data</Button>
    </div>
  )
}
