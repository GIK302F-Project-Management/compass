import { Link } from 'react-router'
import type { RouteStatus } from './useRouteProgress'
import './RouteNotice.css'

type RouteNoticeProps = {
  status: Exclude<RouteStatus, 'ready'>
  onRetry: () => void
  // trail: the side column on wide screens; card: above the atlas on small screens
  variant: 'trail' | 'card'
}

// Keeps the route's place on the home page when there is no route to show: none yet, still loading,
// or it could not be loaded. So the page always says where the student stands with their route.
export function RouteNotice({ status, onRetry, variant }: RouteNoticeProps) {
  // A loading line on top of a phone screen only flickers; the side column keeps its place instead.
  if (status === 'loading' && variant === 'card') return null

  const className = `route-notice ${variant === 'trail' ? 'route-trail' : 'today-card'}`
  return (
    <section className={className} aria-labelledby={`route-notice-${variant}`}>
      <p className="kicker" id={`route-notice-${variant}`}>
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

      {status === 'loading' && <p className="route-notice-text">Loading your route…</p>}
    </section>
  )
}
