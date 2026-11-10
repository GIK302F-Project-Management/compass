// Never trust the shape of a response blindly: a wrong one must fail here, not deep inside a page.
// These helpers read one field and throw when it is missing or has the wrong type.

export type JsonObject = Record<string, unknown>

export function asObject(value: unknown, what: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Unexpected response: ${what} is not an object`)
  }
  return value as JsonObject
}

export function asList<T>(value: unknown, what: string, decode: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error(`Unexpected response: ${what} is not a list`)
  return value.map(decode)
}

export function readString(object: JsonObject, key: string): string {
  const value = object[key]
  if (typeof value !== 'string') throw new Error(`Unexpected response: ${key} is not text`)
  return value
}

export function readNumber(object: JsonObject, key: string): number {
  const value = object[key]
  if (typeof value !== 'number') throw new Error(`Unexpected response: ${key} is not a number`)
  return value
}

export function readBoolean(object: JsonObject, key: string): boolean {
  const value = object[key]
  if (typeof value !== 'boolean') throw new Error(`Unexpected response: ${key} is not true or false`)
  return value
}

// A field the backend leaves out (or sends as null) when it has no value.
export function readOptionalNumber(object: JsonObject, key: string): number | null {
  const value = object[key]
  if (value === undefined || value === null) return null
  return readNumber(object, key)
}

export function readOptionalString(object: JsonObject, key: string): string | null {
  const value = object[key]
  if (value === undefined || value === null) return null
  return readString(object, key)
}

// The backend's ids are numbers; the app keeps every id as text, so it can be a URL part or a Map key.
export function readId(object: JsonObject, key: string): string {
  return String(readNumber(object, key))
}

export function readOptionalId(object: JsonObject, key: string): string | null {
  const value = readOptionalNumber(object, key)
  return value === null ? null : String(value)
}
