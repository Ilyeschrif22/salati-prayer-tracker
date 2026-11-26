import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalenderDayDetails from "./CalenderDayDetails";
import "./Calender.css";
import { getUser } from "../services/authService";
import { formatPrayerDate, getPrayerMonth, getPrayerStreak, getSavedDayDetails } from "../services/prayerService";

const prayerSchedule = [
    { name: "Fajr", time: "05:20" },
    { name: "Dhuhr", time: "12:10" },
    { name: "Asr", time: "15:00" },
    { name: "Maghrib", time: "17:15" },
    { name: "Isha", time: "18:40" },
];

function getCompletedPrayerCount(prayers = []) {
    return prayers.filter(({ status }) => {
        const normalizedStatus = typeof status === "string" ? status.toLowerCase() : status;
        return normalizedStatus === 1 || normalizedStatus === 3 || normalizedStatus === "completed" || normalizedStatus === "late";
    }).length;
}

function getNextPrayer(now) {
    for (const prayer of prayerSchedule) {
        const [hours, minutes] = prayer.time.split(":").map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(hours, minutes, 0, 0);
        if (prayerDate > now) return { ...prayer, date: prayerDate };
    }

    const firstPrayer = prayerSchedule[0];
    const [hours, minutes] = firstPrayer.time.split(":").map(Number);
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);
    return { ...firstPrayer, date };
}

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

