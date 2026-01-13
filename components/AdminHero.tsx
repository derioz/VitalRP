import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AdminHeroProps {
    title: string | ReactNode;
    subtitle: string;
    rightElement?: ReactNode;
    badgeText?: string;
}

export const AdminHero: React.FC<AdminHeroProps> = ({
    title,
    subtitle,
    rightElement,
    badgeText = "Admin Console 3.0"
}) => {
    return (
        <div className="relative bg-dark-900 border border-white/5 rounded-[2rem] p-8 lg:p-14 mb-10 overflow-hidden shadow-2xl shadow-black/50">
            {/* Noise Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] brightness-150 contrast-150 mix-blend-overlay pointer-events-none"></div>

            {/* Animated Glow Blob - Top Right */}
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-gradient-to-br from-vital-500/30 via-orange-500/20 to-purple-600/20 rounded-full blur-[100px] pointer-events-none"
            />

            {/* Animated Glow Blob - Bottom Left */}
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.08, 0.15, 0.08],
                    x: [0, -30, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-blue-500/15 rounded-full blur-[100px] pointer-events-none"
            />

            {/* Rotating Gradient Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
                style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(251, 146, 60, 0.05), transparent, rgba(139, 92, 246, 0.05), transparent)',
                }}
            />

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            opacity: 0,
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`
                        }}
                        animate={{
                            opacity: [0, 0.6, 0],
                            y: [null, "-100%"],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                        className={`absolute w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-vital-400' : 'bg-purple-400'} blur-[2px]`}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black text-vital-400 uppercase tracking-[0.25em] mb-6 shadow-lg shadow-black/20"
                    >
                        <motion.span
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-vital-400"
                        />
                        {badgeText}
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-4xl lg:text-7xl font-display font-black text-white mb-6 tracking-tight leading-[0.95]">
                        {typeof title === 'string' ? (
                            <motion.span
                                initial={{ backgroundPosition: "0% 50%" }}
                                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 via-white via-50% to-vital-500 bg-[length:200%_auto]"
                            >
                                {title}
                            </motion.span>
                        ) : title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-400 text-lg max-w-2xl font-light leading-relaxed border-l-2 border-vital-500/40 pl-5">
                        {subtitle}
                    </p>
                </motion.div>

                {rightElement && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-shrink-0"
                    >
                        {rightElement}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
