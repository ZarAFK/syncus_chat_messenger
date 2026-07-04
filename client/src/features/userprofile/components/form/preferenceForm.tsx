import React, { useState, useEffect } from "react";
import { Volume2, Eye, ShieldAlert, Sparkles } from "lucide-react";

const PreferencesForm: React.FC = () => {
  const [preferences, setPreferences] = useState({
    sound: true,
    readReceipts: true,
    showOnline: true,
    glowEffects: true,
  });

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem("user_preferences");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
  }, []);

  // Save to localStorage whenever preferences change
  const togglePreference = (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem("user_preferences", JSON.stringify(updated));
  };

  const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none ${
        active ? "bg-blue-600" : "bg-gray-800 border border-gray-700"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
          active ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 w-full text-gray-200">
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider text-gray-300 mb-2">App Preferences</h3>
        <p className="text-xs text-gray-400">Personalize your SyncUs messenger experience.</p>
      </div>

      <div className="divide-y divide-gray-850 bg-[#0d0f14]/50 border border-gray-850 rounded-2xl overflow-hidden">
        {/* Toggle 1 */}
        <div className="flex items-center justify-between p-5 transition hover:bg-gray-900/10">
          <div className="flex items-start space-x-3.5 pr-4">
            <Volume2 className="text-blue-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-gray-200">Sound Notifications</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Putar suara notifikasi saat pesan masuk atau panggilan baru diterima.
              </p>
            </div>
          </div>
          <ToggleSwitch active={preferences.sound} onToggle={() => togglePreference("sound")} />
        </div>

        {/* Toggle 2 */}
        <div className="flex items-center justify-between p-5 transition hover:bg-gray-900/10">
          <div className="flex items-start space-x-3.5 pr-4">
            <Eye className="text-indigo-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-gray-200">Read Receipts</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Biarkan pengguna lain mengetahui saat Anda membaca pesan mereka.
              </p>
            </div>
          </div>
          <ToggleSwitch active={preferences.readReceipts} onToggle={() => togglePreference("readReceipts")} />
        </div>

        {/* Toggle 3 */}
        <div className="flex items-center justify-between p-5 transition hover:bg-gray-900/10">
          <div className="flex items-start space-x-3.5 pr-4">
            <ShieldAlert className="text-purple-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-gray-200">Show Online Status</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Tampilkan status aktif (hijau) Anda ke pengguna lain saat sedang online.
              </p>
            </div>
          </div>
          <ToggleSwitch active={preferences.showOnline} onToggle={() => togglePreference("showOnline")} />
        </div>

        {/* Toggle 4 */}
        <div className="flex items-center justify-between p-5 transition hover:bg-gray-900/10">
          <div className="flex items-start space-x-3.5 pr-4">
            <Sparkles className="text-amber-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-gray-200">Premium Glow Effects</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Aktifkan efek bias glassmorphic dan aura border menyala pada layout chat.
              </p>
            </div>
          </div>
          <ToggleSwitch active={preferences.glowEffects} onToggle={() => togglePreference("glowEffects")} />
        </div>
      </div>
    </div>
  );
};

export default PreferencesForm;

