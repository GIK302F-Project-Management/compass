import { Link } from 'react-router'
import { CompassRose } from './MapShapes'
import mgepLogo from '../assets/mgep-logo.png'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Compass, MGEP - go to the main page">
      <svg className="logo-rose" viewBox="-16 -16 32 32" aria-hidden="true">
        <CompassRose size={13} />
      </svg>
      <span className="logo-name">Compass</span>
      <img className="logo-mgep" src={mgepLogo} alt="" />
    </Link>
  )
}
