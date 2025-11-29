# Tests - Hockey TOI Tracker

Suite de tests complète pour l'application Hockey TOI Tracker.

## Installation

Les dépendances de test sont déjà dans le projet. Si vous devez les réinstaller:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Lancer les tests

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch (recommandé pour le développement)
npm test -- --watch

# Lancer les tests avec l'interface UI
npm run test:ui

# Lancer les tests avec couverture de code
npm run test:coverage
```

## Structure des tests

```
src/test/
├── setup.js                                    # Configuration globale
├── utils/
│   ├── encryption.test.js                      # Tests encryption/decryption API key
│   ├── voiceCommandActions.test.js             # Tests actions vocales
│   └── llmInterpreter.test.js                  # Tests interpréteur LLM
├── hooks/
│   └── useVoiceRecognition.test.js             # Tests reconnaissance vocale
├── components/
│   ├── ClockLogic.test.js                      # Tests logique chronomètre
│   ├── PenaltyLogic.test.js                    # Tests logique pénalités
│   ├── PlayerManagement.test.js                # Tests gestion joueurs
│   ├── GoalRecording.test.js                   # Tests enregistrement buts
│   └── EventsAndUndo.test.js                   # Tests événements et undo
└── integration/
    └── VoiceCommandWorkflow.test.js            # Tests d'intégration complets
```

## Couverture des fonctionnalités

### ✅ Encryption (encryption.test.js)
- Chiffrement/déchiffrement de clé API
- Validation format clé (gsk_)
- Gestion session (get/set/clear)

### ✅ Gestion des joueurs (PlayerManagement.test.js)
- Ajout de joueurs
- Toggle on/off ice (simple et batch)
- Mise à jour des statistiques
- Filtrage joueurs en pénalité

### ✅ Chronomètre (ClockLogic.test.js)
- Formatage du temps (ms → mm:ss)
- Parsing du temps (mm:ss → ms)
- Calcul temps écoulé (clock running vs paused)
- Détection expiration countdown

### ✅ Buts (GoalRecording.test.js)
- Enregistrement but (scoreur + assists)
- Mise à jour +/- pour joueurs sur glace
- Validation scoreur existant
- Libération pénalité adverse sur but

### ✅ Pénalités (PenaltyLogic.test.js)
- Détection expiration pénalité
- Calcul temps restant
- Mapping durée → type (Minor, Major, etc.)
- Libération sur but (rules NHL)

### ✅ Commandes vocales (voiceCommandActions.test.js, useVoiceRecognition.test.js)
- Recherche joueur par numéro
- Actions batch (multiple players)
- Contrôle chrono (start/pause/set)
- Web Speech API (mocked)
- Auto-restart microphone

### ✅ Interpréteur LLM (llmInterpreter.test.js)
- Parsing commandes français/anglais
- Mapping intents (goal, penalty, player_on_ice, etc.)
- Gestion erreurs API
- Détection langue automatique

### ✅ Événements (EventsAndUndo.test.js)
- Ajout événements
- Undo dernier événement
- Filtrage par type / joueur
- Timeline (tri chronologique)

### ✅ Intégration (VoiceCommandWorkflow.test.js)
- Workflow complet d'un match
- Interaction entre modules
- Scénarios multi-étapes
- État cohérent entre actions

## Tests importants à vérifier

### 1. Timing des pénalités ⏱️
```javascript
// Test: Penalty should start at correct match time
// Vérifie que startTimeMs utilise clock.elapsedMs (pas Date.now())
// Et calcule correctement pour clock running
```

### 2. Batch player updates 👥
```javascript
// Test: Multiple players should toggle simultaneously
// Vérifie que toggleMultiplePlayersOnIce applique tous les changements
// (évite bug React state batching)
```

### 3. Penalty release on goal 🥅
```javascript
// Test: Opponent penalty released when we score
// Vérifie que seules les pénalités mineures adverses sont libérées
// (pas nos propres pénalités!)
```

### 4. Player number type matching 🔢
```javascript
// Test: Find player by number (string vs int)
// Vérifie parseInt() pour comparaison roster (string) vs LLM (number)
```

## Debugging tests

Pour déboguer un test spécifique:

```bash
# Lancer un seul fichier
npm test -- encryption.test.js

# Lancer avec verbose output
npm test -- --reporter=verbose

# Lancer avec debug mode
DEBUG=* npm test
```

## Mocking

Les tests utilisent des mocks pour:
- **Web Speech API**: `global.SpeechRecognition` (mock dans setup.js)
- **localStorage**: Mock complet avec spies
- **fetch**: Mock pour appels LLM API (dans chaque test)

## CI/CD

Les tests peuvent être intégrés dans GitHub Actions:

```yaml
- name: Run tests
  run: npm test -- --run

- name: Check coverage
  run: npm run test:coverage -- --run
```

## Prochaines étapes

Pour améliorer la couverture:
1. Tests UI avec @testing-library/react (render components)
2. Tests E2E avec Playwright
3. Tests de performance (large rosters)
4. Tests d'accessibilité (a11y)

## Notes

- Les tests sont **unitaires et d'intégration** (pas E2E)
- Ils testent la **logique métier**, pas le rendu React
- Mocking minimal pour rester proche du comportement réel
- Couverture cible: **>80%** des fonctions critiques

