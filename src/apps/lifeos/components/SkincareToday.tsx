import { useState, useEffect } from "react";
import {
  fetchSkincareCycle,
  fetchSkincareWeek,
  fetchSkincareSchedule,
  updateSkincareCycle,
  updateSkincareSchedule,
} from "../api";
import type {
  SkincareRoutine,
  SkincareStep as SkincareStepType,
  SkincareScheduleRule,
} from "../types";
import "./SkincareToday.css";

const PHASE_EMOJI: Record<string, string> = {
  menstrual: "\uD83C\uDF19",
  follicular: "\uD83C\uDF38",
  ovulation: "\u2728",
  luteal: "\uD83C\uDF43",
  waiting: "⏳",
};

const PHASE_LABEL: Record<string, string> = {
  follicular: "濾泡期",
  luteal: "黃體期",
};

const ALL_WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

const WEEKDAY_SHORT: Record<string, string> = {
  Monday: "一", Tuesday: "二", Wednesday: "三",
  Thursday: "四", Friday: "五", Saturday: "六", Sunday: "日",
};

export function SkincareToday() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [weekRoutines, setWeekRoutines] = useState<SkincareRoutine[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showWeek, setShowWeek] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showIosInfo, setShowIosInfo] = useState(false);

  // Setup form
  const [startDate, setStartDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [saving, setSaving] = useState(false);

  // Schedule rules
  const [scheduleRules, setScheduleRules] = useState<SkincareScheduleRule[]>([]);
  const [editRules, setEditRules] = useState<Record<string, string[]>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);

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
        const [weekData, scheduleData] = await Promise.all([
          fetchSkincareWeek(),
          fetchSkincareSchedule(),
        ]);
        setWeekRoutines(weekData);
        setScheduleRules(scheduleData);
        setSelectedDayIndex(0);
      }
    } catch {
      setConfigured(false);
    }
  }

  async function handleConfirmPeriodStart() {
    const today = new Date().toLocaleDateString("sv"); // YYYY-MM-DD
    setSaving(true);
    try {
      await updateSkincareCycle({
        cycle_start_date: today,
        cycle_length: cycleLength,
      });
      await loadData();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
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

  function openScheduleModal() {
    const map: Record<string, string[]> = {};
    for (const rule of scheduleRules) {
      const key = `${rule.product_key}_${rule.phase}`;
      map[key] = rule.weekdays ? rule.weekdays.split(",").map((d) => d.trim()) : [];
    }
    setEditRules(map);
    setShowSchedule(true);
  }

  function toggleWeekday(ruleKey: string, day: string) {
    setEditRules((prev) => {
      const current = prev[ruleKey] || [];
      const rule = scheduleRules.find(
        (r) => `${r.product_key}_${r.phase}` === ruleKey
      );
      const maxPerWeek = rule?.max_per_week || 2;

      if (current.includes(day)) {
        return { ...prev, [ruleKey]: current.filter((d) => d !== day) };
      } else if (current.length < maxPerWeek) {
        return { ...prev, [ruleKey]: [...current, day] };
      }
      return prev;
    });
  }

  function hasConflict(phase: string): string | null {
    const retinolDays = editRules[`retinol_${phase}`] || [];
    const bojDays = editRules[`boj_eye_${phase}`] || [];
    const overlap = retinolDays.filter((d) => bojDays.includes(d));
    if (overlap.length > 0) {
      const names = overlap.map((d) => `週${WEEKDAY_SHORT[d]}`).join("、");
      return `Retinol 和 BoJ Eye 不可同天（${names} 衝突）`;
    }
    return null;
  }

  async function handleSaveSchedule() {
    const follicularConflict = hasConflict("follicular");
    const lutealConflict = hasConflict("luteal");
    if (follicularConflict || lutealConflict) return;

    setSavingSchedule(true);
    try {
      const rules = Object.entries(editRules).map(([key, days]) => {
        const [product_key, phase] = key.split("_", 2);
        return { product_key, phase, weekdays: days.join(",") };
      });
      const updated = await updateSkincareSchedule(rules);
      setScheduleRules(updated);
      setShowSchedule(false);
      await loadData();
    } catch {
      // silently fail
    } finally {
      setSavingSchedule(false);
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

  const displayRoutine = weekRoutines[selectedDayIndex] || null;

  if (!displayRoutine) {
    return <div className="skincare-loading">載入保養建議中...</div>;
  }

  const todayStr = weekRoutines[0]?.date || "";
  const isViewingToday = selectedDayIndex === 0;

  return (
    <div className="skincare-container">
      {/* Period Confirmation for Late Periods */}
      {isViewingToday && displayRoutine.phase === "waiting" && (
        <div className="skincare-period-confirm">
          <p>經期預測已過。如果經期今天剛開始：</p>
          <button
            className="confirm-btn"
            onClick={handleConfirmPeriodStart}
            disabled={saving}
          >
            {saving ? "儲存中..." : "🩸 經期今天開始了"}
          </button>
        </div>
      )}

      {/* Phase Indicator */}
      <div className="skincare-phase-indicator">
        <div className="phase-info">
          <span className="phase-day">
            {!isViewingToday && "查看："}Day {displayRoutine.cycle_day} / {displayRoutine.day_of_week}
          </span>
          <span className="phase-name">{displayRoutine.phase_label}</span>
          <span className="phase-mode">{displayRoutine.mode}</span>
        </div>
        <div className="phase-badge">
          <span className="phase-emoji">
            {PHASE_EMOJI[displayRoutine.phase] || "\uD83C\uDF19"}
          </span>
          <span className="phase-date">{displayRoutine.date}</span>
        </div>
      </div>

      {/* Back to Today */}
      {!isViewingToday && (
        <button
          className="back-today-btn"
          onClick={() => setSelectedDayIndex(0)}
        >
          回到今天
        </button>
      )}

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
          {weekRoutines.map((wr, idx) => (
            <div
              key={wr.date}
              className={`week-day-card ${wr.date === todayStr ? "today" : ""} ${idx === selectedDayIndex ? "selected" : ""}`}
              onClick={() => setSelectedDayIndex(idx)}
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
          {displayRoutine.am.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
          {displayRoutine.am.length === 0 && (
            <div className="step-empty">今日無早晨步驟</div>
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
          {displayRoutine.pm.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
          {displayRoutine.pm.length === 0 && (
            <div className="step-empty">今日無晚間步驟</div>
          )}
        </div>
      </div>

      {/* Banned */}
      {displayRoutine.banned.length > 0 && (
        <div className="skincare-banned">
          <div className="banned-header">
            <span className="banned-icon">{"\uD83D\uDEAB"}</span>
            <h3 className="banned-title">今日禁用</h3>
          </div>
          <ul className="banned-list">
            {displayRoutine.banned.map((item, i) => (
              <li key={i} className="banned-item">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="skincare-actions">
        <button className="action-btn" onClick={() => setShowSetup(true)}>
          更新週期起始日
        </button>
        <button className="action-btn accent" onClick={openScheduleModal}>
          排程設定
        </button>
        <button className="action-btn" onClick={() => setShowIosInfo(!showIosInfo)}>
          {showIosInfo ? "收起 iOS 說明" : "iOS 自動同步"}
        </button>
      </div>

      {/* iOS Shortcut Info */}
      {showIosInfo && (
        <div className="ios-info-card">
          <h4>iOS Shortcuts 自動同步</h4>
          <p>在 iPhone 上建立 Shortcut，讓「健康」App 的經期資料自動同步到 Nexus：</p>
          <ol>
            <li>開啟 Shortcuts App &rarr; 新增 Shortcut</li>
            <li>加入「Find Health Samples」&rarr; Type: Menstrual Flow, Sort: Newest, Limit: 1</li>
            <li>取得 Start Date &rarr; 格式化為 <code>yyyy-MM-dd</code></li>
            <li>
              加入「Get Contents of URL」&rarr; PUT{" "}
              <code>https://你的網域/api/lifeos/skincare/cycle</code>
            </li>
            <li>Body (JSON): <code>{`{"cycle_start_date": "{date}"}`}</code></li>
          </ol>
          <p className="ios-info-note">
            可設為 Personal Automation，當 Health 記錄經期時自動觸發。
          </p>
        </div>
      )}

      {/* Schedule Settings Modal */}
      {showSchedule && (
        <div className="schedule-overlay" onClick={() => setShowSchedule(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="schedule-modal-title">保養排程設定</h3>
            <p className="schedule-modal-desc">
              設定每個週期階段的產品使用日。Retinol 和 BoJ Eye 不可安排在同一天。
            </p>

            {(["follicular", "luteal"] as const).map((phase) => {
              const conflict = hasConflict(phase);
              return (
                <div key={phase} className="schedule-phase-section">
                  <h4 className="schedule-phase-title">
                    {PHASE_EMOJI[phase]} {PHASE_LABEL[phase]}
                  </h4>

                  {scheduleRules
                    .filter((r) => r.phase === phase)
                    .map((rule) => {
                      const ruleKey = `${rule.product_key}_${rule.phase}`;
                      const selected = editRules[ruleKey] || [];
                      return (
                        <div key={ruleKey} className="schedule-rule-row">
                          <div className="schedule-rule-label">
                            <span className="rule-product">{rule.label}</span>
                            <span className="rule-limit">最多 {rule.max_per_week}x/週</span>
                          </div>
                          <div className="weekday-toggles">
                            {ALL_WEEKDAYS.map((day) => (
                              <button
                                key={day}
                                className={`weekday-toggle ${selected.includes(day) ? "active" : ""}`}
                                onClick={() => toggleWeekday(ruleKey, day)}
                              >
                                {WEEKDAY_SHORT[day]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                  {conflict && <div className="schedule-conflict">{conflict}</div>}
                </div>
              );
            })}

            <div className="schedule-modal-actions">
              <button
                className="schedule-save-btn"
                onClick={handleSaveSchedule}
                disabled={
                  savingSchedule ||
                  !!hasConflict("follicular") ||
                  !!hasConflict("luteal")
                }
              >
                {savingSchedule ? "儲存中..." : "儲存"}
              </button>
              <button
                className="schedule-cancel-btn"
                onClick={() => setShowSchedule(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
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
