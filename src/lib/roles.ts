import type { Role } from '../types'

export type Action = 'loans.decide' | 'payments.record' | 'reminders.send' | 'schedule.change'

const grants: Record<Action, Role[]> = {
  'loans.decide': ['chair', 'treasurer'],
  'payments.record': ['treasurer'],
  'reminders.send': ['treasurer', 'secretary'],
  'schedule.change': ['chair', 'treasurer'],
}

export const can = (role: Role, action: Action) => grants[action].includes(role)
export const isOfficial = (role: Role) => role !== 'member'
export const roleLabel: Record<Role, string> = {
  chair: 'Chairperson', treasurer: 'Treasurer', secretary: 'Secretary', member: 'Member',
}

const actionLabels: Record<Action, string> = {
  'loans.decide': 'Approve or reject loans',
  'payments.record': 'Record member payments',
  'reminders.send': 'Send payment reminders',
  'schedule.change': 'Change the contribution schedule',
}
export const permissionsFor = (role: Role) =>
  (Object.keys(grants) as Action[]).map((a) => ({ label: actionLabels[a], allowed: grants[a].includes(role) }))
