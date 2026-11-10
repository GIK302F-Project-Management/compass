import type { ChangeEvent } from 'react'

type TextAreaFieldProps = {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  hint?: string
  error?: string
}

// Like FormField, for text that needs more than one line.
export function TextAreaField({ id, label, value, onChange, rows = 4, hint, error }: TextAreaFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
