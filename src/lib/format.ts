export const kes = (n: number) => `KES ${n.toLocaleString('en-US')}`
export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' })

export const LOAN_RATE = 0.015 // flat, per month
export const maxLoan = (savings: number) => savings * 3
export const instalment = (amount: number, months: number) => {
  if (months <= 0) return 0
  // Round the total to cents first so floating-point noise (13080.000000000002) can't bump the ceiling.
  const total = Math.round(amount * (1 + LOAN_RATE * months) * 100) / 100
  return Math.ceil(total / months)
}

/** A period key is a month ('2026-11'), an ISO week ('2026-W45') or a fortnight ('2026-F23' = weeks 45-46). */
const fortnightWeeks = (p: string) => {
  const n = Number(p.split('-F')[1])
  return `${2 * n - 1}-${2 * n}`
}
export const periodLabel = (p: string) =>
  p.includes('-W') ? `Wk ${p.split('-W')[1]}` : p.includes('-F') ? `Wk ${fortnightWeeks(p)}` : monthLabel(p)
export const periodName = (p: string) =>
  p.includes('-W')
    ? `Week ${p.split('-W')[1]}`
    : p.includes('-F')
      ? `Weeks ${fortnightWeeks(p)}`
      : new Date(`${p}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long' })
