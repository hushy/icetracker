import React, { useState, useEffect } from 'react';
import App from './App.jsx';
import VoiceCommandDebug from './components/VoiceCommandDebug.jsx';

/**
 * Simple router to toggle between main app and voice debug UI
 * Access debug mode via URL: ?debug=voice
 * No button shown - debug mode is hidden by default
 */
export default function AppRouter() {
  // Check URL params for debug mode
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setShowDebug(urlParams.get('debug') === 'voice');
  }, []);

  // Listen for URL changes (if user manually changes URL)
  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(urlParams.get('debug') === 'voice');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (showDebug) {
    return (
      <div>
        <VoiceCommandDebug />
        <button
          onClick={() => {
            setShowDebug(false);
            // Remove debug param from URL
            const url = new URL(window.location);
            url.searchParams.delete('debug');
            window.history.pushState({}, '', url);
          }}
          className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          Back to App
        </button>
      </div>
    );
  }

  return <App />;
}

