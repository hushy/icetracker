# Voice Command Integration Guide

## How to Add Voice Commands to Your App

### Step 1: Import Required Components

Add these imports to your `App.jsx`:

```javascript
import VoiceCommandWidget from './components/VoiceCommandWidget';
import { createVoiceCommandActions, createVoiceCommandContext } from './utils/voiceCommandActions';
```

### Step 2: Create Actions Object

Inside your main app component, where you have access to your state management functions, create the actions object:

```javascript
function App() {
  // ... your existing state and functions ...
  
  // Find the section where you have functions like:
  // - togglePlayerOnIce(playerId)
  // - recordGoal(usScored, scorerNumber, assist1, assist2)
  // - updatePlayerStat(playerId, stat, delta)
  
  // Create voice command actions
  const voiceActions = createVoiceCommandActions({
    togglePlayerOnIce,
    recordGoal,
    updatePlayerStat,
    players: currentMatch?.players || []
  });
  
  // Create voice command context
  const voiceContext = createVoiceCommandContext({
    players: currentMatch?.players || [],
    match: currentMatch
  });
  
  // ... rest of your component ...
}
```

### Step 3: Add Widget to JSX

Add the VoiceCommandWidget to your JSX, typically at the end before the closing tag:

```javascript
return (
  <div className="app">
    {/* ... your existing UI ... */}
    
    {/* Add voice command widget (only show during active match) */}
    {currentMatch && (
      <VoiceCommandWidget 
        actions={voiceActions}
        context={voiceContext}
        useLLM={true}  // Set to false to use fuzzy matching instead
      />
    )}
  </div>
);
```

## Complete Integration Example

Here's a minimal example showing where to place the code:

```javascript
import React, { useState } from 'react';
import VoiceCommandWidget from './components/VoiceCommandWidget';
import { createVoiceCommandActions, createVoiceCommandContext } from './utils/voiceCommandActions';

function App() {
  const [currentMatch, setCurrentMatch] = useState(null);
  
  // Your existing functions
  function togglePlayerOnIce(playerId) {
    // ... your implementation ...
  }
  
  function recordGoal(usScored, scorerNumber, assist1Number, assist2Number) {
    // ... your implementation ...
  }
  
  function updatePlayerStat(playerId, stat, delta) {
    // ... your implementation ...
  }
  
  // Create voice command integration (only when match is active)
  const voiceActions = currentMatch ? createVoiceCommandActions({
    togglePlayerOnIce,
    recordGoal,
    updatePlayerStat,
    players: currentMatch.players
  }) : null;
  
  const voiceContext = currentMatch ? createVoiceCommandContext({
    players: currentMatch.players,
    match: currentMatch
  }) : null;
  
  return (
    <div className="app">
      {/* Your existing UI */}
      <h1>Hockey Tracker</h1>
      
      {/* Match interface */}
      {currentMatch && (
        <div>
          {/* ... your match UI ... */}
        </div>
      )}
      
      {/* Voice Command Widget (floating button) */}
      {currentMatch && voiceActions && (
        <VoiceCommandWidget 
          actions={voiceActions}
          context={voiceContext}
          useLLM={true}
        />
      )}
    </div>
  );
}

export default App;
```

## Finding the Right Location in App.jsx

Look for these patterns in your `App.jsx`:

### 1. Find the State Management Section

```javascript
// Look for something like:
const [matches, setMatches] = useState([]);
const [currentMatchId, setCurrentMatchId] = useState(null);
const currentMatch = matches.find(m => m.id === currentMatchId);
```

### 2. Find the Action Functions

```javascript
// Look for functions like:
function togglePlayerOnIce(playerId) { ... }
function recordGoal(...) { ... }
function updatePlayerStat(...) { ... }
```

These are typically around line 3400-3600 in your current `App.jsx`.

### 3. Find the Main Return Statement

```javascript
// Look for the main component return, typically near the end:
return (
  <div className="...">
    {/* Add VoiceCommandWidget here, before the closing div */}
  </div>
);
```

## Customization Options

### Change Language Default

```javascript
<VoiceCommandWidget 
  actions={voiceActions}
  context={voiceContext}
  useLLM={true}
  defaultLanguage="fr-FR"  // Set to French
/>
```

### Use Fuzzy Matching Instead of LLM

```javascript
<VoiceCommandWidget 
  actions={voiceActions}
  context={voiceContext}
  useLLM={false}  // Use faster fuzzy matching
/>
```

### Conditional Voice Commands

```javascript
{/* Only show during gameplay, not during setup */}
{currentMatch && clock.running && (
  <VoiceCommandWidget 
    actions={voiceActions}
    context={voiceContext}
    useLLM={true}
  />
)}
```

## Supported Voice Commands

### English:
- "Player 12 enters ice" / "Player 12 on ice"
- "Player 12 off ice" / "Player 12 coming off"
- "Goal for us number 7"
- "Goal for us 7 assisted by 12 and 3"
- "Goal them" / "They scored"
- "Shot by 15"
- "Player 23 blocks the puck"
- "Hit by 9"
- "Zone entry by 7"
- "Takeaway by 12"
- "Giveaway by 8"

### French:
- "Joueur 12 entre sur la glace"
- "Joueur 12 sort de la glace"
- "But pour nous numéro 7"
- "But pour nous 7 assisté par 12 et 3"
- "But pour eux"
- "Tir par 15"
- "Joueur 23 bloque la rondelle"
- "Mise en échec par 9"
- "Entrée de zone par 7"
- "Interception par 12"
- "Revirement par 8"

## Troubleshooting

### Widget not showing
- Make sure `currentMatch` is not null
- Check that you've passed valid `actions` and `context` objects
- Verify the VoiceCommandWidget import path is correct

### Commands not working
- Check browser console for errors
- Verify your action functions are correctly bound
- Make sure player numbers exist in your roster
- Check that players are on ice before recording stats

### "Player not found" errors
- Verify the player with that number exists in `currentMatch.players`
- Check that `actions.findPlayerByNumber()` is working correctly
- Make sure you're passing the current players array

## Next Steps

1. Test the basic integration
2. Try various voice commands
3. Adjust feedback messages if needed
4. Consider adding more intents (penalties, etc.)
5. Customize the UI to match your app's theme

## Need Help?

Check:
- `VoiceCommandWidget.jsx` - The UI component
- `useVoiceCommands.js` - The voice command hook
- `llmInterpreter.js` - The AI interpretation logic
- `QUICKSTART_LLM.md` - LLM setup guide

