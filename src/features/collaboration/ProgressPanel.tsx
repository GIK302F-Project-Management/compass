import type { ActivityProgress, Member } from './api/sharing'
import { MemberAvatar } from './MemberAvatar'
import { memberTones } from './tones'
import './ProgressPanel.css'

// How the tasks of a shared activity are shared out: what each member took and finished, and what nobody took yet.
export function ProgressPanel({ progress, members }: { progress: ActivityProgress; members: Member[] }) {
  const tones = memberTones(members)
  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <h3 id="progress-heading">Who does what</h3>
      {progress.tasksTotal === 0 ? (
        <p>No tasks yet. Add the tasks of this activity and take the ones you will do.</p>
      ) : (
        <>
          <p className="progress-counts">
            {progress.tasksDone} of {progress.tasksTotal} {progress.tasksTotal === 1 ? 'task' : 'tasks'} done
            {progress.tasksUnassigned > 0 &&
              ` · ${progress.tasksUnassigned} ${progress.tasksUnassigned === 1 ? 'task has' : 'tasks have'} nobody yet`}
          </p>
          <table className="progress-members">
            <caption className="kicker">Tasks of each member</caption>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Taken</th>
                <th scope="col">Done</th>
              </tr>
            </thead>
            <tbody>
              {progress.members.map((member) => (
                <tr key={member.userId}>
                  <th scope="row">
                    <span className="progress-member">
                      <MemberAvatar name={member.name} tone={tones.get(member.userId) ?? 'tone-1'} />
                      {member.name}
                    </span>
                  </th>
                  <td>{member.tasksAssigned}</td>
                  <td>{member.tasksDone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
