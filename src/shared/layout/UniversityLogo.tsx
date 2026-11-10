import logoUrl from './mondragon-logo.png'
import './UniversityLogo.css'

// The size of the image file, so the browser reserves the space before it loads.
const LOGO_WIDTH = 619
const LOGO_HEIGHT = 198

// The official Mondragon Unibertsitatea logo. It sits on a light plate in the night theme,
// because its dark lettering would not be readable on the dark page (see .university-mark in UniversityLogo.css).
export function UniversityLogo() {
  return (
    <span className="university-mark">
      <img
        className="university-logo"
        src={logoUrl}
        alt="Mondragon Unibertsitatea, Goi Eskola Politeknikoa"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
      />
    </span>
  )
}
