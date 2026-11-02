import { CompassRose, ContourHill } from './MapShapes'

// Illustration for the landing page: a learning path drawn as a route on a map.
export function RouteMap() {
  return (
    <svg
      className="route-map"
      viewBox="0 0 480 400"
      role="img"
      aria-label="Example learning path: lab report done, midterm on 14 November, final project on 28 November"
    >
      <ContourHill x={318} y={168} width={150} height={118} rotate={-14} />
      <ContourHill x={104} y={300} width={92} height={70} rotate={22} />
      <ContourHill x={452} y={372} width={70} height={56} rotate={5} />

      <path
        className="route"
        d="M48 352 C120 340, 110 268, 172 262 C244 255, 226 186, 292 168 C352 152, 344 92, 424 64"
      />

      <circle className="waypoint-pulse" cx={48} cy={352} r={7} />
      <circle className="waypoint-start" cx={48} cy={352} r={7} />
      <text className="map-label" x={64} y={378}>
        YOU ARE HERE
      </text>

      <circle className="waypoint waypoint-done" cx={172} cy={262} r={7} />
      <text className="map-label" x={188} y={284}>
        Lab report
        <tspan className="map-date" x={188} dy={15}>
          done
        </tspan>
      </text>

      <circle className="waypoint" cx={292} cy={168} r={7} />
      <text className="map-label" x={306} y={192}>
        Midterm
        <tspan className="map-date" x={306} dy={15}>
          14 Nov
        </tspan>
      </text>

      <line className="map-pole" x1={424} y1={64} x2={424} y2={30} />
      <path className="map-flag" d="M425 30 L450 38 L425 46 Z" />
      <text className="map-label" x={408} y={74} textAnchor="end">
        Final project
        <tspan className="map-date" x={408} dy={15}>
          28 Nov
        </tspan>
      </text>

      <g className="map-rose">
        <CompassRose x={62} y={78} size={22} label />
      </g>

      <g className="map-scale">
        <line x1={330} y1={384} x2={420} y2={384} />
        <line x1={330} y1={379} x2={330} y2={389} />
        <line x1={375} y1={381} x2={375} y2={387} />
        <line x1={420} y1={379} x2={420} y2={389} />
      </g>
      <text className="map-label map-date" x={375} y={373} textAnchor="middle">
        1 week
      </text>
    </svg>
  )
}
