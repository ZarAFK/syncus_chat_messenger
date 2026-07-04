import React, { useState, useEffect } from "react";
import { KeyRound, Mail, AlertTriangle, Loader2 } from "lucide-react";

interface AccountSettingsProps {
  email: string;
  onUpdatePassword: (newPassword: string) => Promise<void>;
  onUpdateEmail: (newEmail: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  email,
  onUpdatePassword,
  onUpdateEmail,
  onDeleteAccount,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localEmail, setLocalEmail] = useState(email);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword) {
      setPasswordStatus({ type: "error", msg: "Password baru tidak boleh kosong" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", msg: "Password minimal 6 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", msg: "Konfirmasi password tidak cocok" });
      return;
    }

    setPasswordLoading(true);
    try {
      await onUpdatePassword(newPassword);
      setPasswordStatus({ type: "success", msg: "Password berhasil diperbarui!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({ type: "error", msg: err?.message || "Gagal memperbarui password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);

    if (!localEmail) {
      setEmailStatus({ type: "error", msg: "Email tidak boleh kosong" });
      return;
    }

    setEmailLoading(true);
    try {
      await onUpdateEmail(localEmail);
      setEmailStatus({ type: "success", msg: "Email berhasil diperbarui!" });
    } catch (err: any) {
      setEmailStatus({ type: "error", msg: err?.message || "Gagal memperbarui email" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data obrolan Anda akan dihapus permanen."
    );
    if (!confirmDelete) return;

    setDeleteLoading(true);
    try {
      await onDeleteAccount();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus akun");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 w-full text-gray-200">
      {/* PASSWORD BOX */}
      <div className="bg-[#0d0f14]/50 border border-gray-850 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-blue-400">
          <KeyRound size={20} />
          <h3 className="text-base font-bold uppercase tracking-wider text-gray-300">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-850 bg-[#0a0b0d]/80 px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200 placeholder-gray-600"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-850 bg-[#0a0b0d]/80 px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200 placeholder-gray-600"
            />
          </div>

          {passwordStatus && (
            <p className={`text-xs font-semibold ${passwordStatus.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {passwordStatus.msg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 text-sm font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-blue-600/10 active:scale-[0.98]"
            >
              {passwordLoading && <Loader2 size={16} className="animate-spin" />}
              Save Password
            </button>
          </div>
        </form>
      </div>

      {/* EMAIL BOX */}
      <div className="bg-[#0d0f14]/50 border border-gray-850 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-indigo-400">
          <Mail size={20} />
          <h3 className="text-base font-bold uppercase tracking-wider text-gray-300">Update Email Address</h3>
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
          <input
            type="email"
            placeholder="example@email.com"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-850 bg-[#0a0b0d]/80 px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition duration-200 placeholder-gray-600"
          />

          {emailStatus && (
            <p className={`text-xs font-semibold ${emailStatus.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {emailStatus.msg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 text-sm font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-blue-600/10 active:scale-[0.98]"
            >
              {emailLoading && <Loader2 size={16} className="animate-spin" />}
              Save Email
            </button>
          </div>
        </form>
      </div>

      {/* DELETE ACCOUNT BOX */}
      <div className="bg-[#1f1214]/30 border border-red-950 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-red-400">
          <AlertTriangle size={20} />
          <h3 className="text-base font-bold uppercase tracking-wider text-red-300">Danger Zone</h3>
        </div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-1">
          <div>
            <h4 className="text-sm font-bold text-gray-200">Delete Account</h4>
            <p className="text-xs text-gray-400 max-w-md mt-1 leading-relaxed">
              Ini akan menghapus seluruh profil, history pesan, dan data akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <button
            onClick={handleDeleteSubmit}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-650 hover:bg-red-550 disabled:bg-red-800 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-red-650/20 active:scale-[0.98] h-fit w-fit"
          >
            {deleteLoading && <Loader2 size={16} className="animate-spin" />}
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

