import { initials, type Tone } from './tones'
import './MemberAvatar.css'

type MemberAvatarProps = {
  name: string
  tone: Tone
}

// A member's initials in their color. The name is read out by whatever sits next to it, so this is decoration.
export function MemberAvatar({ name, tone }: MemberAvatarProps) {
  return (
    <span className={`member-avatar ${tone}`} aria-hidden="true" title={name}>
      {initials(name)}
    </span>
  )
}
