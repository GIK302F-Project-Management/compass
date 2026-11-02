import { Link } from 'react-router'
import { TopBar } from '../components/TopBar'

export function NotFound() {
  return (
    <>
      <TopBar />
      <main className="lost">
        <p className="kicker">404 · Off the map</p>
        <h1>This route doesn't exist yet.</h1>
        <p>The page you're looking for isn't on any sheet. Head back and pick another path.</p>
        <Link to="/" className="button button-primary">
          Back to the main page
        </Link>
      </main>
    </>
  )
}
