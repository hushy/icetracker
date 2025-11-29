import React, { useState } from 'react';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import PasswordPrompt from './PasswordPrompt';
import { decryptApiKey, setApiKey } from '../utils/encryption';

/**
 * Voice Command Widget
 * Floating microphone button with feedback display
 * Integrates voice commands into the main app
 */
export default function VoiceCommandWidget({ actions, context, useLLM = true }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const {
    isListening,
    startListening,
    stopListening,
    error,
    language,
    setLanguage,
    feedback,
    interimTranscript,
    lastCommand,
    commandHistory,
    clearHistory,
    needsPassword,
    setNeedsPassword
  } = useVoiceCommands(actions, context, useLLM);

  // Handle password submission
  const handlePasswordSubmit = async (password) => {
    const apiKey = decryptApiKey(password);
    
    if (apiKey) {
      setApiKey(apiKey);
      setNeedsPassword(false);
      setPasswordError('');
      console.log('[VoiceWidget] ✅ API key unlocked successfully');
    } else {
      setPasswordError('Mot de passe incorrect. Essayez encore.');
      console.log('[VoiceWidget] ❌ Invalid password');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Show password prompt if needed
  if (needsPassword) {
    return <PasswordPrompt onSubmit={handlePasswordSubmit} error={passwordError} />;
  }

  // If hidden, show only a small show button
  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        title="Show voice commands"
      >
        <span className="text-lg sm:text-xl">🎤</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Feedback Toast */}
      {feedback && (
        <div 
          className={`absolute bottom-16 sm:bottom-20 right-0 min-w-[200px] sm:min-w-[250px] p-2 sm:p-3 rounded-lg shadow-lg mb-2 animate-slide-up ${
            feedback.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">
              {feedback.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="text-sm sm:font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Interim Transcript Display */}
      {isListening && interimTranscript && (
        <div className="absolute bottom-16 sm:bottom-20 right-0 min-w-[200px] sm:min-w-[250px] p-2 sm:p-3 bg-blue-600 text-white rounded-lg shadow-lg mb-2">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🎤</span>
            <span className="text-xs sm:text-sm">{interimTranscript}</span>
          </div>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 sm:bottom-20 right-0 w-[90vw] max-w-sm sm:w-80 bg-gray-800 text-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-2 sm:p-3 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-semibold">Voice Commands</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en-US')}
                disabled={isListening}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  language === 'en-US'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                } disabled:opacity-50`}
              >
                🇺🇸 EN
              </button>
              <button
                onClick={() => setLanguage('fr-FR')}
                disabled={isListening}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  language === 'fr-FR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                } disabled:opacity-50`}
              >
                🇫🇷 FR
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/50 border-b border-red-700">
              <p className="text-xs text-red-300">⚠️ {error}</p>
            </div>
          )}

          {/* Last Command */}
          {lastCommand && (
            <div className="p-3 bg-gray-900 border-b border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Last command:</p>
              <p className="text-sm font-medium">{lastCommand.transcript}</p>
              {lastCommand.interpretation.success && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ {lastCommand.interpretation.action}
                </p>
              )}
            </div>
          )}

          {/* Command History */}
          <div className="p-3 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">History</p>
              {commandHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {commandHistory.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No commands yet
              </p>
            ) : (
              <div className="space-y-2">
                {commandHistory.slice(0, 5).map((cmd, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs ${
                      cmd.interpretation.success
                        ? 'bg-gray-900'
                        : 'bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex-1">{cmd.transcript}</span>
                      <span>
                        {cmd.interpretation.success ? '✅' : '❌'}
                      </span>
                    </div>
                    {cmd.result?.message && (
                      <p className={`mt-1 ${
                        cmd.result.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {cmd.result.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Microphone Button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Listening indicator (mobile: smaller) */}
        {isListening && (
          <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-medium animate-pulse">
            <span className="hidden sm:inline">Listening...</span>
            <span className="sm:hidden">🎤</span>
          </div>
        )}
        
        {/* Hide button - only show when not listening */}
        {!isListening && (
          <button
            onClick={() => setIsHidden(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-400 hover:bg-gray-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
            title="Hide voice widget"
          >
            <span className="text-sm sm:text-base">✕</span>
          </button>
        )}
        
        {/* History button - only show on larger screens or when expanded */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-9 h-9 sm:w-11 sm:h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all ${
            isExpanded ? 'ring-2 ring-white' : ''
          }`}
          title="Command history"
        >
          <span className="text-base sm:text-lg">📋</span>
        </button>

        {/* Main mic button */}
        <button
          onClick={toggleListening}
          disabled={!!error}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all font-medium ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-xl sm:text-2xl">{isListening ? '⏹' : '🎤'}</span>
        </button>
      </div>

      {/* Quick Tips - Hide on mobile to reduce clutter */}
      {!isListening && !isExpanded && !feedback && (
        <div className="hidden sm:block absolute bottom-20 right-0 bg-gray-800 text-white p-2 rounded-lg shadow-lg text-xs max-w-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <p className="font-medium mb-1">Quick voice commands:</p>
          <ul className="space-y-0.5 text-gray-300">
            <li>• "entrée 1 2 3"</li>
            <li>• "but par 7"</li>
            <li>• "tir par 15"</li>
          </ul>
        </div>
      )}
    </div>
  );
}

