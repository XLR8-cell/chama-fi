import { Badge, Card, ErrorNote, Skeleton } from '../components/ui'
import { useApi } from '../hooks'
import { kes } from '../lib/format'
import { api } from '../mocks/api'

export default function Members() {
  const { data, error, loading } = useApi(api.members)
  if (error) return <ErrorNote message={error} />
  if (loading || !data) return <Skeleton className="h-80" />
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Members</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.map((m) => (
          <li key={m.id}><Card className="flex items-center justify-between">
            <div><p className="font-medium">{m.name}</p><p className="text-sm text-ink/60">{m.phone}</p></div>
            <div className="text-right"><p className="font-display font-bold">{kes(m.savings)}</p>{m.role !== 'member' && <Badge tone="warn">{m.role}</Badge>}</div>
          </Card></li>
        ))}
      </ul>
    </div>
  )
}
