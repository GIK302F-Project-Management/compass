import { Link } from 'react-router'
import { CompassRose } from './MapShapes'

// "MGEP" tag is a placeholder until the official MGEP logo file is added to src/assets.
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Compass, MGEP - go to the main page">
      <svg className="logo-rose" viewBox="-16 -16 32 32" aria-hidden="true">
        <CompassRose size={13} />
      </svg>
      <span className="logo-name">Compass</span>
      <span className="logo-tag">MGEP</span>
    </Link>
  )
}
