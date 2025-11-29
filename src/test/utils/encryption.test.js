import { describe, it, expect, beforeEach } from 'vitest';
import { encryptApiKey, decryptApiKey, hasApiKey, getApiKey, setApiKey, clearApiKey } from '../../utils/encryption';

describe('Encryption Utils', () => {
  const testPassword = 'test password 123';
  const testApiKey = 'gsk_test_api_key_12345';

  beforeEach(() => {
    clearApiKey();
  });

  describe('encryptApiKey / decryptApiKey', () => {
    it('should encrypt and decrypt API key correctly', () => {
      const encrypted = encryptApiKey(testApiKey, testPassword);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(testApiKey);
      
      const decrypted = decryptApiKey(encrypted, testPassword);
      expect(decrypted).toBe(testApiKey);
    });

    it('should return null with wrong password', () => {
      const encrypted = encryptApiKey(testApiKey, testPassword);
      const decrypted = decryptApiKey(encrypted, 'wrong password');
      expect(decrypted).toBeNull();
    });

    it('should return null for invalid encrypted string', () => {
      const decrypted = decryptApiKey('invalid_encrypted_string', testPassword);
      expect(decrypted).toBeNull();
    });

    it('should only decrypt keys starting with gsk_', () => {
      const invalidKey = 'invalid_key_format';
      const encrypted = encryptApiKey(invalidKey, testPassword);
      const decrypted = decryptApiKey(encrypted, testPassword);
      expect(decrypted).toBeNull();
    });
  });

  describe('API Key Session Management', () => {
    it('should start with no API key', () => {
      expect(hasApiKey()).toBe(false);
      expect(getApiKey()).toBeNull();
    });

    it('should set and get API key', () => {
      setApiKey(testApiKey);
      expect(hasApiKey()).toBe(true);
      expect(getApiKey()).toBe(testApiKey);
    });

    it('should clear API key', () => {
      setApiKey(testApiKey);
      expect(hasApiKey()).toBe(true);
      
      clearApiKey();
      expect(hasApiKey()).toBe(false);
      expect(getApiKey()).toBeNull();
    });

    it('should store API key in window object', () => {
      setApiKey(testApiKey);
      expect(window.__GROQ_API_KEY__).toBe(testApiKey);
    });
  });
});