function Calender() {
    const navigate = useNavigate();
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    const todayKey = formatPrayerDate(today);
    const [displayedMonth, setDisplayedMonth] = useState(() =>
        new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const currentYear = displayedMonth.getFullYear();
    const currentMonth = displayedMonth.getMonth() + 1;
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [openModal, setOpenModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showStreakModal, setShowStreakModal] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [user, setUser] = useState(null);
    const [dayColors, setDayColors] = useState({});
    const [currentStreak, setCurrentStreak] = useState(0);
    const [monthStats, setMonthStats] = useState({
        activeDays: 0,
        average: 0,
        todayCompleted: 0,
        daysInMonth: new Date(todayYear, todayMonth, 0).getDate(),
    });
    const [progressRefresh, setProgressRefresh] = useState(0);
    const userId = window.localStorage.getItem("salati-user-id");

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }

        let isActive = true;
        getUser(userId)
            .then((currentUser) => {
                if (isActive) setUser(currentUser);
            })
            .catch(() => {
                if (isActive) setUser(null);
            });

        return () => {
            isActive = false;
        };
    }, [navigate, userId]);

    useEffect(() => {
        if (!userId) return;

        let isActive = true;
        getPrayerMonth(userId, currentYear, currentMonth)
            .then((days) => {
                if (!isActive) return;
                const colorsByDate = {};
                days.forEach((day) => {
                    const statuses = day.prayers.map((prayer) => {
                        const status = typeof prayer.status === "string"
                            ? prayer.status.toLowerCase()
                            : prayer.status;
                        return status;
                    });
                    const hasStatus = statuses.some((status) => status !== 0 && status !== "pending");
                    if (!hasStatus) return;

                    const prayedCount = statuses.filter((status) =>
                        status === 1 || status === 3 || status === "completed" || status === "late"
                    ).length;
                    const onTimeCount = statuses.filter((status) =>
                        status === 1 || status === "completed"
                    ).length;
                    const date = new Date(`${String(day.date).slice(0, 10)}T00:00:00`);
                    const didGym = getSavedDayDetails(userId, date).trainedToday;

                    if (prayedCount === 5 && onTimeCount === 5) {
                        colorsByDate[String(day.date).slice(0, 10)] = didGym ? "#2563eb" : "#16a34a";
                    } else if (prayedCount === 5) {
                        colorsByDate[String(day.date).slice(0, 10)] = "#f97316";
                    } else if (onTimeCount === 3) {
                        colorsByDate[String(day.date).slice(0, 10)] = "#eab308";
                    } else {
                        colorsByDate[String(day.date).slice(0, 10)] = "#dc2626";
                    }
                });
                setDayColors(colorsByDate);
            })
            .catch(() => {
                if (isActive) setDayColors({});
            });

        return () => {
            isActive = false;
        };
    }, [userId, currentYear, currentMonth, progressRefresh]);

    useEffect(() => {
        if (!userId) return;

        let isActive = true;
        getPrayerStreak(userId)
            .then(({ streak }) => {
                if (isActive) setCurrentStreak(streak);
            })
            .catch(() => {
                if (isActive) setCurrentStreak(0);
            });

        return () => {
            isActive = false;
        };
    }, [userId, progressRefresh]);

    useEffect(() => {
        if (!userId) return;

        let isActive = true;
        getPrayerMonth(userId, todayYear, todayMonth)
            .then((days) => {
                if (!isActive) return;
                const recordedDays = days.filter((day) =>
                    getCompletedPrayerCount(day.prayers) > 0 && String(day.date).slice(0, 10) <= todayKey
                );
                const totalCompleted = recordedDays.reduce(
                    (total, day) => total + getCompletedPrayerCount(day.prayers),
                    0
                );
                const daysInCurrentMonth = new Date(todayYear, todayMonth, 0).getDate();

                setMonthStats({
                    activeDays: recordedDays.length,
                    average: Math.round((totalCompleted / (todayDate * 5)) * 100),
                    todayCompleted: getCompletedPrayerCount(
                        days.find((day) => String(day.date).slice(0, 10) === todayKey)?.prayers
                    ),
                    daysInMonth: daysInCurrentMonth,
                });
            })
            .catch(() => {
                if (isActive) setMonthStats({
                    activeDays: 0,
                    average: 0,
                    todayCompleted: 0,
                    daysInMonth: new Date(todayYear, todayMonth, 0).getDate(),
                });
            });

        return () => {
            isActive = false;
        };
    }, [userId, progressRefresh, todayYear, todayMonth, todayDate, todayKey]);

    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const firstDay = new Date(currentYear, displayedMonth.getMonth(), 1);
    const column = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, displayedMonth.getMonth() + 1, 0).getDate();
    const isCurrentMonth = currentYear === today.getFullYear() && displayedMonth.getMonth() === today.getMonth();
    const nextPrayer = getNextPrayer(currentTime);
    const displayName = [user?.name, user?.lastName].filter(Boolean).join(" ");

    return (
        <div className="calender">
            <div className="app-header">
                <img className="salati-logo" src="/salati.png" alt="Salati" />
                <p className="welcome-message">Welcome back{displayName ? `, ${displayName}` : ''}</p>
                <div className="notification-wrapper">
                    <button
                        className="notification-button"
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                        onClick={() => setShowNotifications((open) => !open)}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                            <path d="M10 21h4" />
                        </svg>
                        <span className="notification-dot" />
                    </button>
                    {showNotifications && (
                        <div className="notification-popover" role="status">
                            <p className="notification-title">Notifications</p>
                            <p>You’re on a 7 day prayer streak. Keep it going!</p>
                        </div>
                    )}
                </div>
                <button className="logout-button" type="button" onClick={() => {
                    window.localStorage.removeItem("salati-user-id");
                    navigate('/login');
                }}>
                    Log out
                </button>
            </div>

            <section className="next-prayer-card" aria-label="Next prayer countdown">
                <div>
                    <span className="next-prayer-label">Next prayer</span>
                    <p className="next-prayer-name">{nextPrayer.name}</p>
                </div>
                <div className="next-prayer-timing">
                    <span>{nextPrayer.time}</span>
                    <p className="next-prayer-countdown">{formatCountdown(nextPrayer.date - currentTime)}</p>
                </div>
            </section>

            <section className="calendar-stats" aria-label="Prayer tracking statistics">
                <article className="calendar-stat"><span className="calendar-stat-label">Current streak</span><span className="calendar-stat-value">{currentStreak} {currentStreak === 1 ? "day" : "days"}</span></article>
                <article className="calendar-stat"><span className="calendar-stat-label">This month</span><span className="calendar-stat-value">{monthStats.activeDays} of {monthStats.daysInMonth ?? 0} days</span></article>
                <article className="calendar-stat"><span className="calendar-stat-label">Monthly average</span><span className="calendar-stat-value">{monthStats.average}%</span></article>
                <article className="calendar-stat"><span className="calendar-stat-label">Today</span><span className="calendar-stat-value">{monthStats.todayCompleted} of 5 prayers</span></article>
            </section>

            <div className="calender-header">
                <div className="current-month"><div className="month-text">{displayedMonth.toLocaleDateString(undefined, { month: "long" })}</div> {currentYear}</div>
                <div className="months-changer">
                    <button className="month-button previous" aria-label="Previous month" type="button" onClick={() => setDisplayedMonth(new Date(currentYear, displayedMonth.getMonth() - 1, 1))}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button className="this-month" type="button" onClick={() => setDisplayedMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
                    <button className="month-button next" aria-label="Next month" type="button" onClick={() => setDisplayedMonth(new Date(currentYear, displayedMonth.getMonth() + 1, 1))}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            <div className="calender-weekdays">
                {weekdays.map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="calender-date">
                {[...Array(42)].map((_, index) => {
                    const day = index >= column && index < column + daysInMonth ? index - column + 1 : null;
                    const date = day === null ? null : new Date(currentYear, displayedMonth.getMonth(), day);
                    const dayColor = date ? dayColors[formatPrayerDate(date)] : undefined;
                    return (
                        <div className={`calender-day${isCurrentMonth && day === today.getDate() ? " selected" : ""}${dayColor ? " has-progress" : ""}`} key={index}
                            style={dayColor ? { "--day-progress-color": dayColor } : undefined}
                            onClick={() => {
                                if (day !== null) {
                                    setSelectedDate(date);
                                    setOpenModal(true);
                                }
                            }}>
                            {day ?? ""}
                        </div>
                    );
                })}
            </div>

            {openModal && selectedDate && <CalenderDayDetails
                userId={userId}
                date={selectedDate}
                onClose={() => setOpenModal(false)}
                onSaved={() => setProgressRefresh((refresh) => refresh + 1)}
            />}
            {showStreakModal && (
                <div className="streak-modal-overlay">
                    <section className="streak-modal" role="dialog" aria-modal="true" aria-labelledby="streak-modal-title">
                        <h2 id="streak-modal-title">Welcome back{user?.name ? `, ${user.name}` : ''} <span className="streak-fire" role="img" aria-label="Fire">🔥</span></h2>
                        <p>{currentStreak > 0 ? <>You’re on a <span>{currentStreak} day streak</span>. Keep it going!</> : "Complete at least one prayer today to start a streak."}</p>
                        <button type="button" onClick={() => setShowStreakModal(false)}>Continue</button>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Calender;
