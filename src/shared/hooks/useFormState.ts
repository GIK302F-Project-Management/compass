import { useState, type ChangeEvent } from 'react'

// Error messages by field name, plus "form" for a problem that belongs to the whole form.
export type FormErrors<V> = Partial<Record<keyof V | 'form', string>>

/** Values, errors and change handlers for a form made of text inputs and text areas. */
export function useFormState<V extends Record<string, string>>(initialValues: V) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors<V>>({})

  /** onChange handler for one field. Typing also clears that field's error and the form-level one. */
  function bind(field: keyof V) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target
      setValues((current) => ({ ...current, [field]: value }))
      setErrors((current) =>
        current[field] || current.form
          ? ({ ...current, [field]: undefined, form: undefined } as FormErrors<V>)
          : current,
      )
    }
  }

  return { values, setValues, errors, setErrors, bind }
}
