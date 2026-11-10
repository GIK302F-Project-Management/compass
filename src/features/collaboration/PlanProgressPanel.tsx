import type { PlanProgress } from '@/shared/api/plans'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import './PlanProgressPanel.css'

// The overall progress of a shared plan, and what each member has completed.
export function PlanProgressPanel({ progress }: { progress: PlanProgress }) {
  const empty = progress.tasksTotal === 0 && progress.activitiesTotal === 0

  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <h3 id="progress-heading">Progress</h3>
      {empty ? (
        <p>Nothing to track yet. Add activities to the plan and its progress will show up here.</p>
      ) : (
        <>
          <p className="progress-percent">
            <em>{progress.percent}%</em> done
          </p>
          <ProgressBar
            value={progress.percent}
            max={100}
            label="Plan progress"
            valueText={`${progress.percent} percent done`}
          />
          <p className="progress-counts">
            {progress.activitiesDone} of {progress.activitiesTotal}{' '}
            {progress.activitiesTotal === 1 ? 'activity' : 'activities'} done · {progress.tasksDone} of{' '}
            {progress.tasksTotal} {progress.tasksTotal === 1 ? 'task' : 'tasks'} done
          </p>
          <table className="progress-members">
            <caption className="kicker">Completed by each member</caption>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Tasks</th>
                <th scope="col">Activities</th>
              </tr>
            </thead>
            <tbody>
              {progress.members.map((member) => (
                <tr key={member.userId}>
                  <th scope="row">{member.name}</th>
                  <td>{member.tasksDone}</td>
                  <td>{member.activitiesDone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
