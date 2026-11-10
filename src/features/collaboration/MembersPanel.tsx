import type { PlanMember } from '@/shared/api/plans'
import './MembersPanel.css'

type MembersPanelProps = {
  members: PlanMember[]
  isOwner: boolean // the student looking at the plan
  onRemove: (member: PlanMember) => void
  onLeave: () => void
}

// Who is in the plan. The owner can remove anyone; everyone else can only leave.
export function MembersPanel({ members, isOwner, onRemove, onLeave }: MembersPanelProps) {
  return (
    <section className="members" aria-labelledby="members-heading">
      <h3 id="members-heading">Members ({members.length})</h3>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.userId}>
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
                Leave plan
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
