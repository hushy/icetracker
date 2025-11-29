import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Web Speech API
global.SpeechRecognition = vi.fn(() => ({
  continuous: false,
  interimResults: false,
  lang: 'fr-FR',
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
}));

global.webkitSpeechRecognition = global.SpeechRecognition;

