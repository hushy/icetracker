import React, { useState } from 'react';

/**
 * Password Prompt Modal
 * Asks user for password to decrypt API key
 */
export default function PasswordPrompt({ onSubmit, error }) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(password);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Déverrouillage Requis
          </h2>
          <p className="text-gray-600 text-sm">
            Entrez le mot de passe pour activer les commandes vocales avec l'IA
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez le mot de passe..."
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <span>❌</span>
                <span>{error}</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Déverrouillage...' : 'Déverrouiller'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 <strong>Astuce:</strong> Le mot de passe contient 4 mots anglais liés au hockey
          </p>
        </div>

        <div className="mt-4">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700 font-medium">
              Pourquoi ce mot de passe?
            </summary>
            <p className="mt-2 text-xs">
              Cette protection empêche l'usage accidentel de l'API vocale et limite les coûts.
              ⚠️ Ce n'est pas une sécurité absolue - quelqu'un de déterminé pourrait extraire la clé du code source.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}

