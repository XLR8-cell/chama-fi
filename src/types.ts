export type Frequency = 'weekly' | 'fortnightly' | 'monthly'
export type Role = 'chair' | 'treasurer' | 'secretary' | 'member'
export type PayStatus = 'paid' | 'pending' | 'late'
export type LoanStatus = 'pending' | 'approved' | 'rejected'

export interface Member { id: string; name: string; phone: string; email: string; role: Role }
/** Mock credentials. A real backend would store a salted hash, never the password. */
export interface Account { memberId: string; email: string; password: string }
export interface PasswordReset { email: string; code: string; expiresAt: number; attempts: number }
export interface Reminder { memberId: string; at: number }
export interface Contribution { id: string; memberId: string; period: string; amount: number; status: PayStatus }
export interface Loan { id: string; memberId: string; amount: number; months: number; status: LoanStatus }
