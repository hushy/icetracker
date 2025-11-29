# Voice Command System

## Overview

This implementation uses the **Web Speech API** with a modular fuzzy-matching interpreter that can be easily swapped for an LLM-based solution later.

## Architecture

```
Speech → Web Speech API → Transcript → Interpreter → Command → UI Action
                                          ↓
                                    (Can swap with LLM)
```

### Components

1. **`useVoiceRecognition.js`** - React hook for Web Speech API
   - Handles browser speech recognition
   - Returns transcript, interim results, and listening state

2. **`commandInterpreter.js`** - Fuzzy matching interpreter (SWAPPABLE)
   - Intent detection via keyword matching
   - Entity extraction (player numbers, names)
   - Confidence scoring
   - **Ready to be replaced with LLM call**

3. **`VoiceCommandDebug.jsx`** - Test/Debug UI
   - Shows recognized text
   - Displays interpreted commands
   - Command history
   - Confidence scores

## How to Use

### Access Debug UI

1. **Button Access**: Click the "🎤 Voice Debug" button in bottom-right corner
2. **URL Access**: Add `?debug=voice` to your URL

### Testing Voice Commands

1. Click "Start Listening" button
2. Grant microphone permissions
3. Speak a command clearly
4. See real-time interpretation

### Supported Commands

#### Player Management
- "Player 12 enters ice"
- "Player three on ice"
- "Player 23 off ice"
- "Player eighteen coming off"

#### Goals
- "Goal for us number 7" 
- "Goal for us 7 assisted by 12 and 3"
- "We scored number 15"
- "Goal them" (opponent scores)

#### Stats
- "Player 12 blocks the puck"
- "Shot by 15"
- "Player 23 hits"
- "Zone entry by 7"
- "Takeaway 12"
- "Giveaway by 8"

### Number Recognition

The system converts spoken words to numbers:
- "three" → 3
- "twenty three" → 23
- "eighteen" → 18

## Upgrading to LLM-Based Interpreter

To swap the fuzzy matcher with an LLM (GPT-4, Claude, etc.):

### 1. Create LLM Interpreter

```javascript
// src/utils/llmInterpreter.js
export async function interpretCommandWithLLM(transcript, context) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a hockey voice command interpreter. 
          Parse commands and return JSON with: 
          { intent, entities, confidence, action }.
          
          Valid intents: player_on_ice, player_off_ice, goal_us, goal_them, 
          shot, block, hit, zone_entry, takeaway, giveaway.
          
          Extract player numbers and return structured data.`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.3
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### 2. Update VoiceCommandDebug.jsx

Change line ~27:
```javascript
// OLD
const interpretation = interpretCommand(transcript);

// NEW
const interpretation = await interpretCommandWithLLM(transcript);
```

### 3. Benefits of LLM Approach

✅ Better understanding of natural language  
✅ Handles variations and typos  
✅ Can understand context  
✅ Easier to add new commands  

❌ Requires API key and costs  
❌ Adds latency (~500ms-2s)  
❌ Needs internet connection  

## Browser Compatibility

### Supported
- ✅ Chrome/Chromium (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Safari (Desktop & iOS)

### Not Supported
- ❌ Firefox (no Web Speech API)

### Requirements
- HTTPS in production (HTTP only works on localhost)
- Microphone permissions

## Tips for Best Recognition

1. **Speak clearly** and at normal pace
2. **Use numbers** instead of spelled-out names when possible
3. **Pause briefly** between commands
4. **Check interim transcript** to see what's being recognized
5. **Use consistent phrasing** for better accuracy

## Troubleshooting

### "Speech recognition not supported"
- Use Chrome, Edge, or Safari
- Firefox doesn't support Web Speech API

### Commands not recognized
- Check Debug UI to see raw transcript
- Speak more clearly or adjust phrasing
- Add more keywords to `intentPatterns` in `commandInterpreter.js`

### Microphone not working
- Check browser permissions
- Try HTTPS (required for production)
- Check system microphone settings

## Future Enhancements

- [ ] Add confirmation UI for low-confidence commands
- [ ] Support player name recognition (not just numbers)
- [ ] Multi-language support
- [ ] Offline LLM via WebAssembly
- [ ] Custom wake word ("Hey Hockey")
- [ ] Continuous listening mode
- [ ] Voice feedback confirmation

