import React from 'react';

export const VitalLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMidYMid meet"
    >
        <defs>
            <linearGradient id="vitalLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" /> {/* Amber-400 */}
                <stop offset="50%" stopColor="#F97316" /> {/* Orange-500 */}
                <stop offset="100%" stopColor="#EF4444" /> {/* Red-500 */}
            </linearGradient>
        </defs>
        <path
            d="M10 15 L50 95 L90 15 L70 15 L50 55 L30 15 Z"
            fill="url(#vitalLogoGradient)"
            stroke="none"
        />
    </svg>
);
