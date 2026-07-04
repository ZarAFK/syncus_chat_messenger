import { FC, useState, KeyboardEvent, useRef, useEffect } from "react";
import { Paperclip, Smile, Camera, Send, X } from "lucide-react";
import { encryptMessage } from "@/shared/helper/cryptoHelper";

interface ChatInputProps {
  activeRoom: any;
  socket: any;
  currentUserId: number;
  activeChatUser: any;
}

const emojis = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️"
  ],
  gestures: [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "✨", "🌟", "⭐", "🎉", "🚀", "💥", "💯"
  ]
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const ChatInput: FC<ChatInputProps> = ({ activeRoom, socket, currentUserId, activeChatUser }) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<"smileys" | "gestures" | "hearts">("smileys");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    const hasText = !!text.trim();
    const hasImage = !!imagePreview;

    if (!hasText && !hasImage) return;
    if (!socket || !activeRoom?.room_id) return;

    if (hasImage) {
      socket.emit("createMessage", {
        sender_id: currentUserId,
        receiver_id: activeChatUser?.user_id || undefined,
        room_id: activeRoom.room_id,
        content: imagePreview,
        type: "image",
        status: "sent",
      });
      setImagePreview(null);
    }

    if (hasText) {
      const content = activeRoom.room_name?.startsWith("DM_")
        ? encryptMessage(text.trim(), activeRoom.room_name)
        : text.trim();

      socket.emit("createMessage", {
        sender_id: currentUserId,
        receiver_id: activeChatUser?.user_id || undefined,
        room_id: activeRoom.room_id,
        content: content,
        type: "text",
        status: "sent",
      });
      setText("");
    }
  };


  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
      } catch (err) {
        console.error("Failed to process image:", err);
      }
    }
    // reset selection so user can pick the same file again
    if (e.target) {
      e.target.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const compressed = await compressImage(file);
            setImagePreview(compressed);
            e.preventDefault();
          } catch (err) {
            console.error("Failed to process pasted image:", err);
          }
        }
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col relative z-25">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview Overlay */}
      {imagePreview && (
        <div className="px-4 py-2 bg-[#0a0c10] border-t border-gray-800/60 flex items-center space-x-3 animate-fadeIn relative">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-800 shadow-md">
            <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 hover:bg-black text-white hover:scale-105 transition-all cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          <div className="text-xs text-gray-400 flex flex-col justify-center">
            <span className="font-semibold text-gray-300">Image selected</span>
            <span>Will be compressed & sent upon clicking Send</span>
          </div>
        </div>
      )}

      {/* Main input wrapper */}
      <div className="p-4 bg-[#0d0f14]/90 border-t border-gray-800/60 backdrop-blur-md flex items-center space-x-3 relative">
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-20 left-4 z-40 w-72 bg-[#121620]/95 border border-gray-800/80 rounded-2xl shadow-xl backdrop-blur-md p-3 select-none flex flex-col animate-fadeIn"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-800/60 pb-2 mb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveEmojiTab("smileys")}
                className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${
                  activeEmojiTab === "smileys"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Smileys
              </button>
              <button
                type="button"
                onClick={() => setActiveEmojiTab("gestures")}
                className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${
                  activeEmojiTab === "gestures"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Gestures
              </button>
              <button
                type="button"
                onClick={() => setActiveEmojiTab("hearts")}
                className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${
                  activeEmojiTab === "hearts"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Hearts
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {emojis[activeEmojiTab].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl p-1.5 rounded-lg hover:bg-[#1b212f] active:scale-90 transition-all text-center cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Capsule */}
        <div className="flex-1 h-11 flex items-center bg-[#161b26] border border-gray-800 focus-within:border-blue-500 rounded-2xl px-3 transition-all duration-200 shadow-inner">
          {/* Smile button on the left */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer flex-shrink-0 ${
              showEmojiPicker ? "text-blue-500 bg-blue-500/10" : "text-gray-400 hover:text-gray-200"
            } focus:outline-none`}
          >
            <Smile size={18} />
          </button>

          {/* Actual text input */}
          <input
            type="text"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            className="flex-1 h-full px-2 bg-transparent text-white placeholder-gray-500 focus:outline-none border-none focus:ring-0 text-[15px]"
          />

          {/* Media/Attachment buttons on the right inside capsule */}
          <div className="flex items-center space-x-0.5 text-gray-400 flex-shrink-0">
            <button
              type="button"
              onClick={triggerFileInput}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:text-white hover:bg-[#1f2637] transition-all cursor-pointer focus:outline-none"
              title="Attach File"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={triggerFileInput}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:text-white hover:bg-[#1f2637] transition-all cursor-pointer focus:outline-none"
              title="Take Photo"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>

        {/* Floating circular Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && !imagePreview}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white active:scale-95 transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex-shrink-0 focus:outline-none"
        >
          <Send size={18} className="translate-x-[1px]" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
