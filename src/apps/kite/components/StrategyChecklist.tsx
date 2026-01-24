import { useMemo } from "react";
import { QuoteData, StructureType, SubStrategyType, WindType, SUB_STRATEGY_LABELS } from "../types";
import { getStrategyChecklist, getChecklistStatus, ConditionItem } from "../utils/strategyChecklist";
import { CheckCircleIcon, XCircleIcon } from "../../../components/Icons";
import "./StrategyChecklist.css";

interface StrategyChecklistProps {
    quote: QuoteData | null;
    structure: StructureType;
    subStrategy: SubStrategyType;
    currentWind: WindType | null;
    revenueYoyChecked: boolean;
}

export function StrategyChecklist({
    quote,
    structure,
    subStrategy,
    currentWind,
    revenueYoyChecked,
}: StrategyChecklistProps) {
    const conditions = useMemo(() =>
        getStrategyChecklist(quote, structure, subStrategy, currentWind, revenueYoyChecked),
        [quote, structure, subStrategy, currentWind, revenueYoyChecked]
    );

    const status = useMemo(() => getChecklistStatus(conditions), [conditions]);

    const subStrategyInfo = SUB_STRATEGY_LABELS[subStrategy];

    return (
        <div className="strategy-checklist">
            <div className="checklist-header">
                <h3>
                    {subStrategyInfo.badge} {subStrategyInfo.zh} Checklist
                </h3>
                <div className={`progress-badge ${status.allPassed ? "all-pass" : ""}`}>
                    {status.passed}/{status.total}
                </div>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${status.percentage}%` }}
                />
            </div>

            <div className="conditions-list">
                {conditions.map((condition) => (
                    <ConditionRow key={condition.id} condition={condition} />
                ))}
            </div>

            {status.allPassed && (
                <div className="all-pass-message">
                    <CheckCircleIcon size={18} /> 所有條件達成! All conditions met!
                </div>
            )}
        </div>
    );
}

function ConditionRow({ condition }: { condition: ConditionItem }) {
    return (
        <div className={`condition-row ${condition.met ? "met" : "unmet"}`}>
            <span className="check-icon">
                {condition.met ? <CheckCircleIcon size={18} color="#10b981" /> : <XCircleIcon size={18} color="#94A3B8" />}
            </span>
            <div className="condition-content">
                <span className="condition-label">{condition.label}</span>
                {!condition.met && condition.currentValue && (
                    <span className="condition-detail">
                        ← 目前: {condition.currentValue}
                        {condition.expectedValue && ` (需要: ${condition.expectedValue})`}
                    </span>
                )}
            </div>
        </div>
    );
}
