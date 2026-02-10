import { useState, useEffect } from "react";
import {
  fetchSkincareCycle,
  fetchSkincareToday,
  fetchSkincareWeek,
  updateSkincareCycle,
} from "../api";
import type { SkincareRoutine, SkincareStep as SkincareStepType } from "../types";
import "./SkincareToday.css";

const PHASE_EMOJI: Record<string, string> = {
  menstrual: "\uD83C\uDF19",
  follicular: "\uD83C\uDF38",
  ovulation: "\u2728",
  luteal: "\uD83C\uDF43",
};

export function SkincareToday() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);
  const [weekRoutines, setWeekRoutines] = useState<SkincareRoutine[]>([]);
  const [showWeek, setShowWeek] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Setup form
  const [startDate, setStartDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const cycleRes = await fetchSkincareCycle();
      setConfigured(cycleRes.configured);

      if (cycleRes.configured) {
        if (cycleRes.cycle) {
          setStartDate(cycleRes.cycle.cycle_start_date);
          setCycleLength(cycleRes.cycle.cycle_length);
        }
        const [todayData, weekData] = await Promise.all([
          fetchSkincareToday(),
          fetchSkincareWeek(),
        ]);
        setRoutine(todayData);
        setWeekRoutines(weekData);
      }
    } catch {
      setConfigured(false);
    }
  }

  async function handleSaveCycle() {
    if (!startDate) return;
    setSaving(true);
    try {
      await updateSkincareCycle({
        cycle_start_date: startDate,
        cycle_length: cycleLength,
      });
      setShowSetup(false);
      await loadData();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (configured === null) {
    return <div className="skincare-loading">載入中...</div>;
  }

  if (!configured || showSetup) {
    return (
      <div className="skincare-container">
        <div className="skincare-setup">
          <div className="setup-title">設定生理週期</div>
          <div className="setup-desc">
            輸入最近一次經期開始日，系統將自動計算週期階段並推薦保養方案。
          </div>
          <div className="setup-form">
            <div className="setup-field">
              <label>經期開始日 (Day 1)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="setup-field">
              <label>週期天數（預設 28）</label>
              <input
                type="number"
                value={cycleLength}
                min={21}
                max={40}
                onChange={(e) => setCycleLength(Number(e.target.value))}
              />
            </div>
            <button
              className="setup-submit"
              onClick={handleSaveCycle}
              disabled={!startDate || saving}
            >
              {saving ? "儲存中..." : "開始追蹤"}
            </button>
            {showSetup && (
              <button
                className="update-cycle-btn"
                onClick={() => setShowSetup(false)}
                style={{ marginTop: "0.5rem" }}
              >
                取消
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!routine) {
    return <div className="skincare-loading">載入保養建議中...</div>;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="skincare-container">
      {/* Phase Indicator */}
      <div className="skincare-phase-indicator">
        <div className="phase-info">
          <span className="phase-day">
            Day {routine.cycle_day} / {routine.day_of_week}
          </span>
          <span className="phase-name">{routine.phase_label}</span>
          <span className="phase-mode">{routine.mode}</span>
        </div>
        <div className="phase-badge">
          <span className="phase-emoji">
            {PHASE_EMOJI[routine.phase] || "\uD83C\uDF19"}
          </span>
          <span className="phase-date">{routine.date}</span>
        </div>
      </div>

      {/* Week Overview */}
      <div className="skincare-week-toggle">
        <button
          className={`week-toggle-btn ${showWeek ? "active" : ""}`}
          onClick={() => setShowWeek(!showWeek)}
        >
          {showWeek ? "收起週排程" : "展開週排程"}
        </button>
      </div>

      {showWeek && weekRoutines.length > 0 && (
        <div className="skincare-week-grid">
          {weekRoutines.map((wr) => (
            <div
              key={wr.date}
              className={`week-day-card ${wr.date === todayStr ? "today" : ""}`}
            >
              <div className="week-day-name">{wr.day_of_week.slice(0, 3)}</div>
              <div className="week-day-number">{wr.date.split("-")[2]}</div>
              <div className="week-day-phase">
                {PHASE_EMOJI[wr.phase]} {wr.phase_label}
              </div>
              <div className="week-day-cycle">D{wr.cycle_day}</div>
            </div>
          ))}
        </div>
      )}

      {/* AM Routine */}
      <div className="skincare-routine-card">
        <div className="routine-header">
          <span className="routine-icon">{"\u2600\uFE0F"}</span>
          <h3 className="routine-title">AM 早晨保養</h3>
        </div>
        <div className="routine-steps">
          {routine.am.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
          {routine.am.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem" }}>
              今日無早晨步驟
            </div>
          )}
        </div>
      </div>

      {/* PM Routine */}
      <div className="skincare-routine-card">
        <div className="routine-header">
          <span className="routine-icon">{"\uD83C\uDF19"}</span>
          <h3 className="routine-title">PM 晚間保養</h3>
        </div>
        <div className="routine-steps">
          {routine.pm.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
          {routine.pm.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem" }}>
              今日無晚間步驟
            </div>
          )}
        </div>
      </div>

      {/* Banned */}
      {routine.banned.length > 0 && (
        <div className="skincare-banned">
          <div className="banned-header">
            <span className="banned-icon">{"\uD83D\uDEAB"}</span>
            <h3 className="banned-title">今日禁用</h3>
          </div>
          <ul className="banned-list">
            {routine.banned.map((item, i) => (
              <li key={i} className="banned-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Update Cycle */}
      <div className="skincare-update-cycle">
        <button className="update-cycle-btn" onClick={() => setShowSetup(true)}>
          更新週期起始日
        </button>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: SkincareStepType }) {
  return (
    <div className={`skincare-step ${step.optional ? "optional" : ""}`}>
      <span className="step-dot" />
      <span className="step-product">{step.product}</span>
      {step.badge && <span className="step-badge">{step.badge}</span>}
      {step.optional && <span className="step-optional-tag">Optional</span>}
    </div>
  );
}
