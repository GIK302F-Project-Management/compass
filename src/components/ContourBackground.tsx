import { ContourHill } from './MapShapes'

export function ContourBackground() {
  return (
    <svg className="contours" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ContourHill x={300} y={140} width={220} height={170} rotate={-18} />
      <ContourHill x={70} y={380} width={160} height={120} rotate={25} />
      <ContourHill x={360} y={560} width={150} height={110} rotate={8} />
    </svg>
  )
}
