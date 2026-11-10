import { sessionLabel } from './api/routeProgress'
import { sessionAt, type SavedRoute } from './api/savedRoute'
import { formatMinutes } from '@/shared/utils/duration'
import './SessionItem.css'

type SessionItemProps = {
  route: SavedRoute
  index: number // position in route.sessions
  done: boolean
  disabled: boolean // the task was deleted, so there is nothing to tick off
  onToggle: (index: number) => void
  idPrefix?: string // keeps checkbox ids unique when the same session is shown twice on a page
}

// One study session with a checkbox: used on the route page and in the home page card.
export function SessionItem({ route, index, done, disabled, onToggle, idPrefix = 'session' }: SessionItemProps) {
  const item = sessionAt(route, index)
  const { title, context } = sessionLabel(route, item)
  const id = `${idPrefix}-${index}`

  return (
    <li className={done ? 'session-done' : undefined}>
      <input type="checkbox" id={id} checked={done} disabled={disabled} onChange={() => onToggle(index)} />
      <label htmlFor={id}>
        <span className="session-title">{title}</span>
        {context && <span className="session-context">{context}</span>}
      </label>
      <span className="session-time">{formatMinutes(item.durationMinutes)}</span>
    </li>
  )
}
