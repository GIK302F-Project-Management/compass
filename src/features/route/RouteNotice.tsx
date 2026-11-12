import { Link } from 'react-router'
import type { RouteStatus } from './useRouteProgress'
import './RouteNotice.css'

type RouteNoticeProps = {
  status: Exclude<RouteStatus, 'ready'>
  onRetry: () => void
}

// Keeps the place of today's card on the home page when there is no route to show: none yet, or it could not be
// loaded. So the page always says where the student stands with their route.
export function RouteNotice({ status, onRetry }: RouteNoticeProps) {
  // A loading line above the atlas would only flicker for a moment.
  if (status === 'loading') return null

  return (
    <section className="route-notice today-card" aria-labelledby="route-notice-heading">
      <p className="kicker" id="route-notice-heading">
        Your route
      </p>

      {status === 'none' && (
        <>
          <p className="route-notice-title">You don’t have a route yet.</p>
          <p className="route-notice-text">
            Pick the tasks you want to study and the AI lays them out day by day, up to every deadline.
          </p>
          <Link to="/planner?new=1" className="button button-small button-primary">
            Plot my route
          </Link>
        </>
      )}

      {status === 'failed' && (
        <>
          <p className="route-notice-title" role="alert">
            Could not load your route.
          </p>
          <p className="route-notice-text">Check that you are online and try again.</p>
          <button type="button" className="button button-small" onClick={onRetry}>
            Try again
          </button>
        </>
      )}
    </section>
  )
}
