import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const HandDrawnSVG: React.FC<IconProps> = ({ children, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {children}
    </svg>
);

export const IconLifeOS: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Lightning Bolt - Sketchy */}
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </HandDrawnSVG>
);

export const IconKite: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Kite - Diamond shape with tail */}
        <path d="M12 2L5 9l7 7 7-7-7-7z" />
        <path d="M12 2v14" />
        <path d="M5 9h14" />
        <path d="M12 16c0 3-1 5-3 5s-3 1-4 1" /> {/* Tail */}
    </HandDrawnSVG>
);

export const IconChoiceFit: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Flexed Arm - Muscle */}
        <path d="M19 8c-1.5 0-2.5.5-3 1.5C15 9 14 9 14 9s-1-4-4-4c-2 0-3 2-3 4 0 .5.5.5.5 1 0 1-1 2-2 3-1 2-1 4 1 6 2 2 5 2 7 2h.5c3 0 5-2 5-5V8z" />
    </HandDrawnSVG>
);

export const IconBOSS: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/786/786692.png"
        alt="Boss Strategy"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconCompany: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/7719/7719530.png"
        alt="Company Strategy"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconWind: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Blowing Wind Lines */}
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </HandDrawnSVG>
);

export const IconStrongWind: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/8991/8991426.png"
        alt="Strong Wind"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconGust: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/12093/12093632.png"
        alt="Gusty Wind"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconTurbulence: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/9737/9737515.png"
        alt="Turbulence"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconNoWind: React.FC<IconProps> = ({ className, ...props }) => (
    <img
        src="https://cdn-icons-png.flaticon.com/512/10197/10197243.png"
        alt="No Wind (Snail)"
        className={`icon-base ${className || ''}`}
        style={{ objectFit: 'contain' }}
        {...props as any}
    />
);

export const IconDashboard: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Dashboard Grid */}
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
    </HandDrawnSVG>
);

export const IconSettings: React.FC<IconProps> = (props) => (
    <HandDrawnSVG {...props}>
        {/* Gear */}
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </HandDrawnSVG>
);
