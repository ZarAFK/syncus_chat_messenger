import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import api from "@/features/auth/services/auth.api";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface AvatarUploadProps {
  src?: string; // URL avatar user
  username?: string; // dipakai buat inisial jika ga ada avatar
  onUploadSuccess: (avatarUrl: string) => void;
}

const AvatarUpload = ({ src, username, onUploadSuccess }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // ambil huruf pertama username sebagai fallback
  const initial = username ? username[0].toUpperCase() : "?";

  // Resolve avatar URL to full URL (handles relative paths from server)
  const resolvedSrc = src ? resolveAvatarUrl(src, username) : null;
  const showImg = resolvedSrc && !imgError;

  const handleContainerClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validasi format & ukuran file (maksimal 2MB)
    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang diperbolehkan");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB");
      return;
    }

    setError(null);
    setUploading(true);
    setImgError(false);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const { data } = await api.patch("/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (data && data.avatar_url) {
        // Pass the raw server path — resolveAvatarUrl will handle it everywhere
        onUploadSuccess(data.avatar_url);
      }
    } catch (err: any) {
      console.error("Gagal mengupload avatar:", err);
      const msg = err.response?.data?.message || "Gagal mengupload avatar";
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={handleContainerClick}
        className="relative w-28 h-28 flex items-center justify-center rounded-full border border-gray-800 bg-[#0d0f14] text-white text-3xl font-bold overflow-hidden ring-4 ring-blue-500/20 group cursor-pointer transition-all duration-300 hover:ring-blue-500/40"
      >
        {showImg ? (
          <img
            src={resolvedSrc}
            alt="Avatar"
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="select-none text-gray-400 group-hover:scale-95 transition duration-300 text-4xl font-bold">
            {initial}
          </span>
        )}

        {/* Overlay Hover */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-[10px] text-gray-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1 select-none">
          <Camera size={18} className="text-white" />
          <span>UBAH FOTO</span>
        </div>

        {/* Loading Spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <Loader2 className="text-blue-500 animate-spin" size={24} />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {error && <span className="text-xs font-semibold text-red-400">{error}</span>}
    </div>
  );
};

export default AvatarUpload;
