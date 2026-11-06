import type { ReactNode } from 'react'

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-deep via-deep to-brand/40 p-10 text-white md:flex md:flex-col md:justify-between">
        <p className="font-display text-2xl font-bold">Chama-Fi</p>
        <div>
          <p className="font-display text-4xl font-bold leading-tight">Every shilling in the chama, in plain sight.</p>
          <p className="mt-3 max-w-sm text-white/70">Contributions, loans and member standing in one place, so nobody has to scroll through WhatsApp to see who has paid.</p>
        </div>
        <p className="text-sm text-white/50">Weekly, fortnightly or monthly chamas</p>
      </div>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <p className="mb-6 font-display text-xl font-bold md:hidden">Chama-Fi</p>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink/60">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  )
}
