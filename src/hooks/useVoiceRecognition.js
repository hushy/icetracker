import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for Web Speech API voice recognition
 * Returns: { transcript, isListening, startListening, stopListening, error, interimTranscript, language, setLanguage }
 */
export function useVoiceRecognition() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('fr-FR'); // Default to French
  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false); // Track if we should auto-restart
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = !isMobile; // ✅ Disable continuous on mobile (causes issues)
    recognition.interimResults = true; // Show interim results
    recognition.lang = language; // Support multiple languages

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended, shouldRestart:', shouldRestartRef.current, 'isMobile:', isMobile);
      setIsListening(false);
      setInterimTranscript('');
      
      // Auto-restart if user still wants to listen (keeps mic active between commands)
      // ✅ Only auto-restart on desktop (mobile handles this differently)
      if (shouldRestartRef.current && !isMobile) {
        console.log('[Voice] Auto-restarting recognition (desktop)...');
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('[Voice] Auto-restart failed:', err);
              // If restart fails, stop properly
              shouldRestartRef.current = false;
              setIsListening(false);
            }
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        console.log('[Voice] Final transcript:', final);
        setTranscript(final);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]); // Reinitialize when language changes

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      shouldRestartRef.current = true; // Enable auto-restart
      console.log('[Voice] Starting recognition, language:', language);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('[Voice] Error starting recognition:', err);
        setError(err.message);
      }
    }
  };

  const clearTranscript = () => {
    console.log('[Voice] Clearing transcript');
    setTranscript('');
    setInterimTranscript('');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      shouldRestartRef.current = false; // Disable auto-restart
      console.log('[Voice] Stopping recognition');
      recognitionRef.current.stop();
    }
  };

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    error,
    language,
    setLanguage,
    clearTranscript
  };
}

