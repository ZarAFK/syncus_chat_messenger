import { MessageCircle, Users, Bot, Shuffle } from "lucide-react";

export type topTabsType = "chat" | "groups" | "ai" | "saved" | "notifications" | "status" | "random" | "channels" | "favorite";

export interface tabsMenuReference {
    activeTabs: topTabsType;
    setActiveTabs: (tab: topTabsType) => void;
}

const tabs: { id: topTabsType; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "groups", label: "Groups", icon: Users },
    { id: "random", label: "Random", icon: Shuffle },
    { id: "ai", label: "AI", icon: Bot },
];

const TopTabs: React.FC<tabsMenuReference> = ({ activeTabs, setActiveTabs }) => {

    return (
        <div className="flex items-center justify-around border-b border-gray-800 bg-[#0d0f14]">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabs(tab.id)}
                        className={`flex items-center gap-2 py-3 px-2 text-sm font-medium transition-colors ${activeTabs === tab.id
                            ? "border-b-2 border-blue-500 text-blue-400 font-semibold"
                            : "text-gray-400 hover:text-blue-400"
                            }`}
                    >
                        <Icon size={16} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default TopTabs;
