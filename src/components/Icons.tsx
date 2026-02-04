// SVG Icon Components for Nexus
// Light Theme compatible - uses currentColor for theme adaptation

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
    style?: React.CSSProperties;
}

// Stock Inspector
export const StockInspectorIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
);

// Portfolio Manager Icon - 庫存管理
export const PortfolioManagerIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <rect width="20" height="5" x="2" y="3" rx="1" />
        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
        <path d="M10 12h4" />
    </svg>
);

// Search Icon - 搜尋放大鏡
export const SearchIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

// Checkbox Icon - 自訂勾選框（支援 checked/unchecked 兩種狀態）
export const CheckboxIcon = ({
    checked = false,
    size = 24,
    className = ""
}: {
    checked?: boolean;
    size?: number;
    className?: string;
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        style={{ transition: 'all 0.2s ease' }}
    >
        <rect
            width="22"
            height="22"
            x="1"
            y="1"
            rx="6"
            fill={checked ? '#10b981' : 'none'}
            stroke={checked ? '#10b981' : '#DEE2E6'}
            strokeWidth="2"
        />
        {checked && (
            <path
                d="M6 12l4 4 8-8"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        )}
    </svg>
);

// Book Open Icon - 記錄交易
export const BookOpenIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

// Trending Up Icon - K 線圖
export const TrendingUpIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

// Tag Icon - 子策略標籤
export const TagIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
);

// Weekly Pullback Icon - 週拉回
export const WeeklyPullbackIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M21 17a9 9 0 0 0-15-6.7L3 13" /><path d="M3 7v6h6" />
        <circle cx="12" cy="17" r="1" />
    </svg>
);

// Weekly Trend Icon - 週趨勢
export const WeeklyTrendIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M13 17V9" /><path d="M18 17v-3" />
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M8 17V5" />
    </svg>
);

// Strong Week Icon - 強勢週
export const StrongWeekIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="m17 11-5-5-5 5" />
        <path d="m17 18-5-5-5 5" />
    </svg>
);

// Dollar Sign Icon - 價格
export const DollarSignIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

// Refresh Icon - 刷新
export const RefreshIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);

// Target Icon - 目標價
export const TargetIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

// Stop Circle Icon - 停損
export const StopCircleIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="12" cy="12" r="10" />
        <rect x="9" y="9" width="6" height="6" />
    </svg>
);

// Loading Spinner Icon - 載入中動畫
export const LoaderIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`animate-spin ${className}`}
        style={style}
    >
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

// Check Circle Icon - 通過/成功
export const CheckCircleIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

// Alert Triangle Icon - 警告
export const AlertTriangleIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// X Circle Icon - 禁止/錯誤
export const XCircleIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
    </svg>
);

// Paw Print Icon - 觀察清單
export const PawPrintIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <circle cx="11" cy="4" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="20" cy="16" r="2" />
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
);

// Piggy Bank Icon - 總成本
export const PiggyBankIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
        <path d="M16 10h.01" />
        <path d="M2 8v1a2 2 0 0 0 2 2h1" />
    </svg>
);

// Chart Line Icon - 市場價值
export const ChartLineIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m19 9-5 5-4-4-3 3" />
    </svg>
);

// Chart Candlestick Icon - K線圖 / P&L
export const ChartCandlestickIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M9 5v4" />
        <rect width="4" height="6" x="7" y="9" rx="1" />
        <path d="M9 15v2" />
        <path d="M17 3v2" />
        <rect width="4" height="8" x="15" y="5" rx="1" />
        <path d="M17 13v3" />
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    </svg>
);

// Mailbox Icon - 空倉提示
export const MailboxIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
        <polyline points="15,9 18,9 18,11" />
        <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />
        <line x1="6" x2="7" y1="10" y2="10" />
    </svg>
);

// Spell Check Icon - 自動擷取
export const SpellCheckIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="m6 16 6-12 6 12" />
        <path d="M8 12h8" />
        <path d="m16 20 2 2 4-4" />
    </svg>
);

// Save Icon - 儲存交易
export const SaveIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
        <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
);

// Bell Ring Icon - 時間警告
export const BellRingIcon = ({ size = 20, className = "", color = "currentColor", style }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M22 8c0-2.3-.8-4.3-2-6" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        <path d="M4 2C2.8 3.7 2 5.7 2 8" />
    </svg>
);

// Traffic Light Icons - 紅綠燈指示器（實心圓形）
export const GreenLightIcon = ({ size = 24, className = "" }: Omit<IconProps, 'color'>) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
    >
        <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
    </svg>
);

export const YellowLightIcon = ({ size = 24, className = "" }: Omit<IconProps, 'color'>) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
    >
        <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
    </svg>
);

export const RedLightIcon = ({ size = 24, className = "" }: Omit<IconProps, 'color'>) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
    >
        <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
    </svg>
);
