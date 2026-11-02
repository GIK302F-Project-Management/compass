import { ContourHill } from './MapShapes'

// Turns a string into a repeatable sequence of numbers between 0 and 1,
// so the same activity always gets the same terrain.
function seededRandom(seed: string) {
  let state = 0
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

// Small map drawn at the top of each atlas sheet: terrain, a dotted route and a flag at the goal.
export function SheetMap({ seed }: { seed: string }) {
  const random = seededRandom(seed)
  const between = (min: number, max: number) => min + random() * (max - min)

  const bigHill = { x: between(170, 250), y: between(35, 70), width: between(90, 130), height: between(60, 85), rotate: between(-30, 30) }
  const smallHill = { x: between(40, 110), y: between(75, 110), width: between(50, 75), height: between(40, 55), rotate: between(-30, 30) }
  const start = { x: 26, y: between(88, 100) }
  const bend = { x: between(110, 160), y: between(45, 80) }
  const flag = { x: between(240, 270), y: between(40, 55) }

  return (
    <svg className="sheet-map" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ContourHill {...bigHill} />
      <ContourHill {...smallHill} />
      <path
        className="route"
        d={`M${start.x} ${start.y} C${start.x + 60} ${start.y}, ${bend.x - 40} ${bend.y + 20}, ${bend.x} ${bend.y} S${flag.x - 40} ${flag.y}, ${flag.x} ${flag.y}`}
      />
      <circle className="waypoint-start" cx={start.x} cy={start.y} r={5} />
      <line className="map-pole" x1={flag.x} y1={flag.y} x2={flag.x} y2={flag.y - 24} />
      <path className="map-flag" d={`M${flag.x + 1} ${flag.y - 24} L${flag.x + 18} ${flag.y - 18} L${flag.x + 1} ${flag.y - 12} Z`} />
    </svg>
  )
}
