/**
 * Simple API Key Encryption/Decryption
 * ⚠️ WARNING: This is NOT secure against determined attackers!
 * The encryption code is visible in the browser, so anyone can reverse it.
 * This only prevents accidental/casual usage.
 */
import CryptoJS from 'crypto-js';

// The encrypted API key
// Encrypted using AES-256 with a secure password
export const ENCRYPTED_API_KEY = 'U2FsdGVkX19rbHMFH7dFfFrVyTuyVeLUW+qBRNplqh1wcjS9Ha3fVExyoTEYETuyS2eGQCkMnBa9St8ZxOXxVCsGMt2Syx8/voHU9ksPbJI=';

/**
 * Decrypt the API key with the password
 * @param {string} password - The password to decrypt
 * @returns {string|null} - Decrypted API key or null if wrong password
 */
export function decryptApiKey(password) {
  try {
    const bytes = CryptoJS.AES.decrypt(ENCRYPTED_API_KEY, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // Check if decryption was successful (decrypted string should start with 'gsk_')
    if (decrypted && decrypted.startsWith('gsk_')) {
      return decrypted;
    }
    
    console.error('[Encryption] Invalid password or corrupted key');
    return null;
  } catch (error) {
    console.error('[Encryption] Decryption error:', error);
    return null;
  }
}

/**
 * Encrypt an API key with a password (for setup only)
 * @param {string} apiKey - The API key to encrypt
 * @param {string} password - The password to use
 * @returns {string} - Encrypted key
 */
export function encryptApiKey(apiKey, password) {
  return CryptoJS.AES.encrypt(apiKey, password).toString();
}

/**
 * Check if we have an API key in session
 */
export function hasApiKey() {
  return window.__GROQ_API_KEY__ !== undefined;
}

/**
 * Get the cached API key from session
 */
export function getApiKey() {
  return window.__GROQ_API_KEY__ || null;
}

/**
 * Cache the API key in memory (not localStorage for security)
 */
export function setApiKey(key) {
  window.__GROQ_API_KEY__ = key;
}

/**
 * Clear the cached API key
 */
export function clearApiKey() {
  delete window.__GROQ_API_KEY__;
}

