import type { Member } from './api/sharing'

// Each member of a shared activity gets a color, so whose task is whose shows at a glance. The student is always
// the vermilion of the map's marker; classmates take the other map colors in the order they joined.
export type Tone = 'you' | 'tone-1' | 'tone-2' | 'tone-3' | 'tone-4' | 'tone-5'

const CLASSMATE_TONES: Tone[] = ['tone-1', 'tone-2', 'tone-3', 'tone-4', 'tone-5']

export function memberTones(members: Member[]): Map<string, Tone> {
  const tones = new Map<string, Tone>()
  let next = 0
  for (const member of members) {
    if (member.you) tones.set(member.userId, 'you')
    else tones.set(member.userId, CLASSMATE_TONES[next++ % CLASSMATE_TONES.length]!)
  }
  return tones
}

// "Ana Cecília" -> "AC", "Bruno" -> "B".
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}
