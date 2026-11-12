import { apiJson } from '@/shared/api/http'
import { asObject, readId, readString } from '@/shared/api/decode'

// The logged-in student's profile, on compass-backend. Only the name can change: the email is how they log in.

export type Profile = {
  id: string
  name: string
  email: string
  createdAt: string // ISO timestamp: when the account was made
}

// GET /user/me: the profile of the logged-in student.
export async function getProfile(): Promise<Profile> {
  return toProfile(await apiJson('/user/me'))
}

// PUT /user/me: 200 -> the profile with the new name. 400 -> ApiError with fieldErrors.name.
export async function updateName(name: string): Promise<Profile> {
  return toProfile(await apiJson('/user/me', { method: 'PUT', body: { name: name.trim() } }))
}

function toProfile(value: unknown): Profile {
  const body = asObject(value, 'profile')
  return {
    id: readId(body, 'id'),
    name: readString(body, 'name'),
    email: readString(body, 'email'),
    createdAt: readString(body, 'createdAt'),
  }
}
