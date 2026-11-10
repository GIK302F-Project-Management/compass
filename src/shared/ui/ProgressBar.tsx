type ProgressBarProps = {
  value: number
  max: number
  label: string // what the bar measures, for screen readers: "Tasks done"
  valueText?: string // the value in words, when "3 of 10" reads better than "30"
}

// A bar that fills as work gets done. An empty goal (max 0) shows an empty bar instead of dividing by zero.
export function ProgressBar({ value, max, label, valueText }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}
