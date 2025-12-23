import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon,
  fullWidth = false,
  href,
  ...props 
}) => {
  // Removed transition-all to prevent conflict with Framer Motion transforms
  // Added transition-colors for properties not handled by Motion (like border color if needed)
  const baseStyles = "relative inline-flex items-center justify-center font-display font-bold uppercase tracking-wider transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variantsStyles = {
    primary: "bg-vital-600 text-white border border-vital-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]",
    secondary: "bg-white text-dark-900 border border-white",
    outline: "bg-transparent border border-vital-500 text-vital-500",
    ghost: "bg-transparent text-gray-400",
  };

  const sizes = {
    sm: "text-xs px-4 py-2 gap-2 rounded",
    md: "text-sm px-6 py-3 gap-2 rounded-md",
    lg: "text-base px-8 py-4 gap-3 rounded-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  // Animation variants configuration
  const animationVariants = {
    primary: {
      hover: { 
        scale: 1.05, 
        y: -3,
        backgroundColor: "#f97316", // vital-500
        boxShadow: "0 0 40px rgba(249,115,22,0.7)",
      },
      tap: { scale: 0.95, y: 1 }
    },
    secondary: {
      hover: { 
        scale: 1.05, 
        y: -3,
        backgroundColor: "#f3f4f6", // gray-100
        boxShadow: "0 10px 30px -5px rgba(255,255,255,0.4)"
      },
      tap: { scale: 0.95, y: 1 }
    },
    outline: {
      hover: { 
        scale: 1.05, 
        y: -3,
        backgroundColor: "rgba(249,115,22,0.1)",
        boxShadow: "0 0 25px rgba(249,115,22,0.3)"
      },
      tap: { scale: 0.95, y: 1 }
    },
    ghost: {
      hover: { 
        scale: 1.05, 
        y: -2,
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "#ffffff"
      },
      tap: { scale: 0.95, y: 1 }
    }
  };

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover="hover"
        whileTap="tap"
        variants={animationVariants[variant]}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`${baseStyles} ${variantsStyles[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...(props as any)}
      >
        {/* Gloss/Shine Effect for Primary Button */}
        {variant === 'primary' && (
          <motion.div
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            initial={{ left: "-100%" }}
            variants={{
              hover: { 
                left: "200%", 
                transition: { duration: 0.6, ease: "easeInOut" } 
              }
            }}
          />
        )}

        {icon && <span className="mr-1 relative z-10">{icon}</span>}
        <span className="relative z-10">{children}</span>
      </motion.a>
    );
  }

  return (
    <motion.button
      whileHover="hover"
      whileTap="tap"
      variants={animationVariants[variant]}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`${baseStyles} ${variantsStyles[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {/* Gloss/Shine Effect for Primary Button */}
      {variant === 'primary' && (
        <motion.div
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
          initial={{ left: "-100%" }}
          variants={{
            hover: { 
              left: "200%", 
              transition: { duration: 0.6, ease: "easeInOut" } 
            }
          }}
        />
      )}

      {icon && <span className="mr-1 relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};