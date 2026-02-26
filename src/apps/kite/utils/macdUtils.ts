export type MacdTrendStatus = 'STRONG_BULL' | 'WEAKENING_BULL' | 'STRONG_BEAR' | 'WEAKENING_BEAR';

// 台股紅漲綠跌色碼
export const MACD_STATUS_COLORS: Record<MacdTrendStatus, string> = {
    STRONG_BULL: '#ef4444',    // 深紅 - 強勢多頭
    WEAKENING_BULL: '#fca5a5', // 淺紅 - 多頭衰退
    STRONG_BEAR: '#22c55e',    // 深綠 - 強勢空頭
    WEAKENING_BEAR: '#86efac', // 淺綠 - 空頭收斂
};

/**
 * 比較每日 histogram 與前一日，判定四種動能狀態。
 * 首筆資料無前一日可比較，回傳 null。
 */
export function calculateMacdStatus(histograms: number[]): (MacdTrendStatus | null)[] {
    return histograms.map((h, i) => {
        if (i === 0) return null;
        const prev = histograms[i - 1];
        if (h >= 0) {
            return h >= prev ? 'STRONG_BULL' : 'WEAKENING_BULL';
        } else {
            return h <= prev ? 'STRONG_BEAR' : 'WEAKENING_BEAR';
        }
    });
}
