"use client";

import { cn } from "../../lib/utils";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "./avatar";
import { Badge } from "./badge";
import { Card } from "./card";
import { motion } from "framer-motion";
import { Crown, ShieldAlert, Shield, Star, ShieldCheck, Gavel, Shirt, Edit2, GripVertical } from "lucide-react";

interface StaffMember {
    id?: string;
    name: string;
    role: string;
    subRole?: string;
    color: string;
    category: string;
    image?: string;
}

interface GlassStaffCardProps {
    member: StaffMember;
    editMode?: boolean;
    onEdit?: (member: StaffMember) => void;
    className?: string;
}

const getColorClasses = (color: string) => {
    switch (color) {
        case 'amber':
            return {
                text: 'text-amber-400',
                bg: 'bg-amber-500',
                border: 'group-hover:border-amber-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
                primaryHover: 'hover:bg-amber-500'
            };
        case 'red':
            return {
                text: 'text-red-400',
                bg: 'bg-red-500',
                border: 'group-hover:border-red-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
                primaryHover: 'hover:bg-red-500'
            };
        case 'green':
            return {
                text: 'text-emerald-400',
                bg: 'bg-emerald-500',
                border: 'group-hover:border-emerald-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
                primaryHover: 'hover:bg-emerald-500'
            };
        case 'yellow':
            return {
                text: 'text-yellow-400',
                bg: 'bg-yellow-500',
                border: 'group-hover:border-yellow-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]',
                primaryHover: 'hover:bg-yellow-500'
            };
        case 'purple':
            return {
                text: 'text-purple-400',
                bg: 'bg-purple-500',
                border: 'group-hover:border-purple-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]',
                primaryHover: 'hover:bg-purple-500'
            };
        default:
            return {
                text: 'text-vital-400',
                bg: 'bg-vital-500',
                border: 'group-hover:border-vital-500/50',
                glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]',
                primaryHover: 'hover:bg-vital-500'
            };
    }
};

const RoleIcon = ({ role, subRole, className, size = 16 }: { role: string, subRole?: string, className?: string, size?: number }) => {
    if (role === 'Owner') return <Crown className={className} size={size} />;
    if (role === 'Senior Admin') return <ShieldAlert className={className} size={size} />;
    if (role === 'Clothing Dev' || subRole === 'Clothing Dev') return <Shirt className={className} size={size} />;
    if (role === 'Senior Mod') return <ShieldCheck className={className} size={size} />;
    if (role === 'Mod' || role === 'Moderator') return <Gavel className={className} size={size} />;
    return <Shield className={className} size={size} />;
};

export function GlassStaffCard({
    member,
    editMode,
    onEdit,
    className,
}: GlassStaffCardProps) {
    const colors = getColorClasses(member.color);

    return (
        <Card className={cn(
            "group relative h-full w-full overflow-hidden rounded-2xl border-white/10 bg-dark-800/40 backdrop-blur-md transition-all duration-300 hover:shadow-xl",
            colors.border,
            colors.glow,
            className
        )}>

            {/* Edit Mode Overlay */}
            {editMode && onEdit && (
                <>
                    <div className="absolute top-3 left-3 z-50 p-1.5 bg-dark-900/80 backdrop-blur text-white/50 rounded-lg cursor-grab active:cursor-grabbing hover:text-white transition-colors" title="Drag to reorder">
                        <GripVertical size={16} />
                    </div>
                    <button
                        onClick={() => onEdit(member)}
                        className={cn(
                            "absolute top-3 right-3 z-50 p-2 bg-dark-900/80 backdrop-blur text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 shadow-lg border border-white/10",
                            colors.primaryHover
                        )}
                        title="Edit Card"
                    >
                        <Edit2 size={14} />
                    </button>
                </>
            )}

            <div className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className={cn("h-12 w-12 border border-white/10 bg-dark-900", colors.text)}>
                            {member.image ? (
                                <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-transparent">
                                <RoleIcon role={member.role} subRole={member.subRole} size={24} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h3 className="text-xl font-display font-bold text-white tracking-tight">
                                {member.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star size={12} className={colors.text} fill="currentColor" />
                                <span className={cn("text-xs font-medium uppercase tracking-wider", colors.text)}>
                                    {member.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative divider */}
                <div className="my-4 border-t border-white/5 relative">
                    <div className={cn("absolute -top-[1px] left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full", colors.bg)}></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {member.subRole ? (
                            // @ts-ignore: CVA VariantProps conflict with React 19 Node
                            <Badge variant="secondary" className="bg-white/5 text-[10px] uppercase font-tech tracking-wider border-white/5 px-2 py-0.5">
                                {member.subRole}
                            </Badge>
                        ) : (
                            <div className="h-5"></div> /* Placeholder to maintain height */
                        )}
                    </div>
                </div>
            </div>

            {/* Ambient background glow */}
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-40", colors.bg)}></div>
        </Card>
    );
}
