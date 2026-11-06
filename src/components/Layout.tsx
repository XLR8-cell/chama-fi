import { Link, NavLink, Outlet } from 'react-router-dom'
import { useApp, type ThemePref } from '../context'
import { isOfficial, roleLabel } from '../lib/roles'
import { Badge, Button } from './ui'

const baseLinks = [['/', 'Home'], ['/contributions', 'Contributions'], ['/loans', 'Loans'], ['/members', 'Members'], ['/reports', 'Reports']]
const themes: [ThemePref, string][] = [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]

export default function Layout() {
  const { user, signOut, themePref, setThemePref } = useApp()
  if (!user) return null
  const links = isOfficial(user.role) ? [...baseLinks, ['/manage', 'Manage']] : baseLinks
  const nav = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-2.5 py-2 text-xs font-medium md:px-3 md:text-sm ${isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10'}`
  const official = isOfficial(user.role)

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      <aside className="hidden flex-col gap-1 bg-deep p-5 md:sticky md:top-0 md:flex md:h-screen">
        <p className="mb-6 font-display text-2xl font-bold text-white">Chama-Fi</p>
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={nav}>{label}</NavLink>)}
        <NavLink to="/profile" className="mt-auto rounded-xl bg-white/10 p-3 text-sm text-white hover:bg-white/15">
          <p className="font-medium">{user.name}</p>
          <p className="text-white/60">{roleLabel[user.role]}</p>
        </NavLink>
      </aside>
      <div className="pb-20 md:pb-0">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-surface/85 px-5 py-3 backdrop-blur">
          <p className="font-display text-lg font-bold md:hidden">Chama-Fi</p>
          <p className="hidden text-sm text-ink/60 md:block">Umoja Savings Group, Nairobi</p>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Colour theme" className="flex rounded-xl bg-ink/5 p-0.5 text-xs">
              {themes.map(([v, label]) => (
                <button key={v} aria-pressed={themePref === v} onClick={() => setThemePref(v)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium ${themePref === v ? 'bg-surface shadow-sm' : 'text-ink/60'}`}>{label}</button>
              ))}
            </div>
            <Link to="/profile" aria-label="Your profile">
              <Badge tone={official ? 'warn' : 'grey'}>{official ? `Official: ${roleLabel[user.role]}` : roleLabel[user.role]}</Badge>
            </Link>
            <Button variant="ghost" onClick={signOut} className="!min-h-9 px-3">Sign out</Button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-5"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around bg-deep p-2 md:hidden">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={nav}>{label}</NavLink>)}
      </nav>
    </div>
  )
}
