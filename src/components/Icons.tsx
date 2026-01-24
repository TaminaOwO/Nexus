// SVG Icon Components for Nexus
// Light Theme compatible - uses currentColor for theme adaptation

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
    style?: React.CSSProperties;
}

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
