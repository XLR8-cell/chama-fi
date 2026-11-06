import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm shadow-ink/5 ${className}`}>{children}</section>
)

const tones = {
  ok: 'bg-brand/15 text-brand', warn: 'bg-gold/25 text-ink', bad: 'bg-danger/10 text-danger', grey: 'bg-ink/5 text-ink/60',
}
export const Badge = ({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
)

const variants = {
  primary: 'bg-brand text-onbrand hover:bg-brand/90',
  ghost: 'border border-ink/15 hover:bg-ink/5',
  danger: 'border border-danger/40 text-danger hover:bg-danger/5',
}
export const Button = ({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) => (
  <button {...p} className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} />
)

export const Field = ({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <label className="block text-sm font-medium">
    {label}
    <input {...p} className="mt-1 w-full rounded-xl border border-ink/20 bg-surface p-2.5 font-normal" />
  </label>
)

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div aria-hidden className={`animate-pulse rounded-xl bg-ink/10 ${className}`} />
)

export const ErrorNote = ({ message }: { message: string }) => (
  <p className="rounded-xl bg-danger/10 p-4 text-sm text-danger">Could not load this page: {message}. Refresh to try again.</p>
)
