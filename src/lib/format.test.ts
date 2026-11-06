import { describe, expect, it } from 'vitest'
import { instalment, kes, maxLoan, periodLabel, periodName } from './format'

describe('format helpers', () => {
  it('formats KES', () => expect(kes(12000)).toBe('KES 12,000'))
  it('caps loans at 3x savings', () => expect(maxLoan(10000)).toBe(30000))
  it('computes monthly instalment with flat interest', () => {
    expect(instalment(12000, 6)).toBe(2180)
    expect(instalment(12000, 0)).toBe(0)
    expect(instalment(10000, 4)).toBe(2650)
    expect(instalment(9000, 3)).toBe(3135)
  })
  it('labels weekly and monthly periods', () => {
    expect(periodLabel('2026-W45')).toBe('Wk 45')
    expect(periodLabel('2026-11')).toBe('Nov')
    expect(periodName('2026-11')).toBe('November')
    expect(periodLabel('2026-F23')).toBe('Wk 45-46')
    expect(periodName('2026-F23')).toBe('Weeks 45-46')
  })
})
