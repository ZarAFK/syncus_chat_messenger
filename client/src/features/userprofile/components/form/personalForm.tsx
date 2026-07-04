import React from "react";
import { Pencil, Lock } from "lucide-react";
import CountriesApiServices from "@/features/homepage/services/countryApiServices";

interface ProfileFormProps {
  profile: {
    username: string;
    about?: string;
    gender?: string;
    age?: number | string;
    city?: string;
    country?: string;
  };
  isUsernameLocked?: boolean;
  remainingDays?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PersonalForm = ({
  profile,
  isUsernameLocked = false,
  remainingDays = 0,
  onChange,
  onSubmit,
}: ProfileFormProps) => {
  const { countriesApi } = CountriesApiServices();
  return (
    <form onSubmit={onSubmit} className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Username</label>
          {isUsernameLocked ? (
            <span title={`Terkunci ${remainingDays} hari lagi`}>
              <Lock size={12} className="text-red-400" />
            </span>
          ) : (
            <Pencil size={12} className="text-blue-400/80" />
          )}
        </div>
        <input
          type="text"
          name="username"
          value={profile?.username ?? ""}
          onChange={onChange}
          disabled={isUsernameLocked}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-200 shadow-inner focus:outline-none transition duration-200 placeholder-gray-600 ${
            isUsernameLocked
              ? "bg-[#0d0f14]/40 border-gray-900 text-gray-500 cursor-not-allowed select-none"
              : "bg-[#0d0f14]/70 border-gray-850 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          }`}
          placeholder="Enter your username"
        />
        {isUsernameLocked && (
          <p className="text-[11px] text-red-400 mt-1.5 font-medium flex items-center gap-1">
            <Lock size={10} /> Username hanya dapat diubah sekali setiap 30 hari. Tersisa {remainingDays} hari.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">About / Bio</label>
          <Pencil size={12} className="text-blue-400/80" />
        </div>
        <textarea
          name="about"
          value={profile?.about ?? ""}
          onChange={onChange}
          rows={3}
          className="w-full rounded-xl border border-gray-850 bg-[#0d0f14]/70 px-4 py-3 text-sm text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200 placeholder-gray-600 resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Gender</label>
            <Pencil size={11} className="text-blue-400/60" />
          </div>
          <select
            name="gender"
            value={profile?.gender ?? ""}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-850 bg-[#0d0f14]/70 px-4 py-3 text-sm text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200"
          >
            <option value="" className="bg-[#121620]">Select gender</option>
            <option value="male" className="bg-[#121620]">Male ♂️</option>
            <option value="female" className="bg-[#121620]">Female ♀️</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Age</label>
            <Pencil size={11} className="text-blue-400/60" />
          </div>
          <input
            type="number"
            name="age"
            value={profile?.age ?? ""}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-850 bg-[#0d0f14]/70 px-4 py-3 text-sm text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200 placeholder-gray-600"
            placeholder="Age"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Country</label>
            <Pencil size={11} className="text-blue-400/60" />
          </div>
          <select
            name="country"
            value={profile?.country ?? ""}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-850 bg-[#0d0f14]/70 px-4 py-3 text-sm text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200"
          >
            <option value="" className="bg-[#121620]">Select country</option>
            {countriesApi.map((cty) => (
              <option key={cty} value={cty} className="bg-[#121620]">
                {cty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.99] transition duration-200"
        >
          Update Profile Info
        </button>
      </div>
    </form>
  );
};

export default PersonalForm;


