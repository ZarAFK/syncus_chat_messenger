import React, { useState, useEffect, useRef } from "react";
import { X, Shield, ShieldAlert, UserMinus, UserCheck, Save, Edit2, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import api from "@/features/auth/services/auth.api";
import { resolveAvatarUrl } from "@/shared/utils/avatarUtils";

interface Member {
  session_member_room_id: number;
  role: "admin" | "member";
  user: {
    user_id: number;
    username: string;
    is_online: boolean;
    gender?: string;
  };
}

interface Room {
  room_id: number;
  room_name: string;
  room_description?: string;
  rule?: string;
  age_limit?: number;
  room_picture?: string;
  creator?: {
    user_id: number;
    username: string;
  };
  roomMembers: Member[];
}

interface GroupInfoModalProps {
  room: Room;
  currentUserId: number;
  socket: any;
  onClose: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  room,
  currentUserId,
  socket,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "members" | "media">("details");
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(room.room_name);
  const [description, setDescription] = useState(room.room_description || "");
  const [rule, setRule] = useState(room.rule || "");
  const [ageLimit, setAgeLimit] = useState(room.age_limit || 0);
  const [roomPicture, setRoomPicture] = useState(room.room_picture || "");
  const [tempPicture, setTempPicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [zoomedMedia, setZoomedMedia] = useState<string | null>(null);

  const isCreator = room.creator?.user_id === currentUserId || (room as any).creator_id === currentUserId;
  const currentMember = room.roomMembers?.find((m) => m.user?.user_id === currentUserId);
  const isAdmin = currentMember?.role === "admin";
  const canEdit = isCreator || isAdmin;

  // Sync state if room changes and we aren't editing
  useEffect(() => {
    if (!isEditing) {
      setName(room.room_name);
      setDescription(room.room_description || "");
      setRule(room.rule || "");
      setAgeLimit(room.age_limit || 0);
      setRoomPicture(room.room_picture || "");
    }
  }, [room, isEditing]);

  // Fetch Media
  useEffect(() => {
    if (activeTab === "media" && socket) {
      setLoadingMedia(true);
      socket.emit("findAllMediaByRoom", { roomId: room.room_id }, (res: any[]) => {
        if (Array.isArray(res)) {
          setMediaFiles(res);
        }
        setLoadingMedia(false);
      });
    }
  }, [activeTab, room.room_id, socket]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // preview
      const reader = new FileReader();
      reader.onload = () => {
        setTempPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("picture", selectedFile);
      const res = await api.patch(`/rooms/${room.room_id}/picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      if (data.success) {
        setRoomPicture(`http://localhost:3000${data.room_picture}`);
        setTempPicture(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("Gagal mengupload foto grup");
      }
    } catch (err: any) {
      alert("Gagal mengupload foto grup: " + (err?.message || "Unknown error"));
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveDetails = () => {
    if (!socket || !name.trim()) return;
    
    const payload: any = {
      id: room.room_id,
      room_name: name.trim(),
      room_description: description.trim(),
      rule: rule.trim(),
      age_limit: Number(ageLimit),
    };

    socket.emit("updateRoom", payload, (res: any) => {
      if (res && res.success) {
        setIsEditing(false);
      } else {
        alert("Gagal mengubah info grup: " + (res?.error || "Terjadi kesalahan"));
      }
    });
  };

  const handleKick = (targetUserId: number) => {
    if (!socket) return;
    if (confirm("Apakah Anda yakin ingin mengeluarkan anggota ini?")) {
      socket.emit("kickMember", { roomId: room.room_id, targetUserId });
    }
  };

  const handlePromoteDemote = (targetUserId: number, targetRole: "admin" | "member") => {
    if (!socket) return;
    socket.emit("promoteMember", {
      roomId: room.room_id,
      targetUserId,
      role: targetRole,
    });
  };

  const avatar = tempPicture || resolveAvatarUrl(roomPicture, room.room_name);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#121620] border border-gray-800/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
            <h3 className="font-bold text-lg text-white">Group Information</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-800/40 text-sm font-semibold select-none px-6 pt-3 bg-[#0d0f14]/30">
            <button
              onClick={() => {
                setActiveTab("details");
                setIsEditing(false);
              }}
              className={`flex-1 pb-3 text-center transition-colors cursor-pointer border-b-2 ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => {
                setActiveTab("members");
                setIsEditing(false);
              }}
              className={`flex-1 pb-3 text-center transition-colors cursor-pointer border-b-2 ${
                activeTab === "members"
                  ? "border-blue-500 text-blue-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Members ({room.roomMembers?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("media");
                setIsEditing(false);
              }}
              className={`flex-1 pb-3 text-center transition-colors cursor-pointer border-b-2 ${
                activeTab === "media"
                  ? "border-blue-500 text-blue-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Media
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-gray-850 scrollbar-track-transparent">
            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <div className="bg-[#161b26] p-5 rounded-2xl border border-gray-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Group Details</h4>
                  {canEdit && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Group Icon Section */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-gray-850 border-2 border-gray-800 shadow-md">
                    <img
                      src={avatar}
                      alt={room.room_name}
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <label
                        htmlFor="group-picture-input"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] cursor-pointer font-semibold"
                      >
                        <Camera size={18} className="mb-1" />
                        Change Icon
                      </label>
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input
                        id="group-picture-input"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {selectedFile && (
                        <div className="mt-3 flex gap-2 items-center">
                          <button
                            onClick={handleUploadPicture}
                            disabled={uploadingPicture}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white rounded-lg font-semibold transition cursor-pointer"
                          >
                            {uploadingPicture ? (
                              <><Loader2 size={12} className="animate-spin" /><span>Uploading...</span></>
                            ) : (
                              <><Camera size={12} /><span>Upload Foto</span></>
                            )}
                          </button>
                          <button
                            onClick={() => { setTempPicture(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">Room Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0d0f14] border border-gray-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-[#0d0f14] border border-gray-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">Age Limit</label>
                        <input
                          type="number"
                          value={ageLimit}
                          onChange={(e) => setAgeLimit(Number(e.target.value))}
                          className="w-full bg-[#0d0f14] border border-gray-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">Rules</label>
                        <textarea
                          value={rule}
                          onChange={(e) => setRule(e.target.value)}
                          rows={3}
                          className="w-full bg-[#0d0f14] border border-gray-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none scrollbar-thin"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setTempPicture(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
                      >
                        <Save size={12} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-sm">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Group Name</span>
                      <span className="text-white font-bold text-base">{room.room_name}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Description</span>
                      <div className="max-h-24 overflow-y-auto pr-1 mt-0.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        <p className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap">{room.room_description || "No description provided."}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Age Limit</span>
                        <span className="text-gray-300 font-medium block mt-0.5">{room.age_limit ? `${room.age_limit}+ years` : "No limit"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rules</span>
                        <div className="max-h-32 overflow-y-auto pr-1 mt-0.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                          <p className="text-gray-300 font-medium whitespace-pre-wrap leading-relaxed break-words">{room.rule || "Sopan & Santun"}</p>
                        </div>
                      </div>
                    </div>
                    {room.creator && (
                      <div>
                        <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Created By</span>
                        <span className="text-blue-400 font-medium block mt-0.5">@{room.creator.username}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === "members" && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  Members ({room.roomMembers?.length || 0})
                </h4>
                
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-850 scrollbar-track-transparent">
                  {room.roomMembers?.map((m) => {
                    if (!m.user) return null;
                    const isTargetCreator = room.creator?.user_id === m.user.user_id;
                    const isTargetAdmin = m.role === "admin";
                    const isTargetSelf = m.user.user_id === currentUserId;

                    // Avatar
                    const memberAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${m.user.username}`;

                    return (
                      <div
                        key={m.session_member_room_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#161b26]/40 border border-gray-850/50 hover:bg-[#161b26]/70 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <img src={memberAvatar} alt={m.user.username} className="w-9 h-9 rounded-full bg-gray-800 border border-gray-800" />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#121620] ${
                                m.user.is_online ? "bg-green-500" : "bg-gray-500"
                              }`}
                            ></span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-white">@{m.user.username}</span>
                              {isTargetSelf && <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.2 rounded font-bold">You</span>}
                            </div>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              {isTargetCreator ? (
                                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                  <ShieldAlert size={10} /> Owner
                                </span>
                              ) : isTargetAdmin ? (
                                <span className="text-blue-400 font-bold flex items-center gap-0.5">
                                  <Shield size={10} /> Admin
                                </span>
                              ) : (
                                <span className="text-gray-500 font-medium">Member</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Moderation Actions */}
                        {!isTargetSelf && (
                          <div className="flex items-center space-x-1">
                            {/* Creator can promote/demote admins */}
                            {isCreator && !isTargetCreator && (
                              <button
                                onClick={() => handlePromoteDemote(m.user.user_id, isTargetAdmin ? "member" : "admin")}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                  isTargetAdmin 
                                    ? "text-red-400 hover:text-red-300 hover:bg-red-950/20" 
                                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-950/20"
                                }`}
                                title={isTargetAdmin ? "Demote to Member" : "Promote to Admin"}
                              >
                                {isTargetAdmin ? <UserMinus size={15} /> : <Shield size={15} />}
                              </button>
                            )}

                            {/* Kick action */}
                            {((isCreator && !isTargetCreator) || (isAdmin && !isTargetCreator && !isTargetAdmin)) && (
                              <button
                                onClick={() => handleKick(m.user.user_id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                                title="Kick Member"
                              >
                                <UserMinus size={15} className="text-red-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MEDIA TAB */}
            {activeTab === "media" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  Shared Media ({mediaFiles.length})
                </h4>

                {loadingMedia ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    Loading media files...
                  </div>
                ) : mediaFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-[#161b26]/30 border border-gray-850/40 rounded-2xl">
                    <ImageIcon className="text-gray-600 mb-3" size={36} />
                    <span className="text-gray-500 text-sm">No media shared in this group yet</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 pr-1 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-850 scrollbar-track-transparent">
                    {mediaFiles.map((m) => {
                      const isImg = m.type === "image" || m.content?.startsWith("data:image/");
                      if (isImg) {
                        return (
                          <div
                            key={m.id}
                            onClick={() => setZoomedMedia(m.content)}
                            className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-gray-800/80 cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm group"
                          >
                            <img
                              src={m.content}
                              alt="Shared media"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                              View Large
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {zoomedMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setZoomedMedia(null)}
        >
          <button
            onClick={() => setZoomedMedia(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 shadow-lg"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-w-full max-h-[90vh] transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedMedia}
              alt="Zoomed shared media"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-gray-800"
            />
          </div>
        </div>
      )}
    </>
  );
};
