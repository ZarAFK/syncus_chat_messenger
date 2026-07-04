import { User, Settings, FileText } from "lucide-react";
import React from "react";

interface profileSidebarMenuProps {
  menuActive?: string;
  onMenuChange?: (menu: string) => void;
}

const ProfileSidebar: React.FC<profileSidebarMenuProps> = ({ menuActive, onMenuChange }) => {
  const menuItems = [
    { id: "personal", icon: User, label: "Personal" },
    { id: "account", icon: Settings, label: "Account" },
    { id: "preferences", icon: FileText, label: "Preferences" },
  ];

  return (
    <div className="w-56 bg-[#0d0f14]/95 border-r border-gray-800/60 px-3 py-6 flex flex-col gap-4 backdrop-blur-xl flex-shrink-0">
      <div className="px-3 mb-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Settings</h4>
      </div>
      <nav className="space-y-1">
        {menuItems.map(({ id, icon: Icon, label }) => {
          const isActive = menuActive === id;
          return (
            <button
              key={id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500/15 to-indigo-500/10 text-blue-400 border border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.08)]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/25 border border-transparent"
              }`}
              onClick={() => onMenuChange?.(id)}
            >
              <Icon
                size={17}
                className={isActive ? "text-blue-400" : "text-gray-500"}
              />
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ProfileSidebar;
