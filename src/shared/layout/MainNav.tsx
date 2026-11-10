import { Link, useLocation } from 'react-router'
import './MainNav.css'

type NavItem = {
  to: string
  label: string
  // Pages that belong to this section without being its main page (an activity belongs to the atlas).
  alsoUnder?: string
}

const ITEMS: NavItem[] = [
  { to: '/home', label: 'Atlas', alsoUnder: '/activity' },
  { to: '/plans', label: 'Shared plans', alsoUnder: '/plans' },
  { to: '/goals', label: 'Goals' },
  { to: '/planner', label: 'Planner' },
]

function isCurrent(item: NavItem, pathname: string): boolean {
  return pathname === item.to || (item.alsoUnder !== undefined && pathname.startsWith(`${item.alsoUnder}/`))
}

// The places a logged-in student can go. The current one is marked, for sight and for screen readers.
export function MainNav() {
  const { pathname } = useLocation()

  return (
    <nav className="main-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <Link key={item.to} to={item.to} aria-current={isCurrent(item, pathname) ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
