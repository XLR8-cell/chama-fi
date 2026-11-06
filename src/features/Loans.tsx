import { useState, type FormEvent } from 'react'
import { Badge, Button, Card, ErrorNote, Skeleton } from '../components/ui'
import { useApp } from '../context'
import { useApi } from '../hooks'
import { instalment, kes } from '../lib/format'
import { loanMark } from '../lib/status'
import { api } from '../mocks/api'

export default function Loans() {
  const { meId, can, refresh, toast } = useApp()
  const { data, error, loading } = useApi(api.loans)
  const [amount, setAmount] = useState(10000)
  const [months, setMonths] = useState(6)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try { await api.requestLoan(meId, amount, months); toast('Loan request sent to the treasurer.'); refresh() }
    catch (err) { toast((err as Error).message, 'error') }
  }
  async function decide(id: string, approve: boolean) {
    await api.decideLoan(id, approve)
    toast(approve ? 'Loan approved.' : 'Loan rejected.')
    setConfirming(null)
    refresh()
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Loans</h1>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium">Amount (KES)
            <input type="number" min={1000} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-ink/20 p-2" /></label>
          <label className="text-sm font-medium">Repay over
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-ink/20 p-2">
              {[3, 6, 9, 12].map((m) => <option key={m} value={m}>{m} months</option>)}
            </select></label>
          <Button type="submit">Request loan</Button>
        </form>
        <p className="mt-3 text-sm text-ink/60">You would repay about {kes(instalment(amount, months))} each month.</p>
      </Card>
      {error ? <ErrorNote message={error} /> : loading || !data ? <Skeleton className="h-40" /> : data.length === 0 ? <Card><p>No loans yet. Request one above to get started.</p></Card> : (
        <ul className="space-y-3">
          {data.map((l) => (
            <li key={l.id}><Card className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-medium">{l.name}: {kes(l.amount)}</p><p className="text-sm text-ink/60">{l.months} months, {kes(instalment(l.amount, l.months))} a month</p></div>
              {l.status === 'pending' && can('loans.decide') ? (
                <div className="flex gap-2"><Button onClick={() => decide(l.id, true)}>Approve</Button>{confirming === l.id
                    ? <Button variant="danger" onClick={() => decide(l.id, false)}>Confirm reject</Button>
                    : <Button variant="ghost" onClick={() => setConfirming(l.id)}>Reject</Button>}</div>
              ) : <Badge tone={l.status === 'approved' ? 'ok' : l.status === 'pending' ? 'warn' : 'bad'}>{loanMark[l.status]} {l.status}</Badge>}
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  )
}
