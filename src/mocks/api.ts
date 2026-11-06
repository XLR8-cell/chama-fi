import type { Contribution, Frequency, Loan, Member } from '../types'
import { maxLoan, periodName } from '../lib/format'
import { CHAMA_CODE, NOUN, buildContributions, currentPeriod, db, plan, resetDb, save } from './db'

const wait = (ms = 600) =>
  import.meta.env.MODE === 'test' ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms))

const savings = (id: string) =>
  db.contributions.filter((c) => c.memberId === id && c.status === 'paid').reduce((s, c) => s + c.amount, 0)
const nameOf = (id: string) => db.members.find((m) => m.id === id)?.name ?? 'Unknown'

export const api = {
  async summary(meId: string) {
    await wait()
    const cur = currentPeriod()
    const thisPeriod = db.contributions.filter((c) => c.period === cur)
    return {
      pool: db.contributions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
      mySavings: savings(meId),
      periodName: periodName(cur),
      amount: plan().amount,
      frequency: db.frequency,
      noun: NOUN[db.frequency],
      dots: thisPeriod.map((c) => ({ id: c.memberId, name: nameOf(c.memberId), paid: c.status === 'paid' })),
      nextPayout: db.members[(Number(cur.slice(-2)) - 1) % db.members.length].name,
      pendingLoans: db.loans.filter((l) => l.status === 'pending').length,
    }
  },

  async grid() {
    await wait()
    return {
      periods: plan().periods,
      current: currentPeriod(),
      amount: plan().amount,
      frequency: db.frequency,
      rows: db.members.map((member) => ({
        member,
        cells: plan().periods.map((p) => db.contributions.find((c) => c.memberId === member.id && c.period === p)),
      })),
    }
  },

  /** Simulates an M-Pesa STK push. */
  async pay(memberId: string, period: string) {
    await wait(1800)
    const c = db.contributions.find((x) => x.memberId === memberId && x.period === period)
    if (!c) throw new Error('No contribution found for that period.')
    c.status = 'paid'
    save()
    return { ref: `QK${(c.id.length * 7919 + period.length * 104729).toString(36).toUpperCase()}`, amount: plan().amount }
  },

  async members(): Promise<(Member & { savings: number })[]> {
    await wait()
    return db.members.map((m) => ({ ...m, savings: savings(m.id) }))
  },

  async loans(): Promise<(Loan & { name: string })[]> {
    await wait()
    return db.loans.map((l) => ({ ...l, name: nameOf(l.memberId) })).reverse()
  },

  async requestLoan(memberId: string, amount: number, months: number) {
    await wait()
    const limit = maxLoan(savings(memberId))
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount above zero.')
    if (amount > limit) throw new Error(`You can borrow up to KES ${limit.toLocaleString('en-US')} (3x your savings).`)
    const loan: Loan = { id: `l${db.loans.length + 1}`, memberId, amount, months, status: 'pending' }
    db.loans.push(loan)
    save()
    return loan
  },

  async decideLoan(id: string, approve: boolean) {
    await wait(400)
    const loan = db.loans.find((l) => l.id === id)
    if (!loan) throw new Error('Loan not found.')
    loan.status = approve ? 'approved' : 'rejected'
    save()
    return loan
  },

  /** Treasurer: record a cash or paybill payment for a member. */
  async recordPayment(memberId: string, period: string) {
    await wait(400)
    const c = db.contributions.find((x) => x.memberId === memberId && x.period === period)
    if (!c) throw new Error('No contribution found for that period.')
    c.status = 'paid'
    save()
    return nameOf(memberId)
  },

  /** Treasurer: nudge a member (simulated SMS). */
  async remind(memberId: string) {
    await wait(400)
    db.reminders.push({ memberId, at: Date.now() })
    save()
    return nameOf(memberId)
  },

  /** Treasurer or secretary: remind everyone who has not paid this period. Returns how many were reminded. */
  async remindAll() {
    await wait(500)
    const period = currentPeriod()
    const ids = db.contributions.filter((c) => c.period === period && c.status !== 'paid').map((c) => c.memberId)
    const at = Date.now()
    ids.forEach((memberId) => db.reminders.push({ memberId, at }))
    save()
    return ids.length
  },

  async collections() {
    await wait()
    const period = currentPeriod()
    const rows = db.contributions.filter((c) => c.period === period)
    const unpaid = rows.filter((c) => c.status !== 'paid').map((c) => ({
      memberId: c.memberId, name: nameOf(c.memberId), status: c.status, amount: c.amount,
      lastReminded: db.reminders.filter((r) => r.memberId === c.memberId).reduce((t, r) => Math.max(t, r.at), 0) || null,
    }))
    return {
      period, paid: rows.length - unpaid.length, total: rows.length, unpaid,
      amount: plan().amount, frequency: db.frequency, noun: NOUN[db.frequency],
      pendingLoans: db.loans.filter((l) => l.status === 'pending').length,
    }
  },

  async reports() {
    await wait()
    const series = plan().periods.map((period) => {
      const cs = db.contributions.filter((c) => c.period === period)
      return {
        period,
        collected: cs.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
        expected: cs.reduce((s, c) => s + c.amount, 0),
      }
    })
    const loanSum = (st: Loan['status']) => db.loans.filter((l) => l.status === st).reduce((s, l) => s + l.amount, 0)
    const collected = series.reduce((s, m) => s + m.collected, 0)
    const expected = series.reduce((s, m) => s + m.expected, 0)
    return {
      series, noun: NOUN[db.frequency],
      rate: expected ? collected / expected : 0,
      loanBook: { approved: loanSum('approved'), pending: loanSum('pending') },
    }
  },

  /** Treasurer: switch the group between weekly and monthly contributions (reseeds demo data). */
  async setFrequency(f: Frequency) {
    await wait(400)
    db.frequency = f
    buildContributions()
    save()
  },

  async signIn(email: string, password: string): Promise<Member> {
    await wait(500)
    const key = email.trim().toLowerCase()
    const account = db.accounts.find((a) => a.email === key && a.password === password)
    const member = account && db.members.find((m) => m.id === account.memberId)
    if (!member) throw new Error('Email or password is incorrect.')
    return member
  },

  /** New sign-ups always join as plain members. Officials are appointed by the group. */
  async signUp(input: { name: string; phone: string; email: string; password: string; code: string }): Promise<Member> {
    await wait(700)
    const email = input.email.trim().toLowerCase()
    const phone = input.phone.replace(/\s/g, '')
    if (input.name.trim().length < 2) throw new Error('Enter your full name.')
    if (!/^(07|01)\d{8}$/.test(phone)) throw new Error('Enter a Kenyan phone number like 0712 345 678.')
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.')
    if (input.password.length < 8) throw new Error('Use a password of at least 8 characters.')
    if (input.code.trim().toUpperCase() !== CHAMA_CODE) throw new Error('That chama code is not valid. Ask your secretary for the right one.')
    if (db.accounts.some((a) => a.email === email)) throw new Error('An account with this email already exists. Sign in instead.')
    const member: Member = { id: `m${db.members.length + 1}`, name: input.name.trim(), phone, email, role: 'member' }
    db.members.push(member)
    db.accounts.push({ memberId: member.id, email, password: input.password })
    const period = currentPeriod()
    db.contributions.push({ id: `${member.id}-${period}`, memberId: member.id, period, amount: plan().amount, status: 'pending' })
    save()
    return member
  },

  async profile(memberId: string) {
    await wait()
    const member = db.members.find((m) => m.id === memberId)
    if (!member) throw new Error('Member not found.')
    const contributions = db.contributions.filter((c) => c.memberId === memberId)
    const count = (s: Contribution['status']) => contributions.filter((c) => c.status === s).length
    return {
      member, savings: savings(memberId), contributions,
      loans: db.loans.filter((l) => l.memberId === memberId),
      counts: { paid: count('paid'), pending: count('pending'), late: count('late') },
    }
  },

  async changePassword(memberId: string, current: string, next: string) {
    await wait(500)
    const account = db.accounts.find((a) => a.memberId === memberId)
    if (!account || account.password !== current) throw new Error('Your current password is not correct.')
    if (next.length < 8) throw new Error('Use a password of at least 8 characters.')
    if (next === current) throw new Error('Choose a new password that is different from the current one.')
    account.password = next
    save()
  },

  /** Starts a reset. The code is returned only so the demo can show it; a real app emails it. */
  async requestPasswordReset(email: string): Promise<{ demoCode: string | null }> {
    await wait(500)
    const key = email.trim().toLowerCase()
    db.resets = db.resets.filter((r) => r.email !== key)
    if (!db.accounts.some((a) => a.email === key)) return { demoCode: null } // same reply either way
    const code = String(Math.floor(100000 + Math.random() * 900000))
    db.resets.push({ email: key, code, expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 })
    save()
    return { demoCode: code }
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    await wait(600)
    const key = email.trim().toLowerCase()
    if (newPassword.length < 8) throw new Error('Use a password of at least 8 characters.')
    const invalid = new Error('That code is not valid or has expired. Request a new one.')
    const reset = db.resets.find((r) => r.email === key)
    const account = db.accounts.find((a) => a.email === key)
    if (!reset || !account || reset.expiresAt < Date.now() || reset.attempts >= 5) throw invalid
    if (reset.code !== code.trim()) {
      reset.attempts += 1
      save()
      throw invalid
    }
    account.password = newPassword
    db.resets = db.resets.filter((r) => r !== reset)
    save()
  },

  async resetDemo() {
    resetDb()
  },
}
