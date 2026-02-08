import { useState, useEffect } from "react";
import { IconLifeOS, IconDashboard, IconSettings } from "../../components/HandDrawnIcons";
import { HabitTracker } from "./components/HabitTracker";
import { TodoBoard } from "./components/TodoBoard";
import { OverviewStats } from "./components/OverviewStats";
import { FlowStats } from "./components/FlowStats";
import { WarRoom } from "./components/WarRoom";
import { fetchTasks } from "./api";
import type { Task } from "./types";
import "./LifeDashboard.css";

export default function LifeDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'todos' | 'warroom'>('overview');
    const [allTasks, setAllTasks] = useState<Task[]>([]);

    useEffect(() => {
        fetchTasks().then(setAllTasks).catch(() => {});
    }, []);

    return (
        <div className="life-dashboard">
            <header className="life-header">
                <div className="header-title">
                    <IconLifeOS className="w-8 h-8 text-accent" />
                    <h1>LifeOS</h1>
                </div>
                <div className="header-actions">
                    <button className="icon-btn">
                        <IconSettings className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div className="life-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <IconDashboard className="w-5 h-5 mr-1 inline" /> Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'habits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('habits')}
                >
                    Habits
                </button>
                <button
                    className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todos')}
                >
                    Tasks
                </button>
                <button
                    className={`tab-btn ${activeTab === 'warroom' ? 'active' : ''}`}
                    onClick={() => setActiveTab('warroom')}
                >
                    ⚡ War Room
                </button>
            </div>

            <main className="life-content">
                {activeTab === 'overview' && (
                    <>
                        <OverviewStats />
                        <FlowStats tasks={allTasks} />
                        <div className="overview-grid">
                            <section className="dashboard-section">
                                <h2>Today's Habits</h2>
                                <HabitTracker compact />
                            </section>
                            <section className="dashboard-section">
                                <h2>Priority Tasks</h2>
                                <TodoBoard compact />
                            </section>
                        </div>
                    </>
                )}
                {activeTab === 'habits' && <HabitTracker />}
                {activeTab === 'todos' && <TodoBoard />}
                {activeTab === 'warroom' && <WarRoom onNavigateTab={setActiveTab} />}
            </main>
        </div>
    );
}
