import { describe, expect, it } from 'vitest'
import { can, isOfficial } from './roles'

describe('roles', () => {
  it('lets only the treasurer record payments', () => {
    expect(can('treasurer', 'payments.record')).toBe(true)
    expect(can('secretary', 'payments.record')).toBe(false)
    expect(can('member', 'payments.record')).toBe(false)
  })
  it('lets the chair and treasurer decide loans, but not members', () => {
    expect(can('chair', 'loans.decide')).toBe(true)
    expect(can('member', 'loans.decide')).toBe(false)
  })
  it('lets the secretary send reminders', () => expect(can('secretary', 'reminders.send')).toBe(true))
  it('tells officials from members', () => {
    expect(isOfficial('chair')).toBe(true)
    expect(isOfficial('member')).toBe(false)
  })
})
