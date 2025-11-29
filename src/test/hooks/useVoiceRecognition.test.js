import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';

describe('useVoiceRecognition Hook', () => {
  let mockRecognition;

  beforeEach(() => {
    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: 'fr-FR',
      maxAlternatives: 1,
      onstart: null,
      onend: null,
      onerror: null,
      onresult: null,
      onspeechstart: null,
      onspeechend: null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };

    global.SpeechRecognition = vi.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isSupported).toBe(true);
  });

  it('should start recognition when startListening is called', async () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(mockRecognition.start).toHaveBeenCalled();
    
    // Simulate onstart
    act(() => {
      mockRecognition.onstart();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should stop recognition when stopListening is called', async () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.onstart();
    });

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.stop).toHaveBeenCalled();

    act(() => {
      mockRecognition.onend();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('should capture final transcript', async () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    // Simulate speech recognition result
    const mockEvent = {
      results: [[{
        transcript: 'joueur 1 entre',
        isFinal: true
      }]],
      resultIndex: 0
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe('joueur 1 entre');
    });
  });

  it('should capture interim transcript', async () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    const mockEvent = {
      results: [[{
        transcript: 'joueur',
        isFinal: false
      }]],
      resultIndex: 0
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.interimTranscript).toBe('joueur');
    });
  });

  it('should clear transcript', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    const mockEvent = {
      results: [[{
        transcript: 'test',
        isFinal: true
      }]],
      resultIndex: 0
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    act(() => {
      result.current.clearTranscript();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
  });

  it('should change language', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.setLanguage('en-US');
    });

    expect(mockRecognition.lang).toBe('en-US');
  });

  it('should handle recognition errors', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    const mockError = { error: 'no-speech' };

    act(() => {
      mockRecognition.onerror(mockError);
    });

    expect(result.current.error).toBe('no-speech');
  });

  it('should auto-restart when enabled', async () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.onstart();
    });

    // Simulate recognition end
    act(() => {
      mockRecognition.onend();
    });

    // Should attempt to restart
    await waitFor(() => {
      expect(mockRecognition.start).toHaveBeenCalledTimes(2);
    }, { timeout: 1500 });
  });

  it('should not be supported if SpeechRecognition is unavailable', () => {
    global.SpeechRecognition = undefined;
    global.webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useVoiceRecognition());

    expect(result.current.isSupported).toBe(false);
  });
});

