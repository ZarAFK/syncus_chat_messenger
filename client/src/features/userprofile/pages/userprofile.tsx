import React, { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfileHooks";
import AvatarUpload from "../components/avatarupload/avatarUpload";
import ProfileSidebar from "../components/sidebar/profileSidebar";
import PersonalForm from "../components/form/personalForm";
import AccountSettings from "../components/form/accountForm";
import PreferencesForm from "../components/form/preferenceForm";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import ProfileHeader from "../components/header/profileheader";
import { useNavigate } from "react-router-dom";
import api from "@/features/auth/services/auth.api";

type FormShape = {
  username: string;
  about?: string;
  gender?: string;
  age?: number | "";
  city?: string;
  country?: string;
};

const defaultForm: FormShape = {
  username: "",
  about: "",
  gender: "",
  age: "",
  city: "",
  country: "",
};

const ProfilePage: React.FC = () => {
  const { profile, loading, error, fetchProfile, updateProfile } = useProfile();
  const [menuActive, setMenuActive] = useState("personal");
  const [formUpdateProfile, setFormUpdateProfile] = useState<FormShape>(defaultForm);
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);
  const nv = useNavigate();

  useEffect(() => {
    if (profile) {
      setFormUpdateProfile({
        username: profile.username || "",
        about: profile.profile?.bio && profile.profile.bio !== "No bio yet" ? profile.profile.bio : "",
        gender: profile.gender || "",
        age: profile.age || "",
        country: profile.country || "",
      });

      // Hitung apakah cooldown ganti nama aktif (30 hari)
      if (profile.last_username_change) {
        const lastChange = new Date(profile.last_username_change).getTime();
        const cooldownMs = 30 * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - lastChange;
        if (elapsed < cooldownMs) {
          setIsUsernameLocked(true);
          setRemainingDays(Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000)));
        } else {
          setIsUsernameLocked(false);
          setRemainingDays(0);
        }
      } else {
        setIsUsernameLocked(false);
        setRemainingDays(0);
      }
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormUpdateProfile((prev) => ({
      ...prev,
      [name]: name === "age" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUpdateProfile.username) {
      alert("Username tidak boleh kosong");
      return;
    }

    const payload = {
      username: formUpdateProfile.username,
      age: formUpdateProfile.age === "" ? undefined : Number(formUpdateProfile.age),
      gender: formUpdateProfile.gender?.toLowerCase() as "male" | "female" | undefined,
      country: formUpdateProfile.country,
      profile: {
        bio: formUpdateProfile.about,
      },
    };

    try {
      await updateProfile(payload);
      alert("Profile berhasil diperbarui!");
      fetchProfile(); // reload profile display
    } catch (err: any) {
      console.error("Gagal memperbarui profile:", err);
      const errMsg = err.response?.data?.message || err.message || "Gagal memperbarui profile";
      alert(Array.isArray(errMsg) ? errMsg.join("\n") : errMsg);
    }
  };

  const handleAvatarSuccess = (_newUrl: string) => {
    fetchProfile(); // reload profile details to show new avatar
  };

  const handleUpdatePassword = async (newPassword: string) => {
    if (!profile) return;
    await api.patch(`/auth/${profile.user_id}`, {
      hash_password: newPassword,
    });
  };

  const handleUpdateEmail = async (newEmail: string) => {
    if (!profile) return;
    await api.patch(`/auth/${profile.user_id}`, {
      email: newEmail,
    });
    fetchProfile();
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    await api.delete(`/users/${profile.user_id}`);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    sessionStorage.clear();
    nv("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center text-gray-300">
        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
        <span className="text-sm font-medium">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center text-gray-300 p-4 text-center">
        <AlertCircle className="text-red-500 mb-2" size={36} />
        <span className="text-base font-semibold">Gagal memuat profil</span>
        <span className="text-xs text-gray-500 mt-1 max-w-xs">{error}</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d0f14] text-gray-100 flex flex-col overflow-hidden">
      {/* Topbar stripped-down for profile page — only back nav + branding */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-8 py-4 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nv("/chat")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Back to Chat
          </button>
          <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
            SyncUs
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Avatar preview in topbar */}
          {profile?.profile?.avatar_url && (
            <img
              src={profile.profile.avatar_url}
              alt={profile.username}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/30 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-base font-semibold">
            {profile?.username ? `Hi, ${profile.username}` : "Profile Settings"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <ProfileSidebar menuActive={menuActive} onMenuChange={setMenuActive} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="p-6 md:p-10 max-w-3xl mx-auto">

            {/* Personal Section */}
            {menuActive === "personal" && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-[#121620]/70 border border-gray-800/60 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  {/* Banner */}
                  <div className="h-24 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/10 relative">
                    <div className="absolute inset-0 bg-[#0d0f14]/20" />
                  </div>

                  {/* Avatar + Info */}
                  <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
                    {/* Avatar Upload */}
                    <div className="ring-4 ring-[#0d0f14] rounded-full mb-4">
                      <AvatarUpload
                        src={profile?.profile?.avatar_url}
                        username={profile?.username}
                        onUploadSuccess={handleAvatarSuccess}
                      />
                    </div>

                    <ProfileHeader
                      username={profile?.username || "Unnamed User"}
                      age={profile?.age}
                      country={profile?.country || "Unknown"}
                      gender={profile?.gender || "Other"}
                      about={profile?.profile?.bio && profile.profile.bio !== "No bio yet" ? profile.profile.bio : ""}
                      email={profile?.auth?.email || "No email"}
                      is_online={profile?.is_online || false}
                      last_seen={profile?.last_seen || new Date().toISOString()}
                      isUsernameLocked={isUsernameLocked}
                      remainingDays={remainingDays}
                    />
                  </div>
                </div>

                {/* Edit Form */}
                <div className="bg-[#121620]/70 border border-gray-800/60 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
                    Edit Personal Info
                  </h3>
                  <PersonalForm
                    profile={formUpdateProfile}
                    isUsernameLocked={isUsernameLocked}
                    remainingDays={remainingDays}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                  />
                </div>
              </div>
            )}

            {/* Account Section */}
            {menuActive === "account" && (
              <div className="bg-[#121620]/70 border border-gray-800/60 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                  <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />
                  Account Settings
                </h3>
                <AccountSettings
                  email={profile?.auth?.email ?? ""}
                  onUpdatePassword={handleUpdatePassword}
                  onUpdateEmail={handleUpdateEmail}
                  onDeleteAccount={handleDeleteAccount}
                />
              </div>
            )}

            {/* Preferences Section */}
            {menuActive === "preferences" && (
              <div className="bg-[#121620]/70 border border-gray-800/60 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full inline-block" />
                  Preferences
                </h3>
                <PreferencesForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
