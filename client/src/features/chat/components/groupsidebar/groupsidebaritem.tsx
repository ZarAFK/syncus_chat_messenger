import React from "react";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

export interface GroupSidebarItemProps {
    nameGroup: string;
    description: string;
    ageLimit?: number;
    rule?: string;
    tags?: string;
    online: number;
    isActive?: boolean;
    onClick?: () => void;
    picture?: string;
    badgeText?: string;
}

export const GroupSidebarItem: React.FC<GroupSidebarItemProps> = ({
    nameGroup,
    description,
    online,
    isActive = false,
    onClick,
    picture,
    badgeText,
}) => {
    return (
        <div 
            onClick={onClick}
            className={`w-full p-3 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/35 transition-all duration-200 flex items-center gap-3 ${
                isActive ? "bg-blue-600/10 border-l-4 border-blue-500" : ""
            }`}
        >
            {picture !== undefined && (
                <img
                    src={resolveAvatarUrl(picture, nameGroup)}
                    alt={nameGroup}
                    className="w-10 h-10 rounded-full object-cover bg-gray-800 border border-gray-800 flex-shrink-0 shadow-md animate-fadeIn"
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1.5">
                    <h3 className={`font-bold text-sm truncate tracking-wide ${
                        isActive ? "text-blue-400" : "text-gray-200"
                    }`}>
                        {nameGroup}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        badgeText 
                            ? "text-blue-400 bg-blue-950/45 border-blue-900/30"
                            : "text-green-400 bg-green-950/45 border-green-900/30"
                    }`}>
                        {badgeText || `${online} online`}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

