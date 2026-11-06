import { Card, ErrorNote, Skeleton } from '../components/ui'
import { useApi } from '../hooks'
import { kes, periodLabel } from '../lib/format'
import { api } from '../mocks/api'

export default function Reports() {
  const { data, error, loading } = useApi(api.reports)
  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
  const top = Math.max(...data.series.map((m) => m.expected), 1)

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-ink/60">Collection rate</p><p className="font-display text-xl font-bold">{Math.round(data.rate * 100)}%</p></Card>
        <Card><p className="text-sm text-ink/60">Loans approved</p><p className="font-display text-xl font-bold">{kes(data.loanBook.approved)}</p></Card>
        <Card><p className="text-sm text-ink/60">Loans awaiting decision</p><p className="font-display text-xl font-bold">{kes(data.loanBook.pending)}</p></Card>
      </div>
      <Card>
        <h2 className="mb-4 font-medium">Collected each {data.noun}, out of what was due</h2>
        <ul className="flex h-48 items-end gap-3">
          {data.series.map((m) => (
            <li key={m.period} className="flex h-full flex-1 flex-col justify-end text-center">
              <p className="mb-1 text-xs text-ink/60">{kes(m.collected)}</p>
              <div role="img" aria-label={`${periodLabel(m.period)}: ${kes(m.collected)} of ${kes(m.expected)}`}
                className="relative w-full rounded-t bg-ink/10" style={{ height: `${(m.expected / top) * 80}%` }}>
                <div className="absolute inset-x-0 bottom-0 rounded-t bg-brand" style={{ height: `${(m.collected / m.expected) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs font-medium">{periodLabel(m.period)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
