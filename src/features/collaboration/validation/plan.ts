// These limits mirror the rules of POST /plans on compass-backend.
export const MAX_PLAN_NAME_LENGTH = 100

// null when the name is fine, otherwise what to tell the student.
export function validatePlanName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Please give the plan a name.'
  if (trimmed.length > MAX_PLAN_NAME_LENGTH) return `Keep the name under ${MAX_PLAN_NAME_LENGTH} characters.`
  return null
}

const TOKEN = /^[A-Za-z0-9_-]+$/

// Students paste what they were sent: the whole link ("https://.../join/abc") or just the code ("abc").
// Returns the token, or null when the text is neither.
export function parseInvitationToken(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const inLink = /\/join\/([^/?#\s]+)/.exec(trimmed)?.[1]
  const token = inLink ?? trimmed
  return TOKEN.test(token) ? token : null
}
