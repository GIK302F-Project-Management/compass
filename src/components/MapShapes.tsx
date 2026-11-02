// SVG pieces shared by the logo and the map illustrations. They are meant to be
// placed inside an <svg>; colours come from the CSS classes in App.css.

const STAR = 'M0,-1 L0.22,-0.22 L1,0 L0.22,0.22 L0,1 L-0.22,0.22 L-1,0 L-0.22,-0.22 Z'
const NEEDLE = 'M0,-1 L0.22,-0.22 L0,0 L-0.22,-0.22 Z'

type RoseProps = {
  x?: number
  y?: number
  size: number
  label?: boolean
}

export function CompassRose({ x = 0, y = 0, size, label = false }: RoseProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="rose-group">
        <circle className="rose-ring" r={size * 0.72} />
        <path className="rose-star" d={STAR} transform={`scale(${size})`} />
        <path className="rose-needle" d={NEEDLE} transform={`scale(${size})`} />
      </g>
      {label && (
        <text className="map-label" y={-size - 6} textAnchor="middle">
          N
        </text>
      )}
    </g>
  )
}

// One irregular closed shape, repeated at smaller scales, reads as contour lines of a hill.
const HILL = 'M0,-100 C48,-104 96,-74 104,-22 C112,30 80,84 22,98 C-36,112 -96,86 -108,30 C-120,-26 -64,-96 0,-100 Z'
const RING_SCALES = [1, 0.8, 0.6, 0.42, 0.24]

type HillProps = {
  x: number
  y: number
  width: number
  height: number
  rotate?: number
}

export function ContourHill({ x, y, width, height, rotate = 0 }: HillProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {RING_SCALES.map((scale, index) => (
        <path
          key={scale}
          className={index === 0 ? 'contour contour-index' : 'contour'}
          d={HILL}
          transform={`rotate(${index * 11}) scale(${(width / 100) * scale} ${(height / 100) * scale})`}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  )
}
