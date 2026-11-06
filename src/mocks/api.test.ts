import { beforeEach, describe, expect, it } from 'vitest'
import { api } from './api'
import { ME, currentPeriod, db, plan, resetDb } from './db'

beforeEach(resetDb)

describe('mock api', () => {
  it('marks a contribution as paid after the STK push', async () => {
    const before = await api.summary(ME)
    await api.pay(ME, currentPeriod())
    const after = await api.summary(ME)
    expect(after.mySavings).toBe(before.mySavings + plan().amount)
  })

  it('rejects loans above 3x savings', async () => {
    await expect(api.requestLoan(ME, 1_000_000, 6)).rejects.toThrow(/up to/)
  })

  it('accepts an eligible loan and lets the treasurer approve it', async () => {
    const loan = await api.requestLoan(ME, 10000, 4)
    expect(loan.status).toBe('pending')
    expect((await api.decideLoan(loan.id, true)).status).toBe('approved')
  })
})

describe('treasurer actions and reports', () => {
  it('records a payment for a member', async () => {
    const before = await api.summary('m4')
    await api.recordPayment('m4', currentPeriod())
    expect((await api.summary('m4')).mySavings).toBeGreaterThanOrEqual(before.mySavings)
    expect((await api.grid()).rows[3].cells.at(-1)?.status).toBe('paid')
  })

  it('reports a collection rate between 0 and 1 and a loan book', async () => {
    const r = await api.reports()
    expect(r.rate).toBeGreaterThan(0)
    expect(r.rate).toBeLessThanOrEqual(1)
    expect(r.loanBook.pending).toBe(15000)
  })
})

describe('weekly contributions', () => {
  it('switches to eight weekly periods with a smaller amount', async () => {
    await api.setFrequency('weekly')
    const grid = await api.grid()
    expect(grid.frequency).toBe('weekly')
    expect(grid.periods).toHaveLength(8)
    expect(grid.current).toBe('2026-W45')
    expect(grid.amount).toBe(1000)
  })

  it('reports per week once weekly is chosen', async () => {
    await api.setFrequency('weekly')
    expect((await api.reports()).noun).toBe('week')
  })
})

describe('fortnightly contributions', () => {
  it('switches to six fortnights covering weeks 45-46 now', async () => {
    await api.setFrequency('fortnightly')
    const grid = await api.grid()
    expect(grid.periods).toHaveLength(6)
    expect(grid.current).toBe('2026-F23')
    expect(grid.amount).toBe(1500)
    expect((await api.reports()).noun).toBe('fortnight')
  })
})

describe('accounts and roles', () => {
  it('signs in a seeded account, ignoring case and spaces', async () => {
    expect((await api.signIn(' Otieno@umoja.co.ke ', 'chama123')).role).toBe('treasurer')
  })

  it('rejects a wrong password', async () => {
    await expect(api.signIn('otieno@umoja.co.ke', 'nope')).rejects.toThrow(/incorrect/)
  })

  it('signs up a plain member who owes only the current period', async () => {
    const m = await api.signUp({ name: 'Amina Yusuf', phone: '0722 000 111', email: 'amina@example.com', password: 'longenough', code: 'umoja' })
    expect(m.role).toBe('member')
    const row = (await api.grid()).rows.find((r) => r.member.id === m.id)!
    expect(row.cells.filter(Boolean)).toHaveLength(1)
  })

  it('rejects a wrong chama code and a duplicate email', async () => {
    const base = { name: 'Amina Yusuf', phone: '0722000111', email: 'amina@example.com', password: 'longenough' }
    await expect(api.signUp({ ...base, code: 'WRONG' })).rejects.toThrow(/chama code/)
    await expect(api.signUp({ ...base, email: 'wanjiru@umoja.co.ke', code: 'UMOJA' })).rejects.toThrow(/already exists/)
  })

  it('keeps signed-up members when the schedule changes', async () => {
    const m = await api.signUp({ name: 'Amina Yusuf', phone: '0722000111', email: 'amina@example.com', password: 'longenough', code: 'UMOJA' })
    await api.setFrequency('weekly')
    expect((await api.members()).some((x) => x.id === m.id)).toBe(true)
  })
})

describe('password reset', () => {
  it('resets a password with the emailed code, then signs in with the new one', async () => {
    const { demoCode } = await api.requestPasswordReset(' Wanjiru@umoja.co.ke ')
    expect(demoCode).toMatch(/^\d{6}$/)
    await api.resetPassword('wanjiru@umoja.co.ke', demoCode!, 'brandnew123')
    await expect(api.signIn('wanjiru@umoja.co.ke', 'chama123')).rejects.toThrow(/incorrect/)
    expect((await api.signIn('wanjiru@umoja.co.ke', 'brandnew123')).id).toBe('m1')
  })

  it('gives no code for an unknown email, and the same call succeeds', async () => {
    expect((await api.requestPasswordReset('nobody@example.com')).demoCode).toBeNull()
  })

  it('rejects a wrong code, and locks the code after five wrong tries', async () => {
    const { demoCode } = await api.requestPasswordReset('otieno@umoja.co.ke')
    for (let i = 0; i < 5; i++) await expect(api.resetPassword('otieno@umoja.co.ke', '000000', 'brandnew123')).rejects.toThrow(/not valid/)
    await expect(api.resetPassword('otieno@umoja.co.ke', demoCode!, 'brandnew123')).rejects.toThrow(/not valid/)
  })

  it('rejects an expired code and a short password', async () => {
    const { demoCode } = await api.requestPasswordReset('achieng@umoja.co.ke')
    await expect(api.resetPassword('achieng@umoja.co.ke', demoCode!, 'short')).rejects.toThrow(/8 characters/)
    db.resets[0].expiresAt = Date.now() - 1
    await expect(api.resetPassword('achieng@umoja.co.ke', demoCode!, 'brandnew123')).rejects.toThrow(/expired/)
  })
})

describe('profile', () => {
  it('summarises a member\'s own contributions and loans', async () => {
    const p = await api.profile('m4')
    expect(p.member.name).toBe('Mwangi Njoroge')
    expect(p.contributions).toHaveLength(plan().periods.length)
    expect(p.counts.paid + p.counts.pending + p.counts.late).toBe(p.contributions.length)
    expect(p.loans).toHaveLength(1)
  })

  it('changes a password only with the correct current one', async () => {
    await expect(api.changePassword(ME, 'wrong', 'newpassword1')).rejects.toThrow(/current password/)
    await expect(api.changePassword(ME, 'chama123', 'short')).rejects.toThrow(/8 characters/)
    await expect(api.changePassword(ME, 'chama123', 'chama123')).rejects.toThrow(/different/)
    await api.changePassword(ME, 'chama123', 'newpassword1')
    expect((await api.signIn('wanjiru@umoja.co.ke', 'newpassword1')).id).toBe(ME)
  })
})

describe('officials: collections and reminders', () => {
  it('lists who has not paid this period', async () => {
    const c = await api.collections()
    expect(c.unpaid.map((u) => u.memberId)).toEqual(['m1', 'm4', 'm7'])
    expect(c.paid).toBe(c.total - 3)
    await api.recordPayment('m1', currentPeriod())
    expect((await api.collections()).unpaid).toHaveLength(2)
  })

  it('records when a member was last reminded', async () => {
    await api.remind('m4')
    const row = (await api.collections()).unpaid.find((u) => u.memberId === 'm4')
    expect(row?.lastReminded).not.toBeNull()
  })

  it('reminds everyone who has not paid', async () => {
    expect(await api.remindAll()).toBe(3)
  })
})
