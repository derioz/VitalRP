import React from 'react';

export interface VitalLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
    alt?: string;
}

export const VitalLogo: React.FC<VitalLogoProps> = ({
    className = "w-10 h-10",
    alt = "Vital RP Logo",
    ...props
}) => (
    <img
        src="/home/logo-128.webp"
        alt={alt}
        width={128}
        height={128}
        className={`aspect-square object-contain ${className}`}
        {...props}
    />
);
