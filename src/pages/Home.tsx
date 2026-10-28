export function Home(){
    return <>
    <div id="top-bar">
        <h1>HOME</h1>
        <div id="log-in-out-btn-holder">
            <button id="login-btn">LOG IN</button>
            <button id="logout-btn">LOG OUT</button>
        </div>
    </div>
    <form id="search-form">
    <input
        type="search"
        id="activity-search"
        name="activity"
        placeholder="Search activity"
        aria-label="Search activity"
    />
    <button id="submit-btn" type="submit" aria-label="Search">Search</button>
    </form>

    <div id="curr-activities-holder">
        <button id="new-activity-btn">NEW ACTIVITY</button>
        <div className="activity">
            <h2>activity 1</h2>
            <div className="btn-holder">
                <a href="/activity">go</a>
                <button>...</button>
            </div>
        </div>
        <div className="activity">
            <h2>activity 2</h2>
            <div className="btn-holder">
                <a href="/activity">go</a>
                <button>...</button>
            </div>
        </div>
        <div className="activity">
            <h2>activity 3</h2>
            <div className="btn-holder">
                <a href="/activity">go</a>
                <button>...</button>
            </div>
        </div>
    </div>
    </>
}