import { useState } from "react";
import "./HabitTracker.css";

// Inline Hand-Drawn Check Icon
const IconCheck = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

interface Habit {
    id: string;
    text: string;
    completed: boolean;
    streak: number;
}

const INITIAL_HABITS: Habit[] = [
    { id: '1', text: "Morning Meditation", completed: true, streak: 5 },
    { id: '2', text: "Read 30 mins", completed: false, streak: 12 },
    { id: '3', text: "No Sugar", completed: false, streak: 3 },
    { id: '4', text: "Deep Work (2h)", completed: true, streak: 8 },
];

export function HabitTracker({ compact = false }: { compact?: boolean }) {
    const [habits, setHabits] = useState(INITIAL_HABITS);

    const toggleHabit = (id: string) => {
        setHabits(habits.map(h =>
            h.id === id ? { ...h, completed: !h.completed } : h
        ));
    };

    const displayHabits = compact ? habits.slice(0, 3) : habits;

    return (
        <div className={`habit-tracker ${compact ? 'compact' : ''}`}>
            {!compact && (
                <div className="tracker-header">
                    <h2>Habit Streaks</h2>
                    <button className="add-habit-btn">+ New Habit</button>
                </div>
            )}

            <div className="habit-list">
                {displayHabits.map(habit => (
                    <div
                        key={habit.id}
                        className={`habit-row ${habit.completed ? 'completed' : ''}`}
                        onClick={() => toggleHabit(habit.id)}
                    >
                        <div className="checkbox-container">
                            <div className="hand-checkbox">
                                {habit.completed && <IconCheck className="check-icon" />}
                            </div>
                        </div>
                        <div className="habit-info">
                            <span className="habit-text">{habit.text}</span>
                            <span className="habit-streak">🔥 {habit.streak} days</span>
                        </div>
                    </div>
                ))}
            </div>
            {compact && habits.length > 3 && (
                <div className="more-habits">
                    + {habits.length - 3} more habits...
                </div>
            )}
        </div>
    );
}
