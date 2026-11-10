import { Link } from 'react-router'
import { Main } from '@/shared/layout/Main'
import { TopBar } from '@/shared/layout/TopBar'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <>
      <TopBar />
      <Main className="status-page">
        <p className="kicker">404 · Off the map</p>
        <h1>This route doesn't exist yet.</h1>
        <p>The page you're looking for isn't on any sheet. Head back and pick another path.</p>
        <Link to="/" className="button button-primary">
          Back to the main page
        </Link>
      </Main>
    </>
  )
}
