import { Link } from 'react-router'
import { TopBar } from '../components/TopBar'

export function Activity(){
    return <>
    <TopBar title="Activity" actions={<Link to="/home">Back</Link>} />

    <div id="curr-activities-holder">
        <div className="Task">
            <h2>Task 1</h2>
        </div>
        <div className="Task">
            <h2>Task 2</h2>
        </div>
        <div className="Task">
            <h2>Task 3</h2>
        </div>
    </div>
    </>
}