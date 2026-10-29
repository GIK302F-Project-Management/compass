import { Link } from 'react-router'
import { RouteMap } from '../components/RouteMap'
import { TopBar } from '../components/TopBar'

const LEGEND = [
  { title: 'Plot your path', text: 'Add your subjects, goals and deadlines by hand, or let the AI planner draft them for you.' },
  { title: 'Get a route', text: 'Compass suggests a study plan step by step. Follow it as it is or redraw it your way.' },
  { title: 'Check your bearing', text: 'Progress, pace and a clear on track or off course status for every goal, before it is too late.' },
]

export function Landing() {
  return (
    <>
      <TopBar
        actions={
          <Link to="/login" className="button button-small">
            Log in
          </Link>
        }
      />
      <main className="landing">
        <div className="landing-copy">
          <p className="kicker">Study companion · MGEP</p>
          <h1 className="landing-title">
            Find your way through the <em>semester.</em>
          </h1>
          <p className="landing-lead">
            Compass turns your subjects, tasks and deadlines into a route you can actually follow, and tells you early
            when you start drifting off course.
          </p>
          <div className="landing-actions">
            <Link to="/register" className="button button-primary">
              Start your route
            </Link>
            <Link to="/login" className="text-link">
              I already have an account
            </Link>
          </div>
        </div>

        <figure className="map-frame">
          <figcaption>
            <span>Sheet 01 · Your semester</span>
            <span>43°04′N 2°29′W</span>
          </figcaption>
          <RouteMap />
        </figure>

        <section className="legend" aria-labelledby="legend-heading">
          <h2 id="legend-heading" className="legend-heading">
            Legend
          </h2>
          <ol className="legend-list">
            {LEGEND.map((item, index) => (
              <li key={item.title} className="legend-item">
                <span className="legend-num">{String(index + 1).padStart(2, '0')}</span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  )
}
