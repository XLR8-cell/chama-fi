import type { LoanStatus, PayStatus } from '../types'

// Every status gets a symbol as well as a colour, so meaning never depends on colour alone.
export const statusTone: Record<PayStatus, 'ok' | 'warn' | 'bad'> = { paid: 'ok', pending: 'warn', late: 'bad' }
export const statusMark: Record<PayStatus, string> = { paid: '✓', pending: '…', late: '!' }
export const loanTone: Record<LoanStatus, 'ok' | 'warn' | 'bad'> = { approved: 'ok', pending: 'warn', rejected: 'bad' }
export const loanMark: Record<LoanStatus, string> = { approved: '✓', pending: '…', rejected: '✕' }
