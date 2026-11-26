import { useEffect, useState } from "react";
import { getOrCreatePrayerDay, getSavedDayDetails, saveDayDetails, savePrayerStatuses, toPrayerStatuses } from "../services/prayerService";

const prayerIcons = {
    Fajr: <><path d="M12 2v2" /><path d="m4.93 10.93 1.42 1.42" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m17.65 12.35 1.42-1.42" /><path d="M22 22H2" /><path d="M16 6a6 6 0 0 0-8 0" /><path d="M12 12v6" /></>,
    Dhuhr: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.42 1.42" /><path d="m17.65 17.65 1.42 1.42" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.35 17.65-1.42 1.42" /><path d="m19.07 4.93-1.42 1.42" /></>,
    Asr: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m4.93 4.93 1.42 1.42" /><path d="m17.65 17.65 1.42 1.42" /><path d="m6.35 17.65-1.42 1.42" /><path d="m19.07 4.93-1.42 1.42" /></>,
    Maghrib: <><path d="M12 10V2" /><path d="m4.93 10.93 1.42 1.42" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m17.65 12.35 1.42-1.42" /><path d="M22 22H2" /><path d="M16 6a6 6 0 0 0-8 0" /></>,
    Isha: <><path d="M20.985 12.486A9 9 0 1 1 11.514 3.015a7 7 0 0 0 9.471 9.471Z" /></>,
};

function CalenderDayDetails({ onClose, onSaved = () => {}, userId, date }) {
    const [savedDetails] = useState(() => getSavedDayDetails(userId, date));
    const [trainedToday, setTrainedToday] = useState(savedDetails.trainedToday || false);
    const [prayerStatuses, setPrayerStatuses] = useState({});
    const [taskInput, setTaskInput] = useState("");
    const [tasks, setTasks] = useState(savedDetails.tasks || []);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setError("");
        getOrCreatePrayerDay(userId, date)
            .then((day) => {
                if (isActive) setPrayerStatuses(toPrayerStatuses(day.prayers));
            })
            .catch((requestError) => {
                if (isActive) setError(requestError.message || "Unable to load prayer data.");
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [userId, date]);

    function addTask(event) {
        event.preventDefault();
        const task = taskInput.trim();
        if (!task) return;
        setTasks((currentTasks) => [...currentTasks, task]);
        setTaskInput("");
    }

    async function saveDetails() {
        setError("");
        setIsSaving(true);
        try {
            await savePrayerStatuses(userId, date, prayerStatuses);
            saveDayDetails(userId, date, { trainedToday, tasks });
            onSaved();
            onClose();
        } catch (requestError) {
            setError(requestError.message || "Unable to save prayer data.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="calender-day-details">
                <button className="close-btn" onClick={onClose} aria-label="Close day details">×</button>
                <div className="calender-day-details-content">
                    <p className="calender-day-details-title">Prayers</p>
                    <p>{date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                    {isLoading && <p role="status">Loading prayer data…</p>}
                    {error && <p className="prayer-save-error" role="alert">{error}</p>}
                    <ul className="prayer-list">
                        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => (
                            <li key={prayer}>
                                <span className="prayer-name">
                                    <svg aria-hidden="true" viewBox="0 0 24 24">{prayerIcons[prayer]}</svg>
                                    {prayer}
                                </span>
                                <div className="prayer-status">
                                    <button className={`on-time${prayerStatuses[prayer] === "on-time" ? " selected" : ""}`} type="button" disabled={isLoading || isSaving} aria-pressed={prayerStatuses[prayer] === "on-time"} onClick={() => setPrayerStatuses((statuses) => ({ ...statuses, [prayer]: "on-time" }))}>On time</button>
                                    <button className={`late${prayerStatuses[prayer] === "late" ? " selected" : ""}`} type="button" disabled={isLoading || isSaving} aria-pressed={prayerStatuses[prayer] === "late"} onClick={() => setPrayerStatuses((statuses) => ({ ...statuses, [prayer]: "late" }))}>Late</button>
                                    <button className={`missed${prayerStatuses[prayer] === "missed" ? " selected" : ""}`} type="button" disabled={isLoading || isSaving} aria-pressed={prayerStatuses[prayer] === "missed"} onClick={() => setPrayerStatuses((statuses) => ({ ...statuses, [prayer]: "missed" }))}>Missed</button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <section className="day-section gym-section">
                        <div className="section-heading">
                            <p className="calender-day-gym-title">Gym</p>
                            <span>{trainedToday ? "Done" : "Not yet"}</span>
                        </div>
                        <div className="gym-check-area">
                            <label className="gym-check-card">
                                <input type="checkbox" checked={trainedToday} onChange={(event) => setTrainedToday(event.target.checked)} />
                                <span><strong>Trained today</strong><small>A session counts once, however long</small></span>
                            </label>
                        </div>
                    </section>

                    <section className="day-section tasks-section">
                        <div className="section-heading">
                            <h2>Tasks</h2>
                            <span>{tasks.length ? `${tasks.length} added` : "None yet"}</span>
                        </div>
                        <form className="add-task-form" onSubmit={addTask}>
                            <input aria-label="Add a task for this day" placeholder="Add a task for this day" value={taskInput} onChange={(event) => setTaskInput(event.target.value)} />
                            <button type="submit" disabled={!taskInput.trim()}>Add</button>
                        </form>
                        {tasks.length > 0 && <ul className="task-list">{tasks.map((task, index) => <li key={`${task}-${index}`}>{task}</li>)}</ul>}
                    </section>
                    <button className="save-details-button" type="button" onClick={saveDetails} disabled={isLoading || isSaving}>
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CalenderDayDetails;
