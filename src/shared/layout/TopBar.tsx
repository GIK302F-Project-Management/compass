import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { UniversityLogo } from './UniversityLogo'
import './TopBar.css'

type TopBarProps = {
  title?: string
  actions?: ReactNode
}

// The header of every page: the Compass and university logos, the page title and the page's actions.
export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand">
        <Logo />
        <UniversityLogo />
      </div>
      {title && <h1 className="top-bar-title">{title}</h1>}
      <div className="top-bar-actions">{actions}</div>
    </header>
  )
}
