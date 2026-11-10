import { Link } from 'react-router'
import { CompassRose } from '@/shared/ui/MapShapes'
import './Logo.css'

// The Compass brand: the rose and the name. It always links to the main page.
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Compass - go to the main page">
      <svg className="logo-rose" viewBox="-16 -16 32 32" aria-hidden="true">
        <CompassRose size={13} />
      </svg>
      <span className="logo-name">Compass</span>
    </Link>
  )
}
