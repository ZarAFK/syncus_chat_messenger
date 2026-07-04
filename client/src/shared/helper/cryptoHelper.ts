import CryptoJS from "crypto-js";

// Client-side salt for deriving the encryption key.
// In production, this can be configured in a .env file (e.g. import.meta.env.VITE_E2E_SALT)
const E2E_SALT = import.meta.env.VITE_E2E_SALT || "syncus_secure_salt_key_2026";

/**
 * Derives a cryptographic key from a room name.
 */
const getEncryptionKey = (roomName: string): string => {
  return CryptoJS.PBKDF2(roomName, E2E_SALT, {
    keySize: 256 / 32,
    iterations: 100,
  }).toString();
};

/**
 * Encrypts plaintext using AES-256 with a key derived from the room name.
 * Prefixes the output with [E2E] to identify encrypted messages.
 */
export const encryptMessage = (text: string, roomName: string): string => {
  if (!text) return text;
  try {
    const key = getEncryptionKey(roomName);
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return `[E2E]${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
};

/**
 * Decrypts ciphertext that starts with [E2E] using a key derived from the room name.
 * Returns the plaintext if successful, or the original text if decryption fails.
 */
export const decryptMessage = (text: string, roomName: string): string => {
  if (!text || !text.startsWith("[E2E]")) {
    return text;
  }
  
  try {
    const key = getEncryptionKey(roomName);
    const ciphertext = text.substring(5); // Remove [E2E] prefix
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      return "[Decryption Failed]";
    }
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Failed]";
  }
};
