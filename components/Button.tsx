'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const baseStyles =
  'inline-flex items-center justify-center font-display font-bold transition-colors duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vital-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const variantStyles = {
  primary: 'bg-vital-600 hover:bg-vital-500 text-white border border-vital-500',
  secondary: 'bg-white hover:bg-gray-200 text-dark-900 border border-white',
  outline: 'bg-transparent hover:bg-vital-500/10 border border-vital-500 text-vital-400',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white border border-transparent',
};

const sizes = {
  sm: 'text-sm px-4 py-2 gap-2 rounded',
  md: 'text-sm px-6 py-3 gap-2 rounded',
  lg: 'text-base px-8 py-4 gap-3 rounded',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  icon,
  fullWidth = false,
  href,
  target,
  rel,
  ...props
}) => {
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
  const content = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
};
