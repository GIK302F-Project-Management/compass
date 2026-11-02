import type { ReactNode } from 'react'
import { Logo } from './Logo'

type TopBarProps = {
  title?: string
  actions?: ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="top-bar">
      <Logo />
      {title && <h1 className="top-bar-title">{title}</h1>}
      <div className="top-bar-actions">{actions}</div>
    </header>
  )
}
