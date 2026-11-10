import type { ReactNode } from 'react'
import './Main.css'

export const MAIN_ID = 'main-content'

type MainProps = {
  className?: string
  children: ReactNode
}

// The main landmark of every page. The skip link jumps here, so it needs the same id on every page.
export function Main({ className, children }: MainProps) {
  return (
    <main id={MAIN_ID} tabIndex={-1} className={className}>
      {children}
    </main>
  )
}
