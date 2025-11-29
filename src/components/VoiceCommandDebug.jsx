import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { interpretCommand } from '../utils/commandInterpreter';
import { interpretCommandWithLLM } from '../utils/llmInterpreter';

/**
 * Voice Command Debug UI
 * Shows recognized text and translated actions for testing
 * Supports both fuzzy matching and LLM interpretation
 */
export default function VoiceCommandDebug() {
  const { 
    transcript, 
    interimTranscript, 
    isListening, 
    startListening, 
    stopListening, 
    error,
    language,
    setLanguage
  } = useVoiceRecognition();

  const [commandHistory, setCommandHistory] = useState([]);
  const [lastInterpretation, setLastInterpretation] = useState(null);
  const [useLLM, setUseLLM] = useState(true); // Toggle between fuzzy and LLM
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Check if API key is configured
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const provider = import.meta.env.VITE_LLM_PROVIDER || 'groq';
  const hasApiKey = provider === 'groq' ? !!groqKey : !!openaiKey;

  // Interpret command when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      interpretTranscript(transcript);
    }
  }, [transcript, useLLM]);

  const interpretTranscript = async (text) => {
    setIsInterpreting(true);
    try {
      let interpretation;
      
      if (useLLM) {
        interpretation = await interpretCommandWithLLM(text);
      } else {
        interpretation = interpretCommand(text);
      }
      
      setLastInterpretation(interpretation);
      
      // Add to history
      setCommandHistory(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          transcript: text,
          interpretation,
          usedLLM: useLLM
        },
        ...prev.slice(0, 9) // Keep last 10
      ]);
    } catch (err) {
      console.error('Interpretation error:', err);
      setLastInterpretation({
        success: false,
        error: err.message,
        rawTranscript: text
      });
    } finally {
      setIsInterpreting(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearHistory = () => {
    setCommandHistory([]);
    setLastInterpretation(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎤 Voice Command Debug</h1>
          <p className="text-gray-400">Test and debug voice recognition with command interpretation</p>
        </div>

        {/* API Key Warning */}
        {useLLM && !hasApiKey && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-300 font-medium mb-2">
              ⚠️ LLM API Key Not Configured
            </p>
            <p className="text-sm text-yellow-200 mb-3">
              To use AI-powered voice commands, you need a free Groq API key.
            </p>
            <div className="bg-gray-900 p-3 rounded text-sm mb-3">
              <p className="text-gray-300 mb-2">Quick Setup (2 minutes):</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Get free API key: <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-blue-400 underline">console.groq.com</a></li>
                <li>Create <code className="bg-gray-800 px-1">.env</code> file in project root</li>
                <li>Add: <code className="bg-gray-800 px-1">VITE_GROQ_API_KEY=your_key_here</code></li>
                <li>Restart dev server</li>
              </ol>
            </div>
            <p className="text-xs text-gray-400">
              See <code>QUICKSTART_LLM.md</code> for detailed instructions
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-300">
              ⚠️ Error: {error}
              {error === 'Speech recognition not supported in this browser' && (
                <span className="block mt-2 text-sm">
                  Try using Chrome, Edge, or Safari. Firefox doesn't support Web Speech API.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Control Panel */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Controls</h2>
              <div className="flex gap-3">
                <button
                  onClick={toggleListening}
                  disabled={!!error}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  <span className="text-2xl">{isListening ? '🔴' : '🎤'}</span>
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
                <button
                  onClick={clearHistory}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all"
                >
                  Clear History
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg mb-3">
              <label className="text-sm font-medium text-gray-400">Language:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en-US')}
                  disabled={isListening}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    language === 'en-US' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setLanguage('fr-FR')}
                  disabled={isListening}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    language === 'fr-FR' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  🇫🇷 Français
                </button>
              </div>
              {isListening && (
                <span className="text-xs text-yellow-400">
                  Stop listening to change language
                </span>
              )}
            </div>

            {/* Interpreter Mode Toggle */}
            <div className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg">
              <label className="text-sm font-medium text-gray-400">Interpreter Mode:</label>
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setUseLLM(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !useLLM 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  🔤 Fuzzy Match
                </button>
                <button
                  onClick={() => setUseLLM(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    useLLM 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  🤖 LLM (AI)
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isInterpreting && (
                  <span className="text-sm text-yellow-400 animate-pulse">
                    Interpreting...
                  </span>
                )}
                {useLLM && hasApiKey && (
                  <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded">
                    ✓ API Ready
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-gray-400">
              {isListening ? 'Listening...' : 'Not listening'}
            </span>
          </div>
        </div>

        {/* Live Transcript */}
        {(isListening || interimTranscript) && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border-2 border-blue-500">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Live Transcript</h3>
            <p className="text-xl text-gray-300 min-h-[2rem]">
              {interimTranscript || <span className="text-gray-600">Say something...</span>}
            </p>
          </div>
        )}

        {/* Last Interpretation */}
        {lastInterpretation && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Last Interpretation</h3>
            
            <div className="space-y-4">
              {/* Success/Error */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lastInterpretation.success ? '✅' : '❌'}</span>
                  <span className={`font-medium ${lastInterpretation.success ? 'text-green-400' : 'text-red-400'}`}>
                    {lastInterpretation.success ? 'Command Understood' : 'Failed to Parse'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {lastInterpretation.llmProvider && (
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                      🤖 {lastInterpretation.llmProvider.toUpperCase()}
                    </span>
                  )}
                  {lastInterpretation.latency && (
                    <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded">
                      ⚡ {lastInterpretation.latency}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Raw Transcript */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Raw Speech:</label>
                <div className="p-3 bg-gray-900 rounded font-mono text-sm">
                  {lastInterpretation.rawTranscript}
                </div>
              </div>

              {/* Normalized */}
              {lastInterpretation.normalizedTranscript && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Normalized:</label>
                  <div className="p-3 bg-gray-900 rounded font-mono text-sm text-blue-300">
                    {lastInterpretation.normalizedTranscript}
                  </div>
                </div>
              )}

              {lastInterpretation.success ? (
                <>
                  {/* Intent */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Intent:</label>
                    <div className="p-3 bg-blue-900/30 rounded font-semibold text-blue-300">
                      {lastInterpretation.intent}
                    </div>
                  </div>

                  {/* Entities */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Entities:</label>
                    <div className="p-3 bg-gray-900 rounded font-mono text-sm">
                      <pre>{JSON.stringify(lastInterpretation.entities, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Action:</label>
                    <div className="p-3 bg-green-900/30 rounded text-green-300 font-medium text-lg">
                      {lastInterpretation.action}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Confidence:</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all"
                          style={{ width: `${lastInterpretation.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-sm w-16">
                        {(lastInterpretation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-red-900/20 border border-red-500 rounded">
                  <p className="text-red-300">{lastInterpretation.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Command History */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Command History</h3>
          
          {commandHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No commands yet. Start listening and say something!</p>
          ) : (
            <div className="space-y-3">
              {commandHistory.map((cmd, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    cmd.interpretation.success 
                      ? 'bg-gray-900 border-green-500/30' 
                      : 'bg-red-900/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{cmd.timestamp}</span>
                      {cmd.usedLLM && (
                        <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded">
                          🤖 LLM
                        </span>
                      )}
                      {cmd.interpretation.latency && (
                        <span className="text-xs text-gray-500">
                          {cmd.interpretation.latency}ms
                        </span>
                      )}
                    </div>
                    <span className="text-xl">{cmd.interpretation.success ? '✅' : '❌'}</span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-gray-400 text-sm">Speech: </span>
                    <span className="text-gray-200">{cmd.transcript}</span>
                  </div>
                  
                  {cmd.interpretation.success ? (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 text-sm font-mono">
                        {cmd.interpretation.intent}
                      </span>
                      <span className="text-green-300 font-medium">
                        {cmd.interpretation.action}
                      </span>
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm">
                      {cmd.interpretation.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Examples */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">💡 Test Examples</h3>
          
          {language === 'en-US' ? (
            <>
              <p className="text-gray-400 mb-3">Try saying these commands in English:</p>
              <ul className="space-y-2 text-sm">
                <li className="p-2 bg-gray-900 rounded">🗣️ "Player 12 enters ice"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Goal for us number 7 assisted by 12 and 3"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Player 23 blocks the puck"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Shot by 15"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Player eighteen off ice"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Goal them" (opponent scores)</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Hit by 9"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Takeaway by seven"</li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-3">Essayez ces commandes en français:</p>
              <ul className="space-y-2 text-sm">
                <li className="p-2 bg-gray-900 rounded">🗣️ "Joueur 12 entre sur la glace"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "But pour nous numéro 7 assisté par 12 et 3"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Joueur 23 bloque la rondelle"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Tir par 15"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Joueur dix-huit sort de la glace"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "But pour eux" (l'adversaire marque)</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Mise en échec par 9"</li>
                <li className="p-2 bg-gray-900 rounded">🗣️ "Interception par sept"</li>
              </ul>
            </>
          )}
          
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
            <p className="text-xs text-blue-300">
              💡 <strong>Pro Tip:</strong> The LLM mode understands both languages naturally, 
              but the Web Speech API needs the correct language selected for best recognition!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

