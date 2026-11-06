import type { Account, Contribution, PasswordReset, Reminder, Frequency, Loan, Member, Role } from '../types'

/** Each chama pays on a schedule: a few months of history, a few fortnights, or a few weeks. */
export const PLANS: Record<Frequency, { periods: string[]; amount: number }> = {
  weekly: { periods: ['2026-W38', '2026-W39', '2026-W40', '2026-W41', '2026-W42', '2026-W43', '2026-W44', '2026-W45'], amount: 1000 },
  fortnightly: { periods: ['2026-F18', '2026-F19', '2026-F20', '2026-F21', '2026-F22', '2026-F23'], amount: 1500 },
  monthly: { periods: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'], amount: 2000 },
}
export const NOUN: Record<Frequency, string> = { weekly: 'week', fortnightly: 'fortnight', monthly: 'month' }
export const ME = 'm1' // a plain member, used as a fixture in tests
export const CHAMA_CODE = 'UMOJA'
export const DEMO_PASSWORD = 'chama123'

const people: [string, Role][] = [
  ['Wanjiru Kamau', 'member'], ['Otieno Odhiambo', 'treasurer'], ['Achieng Ouma', 'secretary'],
  ['Mwangi Njoroge', 'member'], ['Fatuma Hassan', 'member'], ['Kiprop Rotich', 'chair'],
  ['Njeri Waweru', 'member'], ['Baraka Mutua', 'member'],
]

export const db = {
  frequency: 'monthly' as Frequency,
  members: [] as Member[],
  accounts: [] as Account[],
  resets: [] as PasswordReset[],
  reminders: [] as Reminder[],
  contributions: [] as Contribution[],
  loans: [] as Loan[],
}
export const plan = () => PLANS[db.frequency]
export const currentPeriod = () => plan().periods[plan().periods.length - 1]
export const findMember = (id: string) => db.members.find((m) => m.id === id)

/** Rebuilds contributions for every member. People who joined later only owe the current period. */
export function buildContributions() {
  const { periods, amount } = plan()
  const last = periods.length - 1
  db.contributions = db.members.flatMap((m, i): Contribution[] =>
    i >= people.length
      ? [{ id: `${m.id}-${periods[last]}`, memberId: m.id, period: periods[last], amount, status: 'pending' }]
      : periods.map((period, j): Contribution => ({
          id: `${m.id}-${period}`, memberId: m.id, period, amount,
          status: j === last ? (i % 3 === 0 ? 'pending' : 'paid') : (i * 7 + j) % 11 === 0 ? 'late' : 'paid',
        })),
  )
}

export function seed() {
  db.members = people.map(([name, role], i) => ({
    id: `m${i + 1}`, name, role, phone: `07${12 + i}${300 + i * 17}${100 + i * 31}`,
    email: `${name.split(' ')[0].toLowerCase()}@umoja.co.ke`,
  }))
  db.accounts = db.members.map((m) => ({ memberId: m.id, email: m.email, password: DEMO_PASSWORD }))
  db.resets = []
  db.reminders = []
  db.loans = [
    { id: 'l1', memberId: 'm4', amount: 15000, months: 6, status: 'pending' },
    { id: 'l2', memberId: 'm5', amount: 9000, months: 3, status: 'approved' },
  ]
  buildContributions()
}

const KEY = 'chama-fi-db-v3'
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* storage unavailable */ }
}
export function resetDb() {
  db.frequency = 'monthly'
  seed()
  save()
}
function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { Object.assign(db, JSON.parse(raw)); return }
  } catch { /* fall through to seed */ }
  seed()
}
load()
