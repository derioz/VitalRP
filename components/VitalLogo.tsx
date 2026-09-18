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
        src="https://r2.fivemanage.com/image/qlWrCeXTQdqx.png"
        alt={alt}
        width={1254}
        height={1254}
        className={`aspect-square object-contain ${className}`}
        {...props}
    />
);
