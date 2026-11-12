import type { Member } from './api/sharing'
import { MemberAvatar } from './MemberAvatar'
import { memberTones } from './tones'
import './MembersPanel.css'

type MembersPanelProps = {
  members: Member[]
  isOwner: boolean // the student looking at the activity
  onRemove: (member: Member) => void
  onLeave: () => void
}

// Who is in the activity. The owner can remove anyone; everyone else can only leave.
export function MembersPanel({ members, isOwner, onRemove, onLeave }: MembersPanelProps) {
  const tones = memberTones(members)
  return (
    <section className="members" aria-labelledby="members-heading">
      <h3 id="members-heading">Members ({members.length})</h3>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.userId}>
            <MemberAvatar name={member.name} tone={tones.get(member.userId)!} />
            <span className="member-name">
              {member.name}
              {member.you && ' (you)'}
            </span>
            {member.owner && <span className="member-role">Owner</span>}
            {isOwner && !member.owner && (
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => onRemove(member)}
                aria-label={`Remove ${member.name}`}
              >
                Remove
              </button>
            )}
            {!isOwner && member.you && (
              <button type="button" className="button button-small button-danger" onClick={onLeave}>
                Leave activity
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
