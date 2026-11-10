import type { MouseEvent } from 'react'
import { MAIN_ID } from './Main'
import './SkipLink.css'

// First thing a keyboard user reaches: jumps over the header and navigation to the page content.
export function SkipLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault() // a plain "#main-content" link would also change the address
    const main = document.getElementById(MAIN_ID)
    main?.focus()
    main?.scrollIntoView()
  }

  return (
    <a className="skip-link" href={`#${MAIN_ID}`} onClick={handleClick}>
      Skip to content
    </a>
  )
}
