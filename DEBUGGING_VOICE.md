# Voice Command Debugging Guide

## 🐛 Bug Fixes Applied

### 1. **Infinite Loop Fixed** ✅
- **Issue:** Goals kept increasing infinitely
- **Cause:** Transcript wasn't being cleared after processing, causing re-processing
- **Fix:** Added `clearTranscript()` immediately after receiving transcript
- **Result:** Each command now processes exactly once

### 2. **Comprehensive Logging Added** ✅
- Added detailed console logging throughout the voice command pipeline
- All logs prefixed with tags: `[Voice]`, `[VoiceCmd]`, `[LLM]`, `[Actions]`
- Tracks every step from speech recognition to action execution

---

## 📊 Console Log Flow

When you say a voice command, you'll see this sequence in the browser console:

```
[Voice] Starting recognition, language: en-US
[Voice] Final transcript: player 12 enters ice
[VoiceCmd] New transcript received: player 12 enters ice
[VoiceCmd] Processing transcript: player 12 enters ice
[Voice] Clearing transcript
[VoiceCmd] Using LLM interpretation
[LLM] Interpreting: player 12 enters ice
[LLM] Provider: groq Has Key: true
[LLM] Calling groq API...
[LLM] Response received in 342 ms
[LLM] Raw response: {"intent":"player_on_ice","entities":{"players":[12]}...}
[LLM] Parsed: {intent: "player_on_ice", entities: {players: [12]}, ...}
[VoiceCmd] Interpretation result: {success: true, intent: "player_on_ice", ...}
[VoiceCmd] Executing command: {success: true, intent: "player_on_ice", ...}
[VoiceCmd] Intent: player_on_ice Entities: {players: [12]}
[VoiceCmd] Looking for players: [12]
[VoiceCmd] Finding player # 12
[Actions] Finding player with number: 12 (parsed: 12)
[Actions] Available players: [{id: "...", number: 12, name: "John"}, ...]
[Actions] Found: John (#12)
[VoiceCmd] Found player: {id: "...", number: 12, name: "John", ...}
[VoiceCmd] Adding player to ice: 12
[VoiceCmd] Execution result: {success: true, message: "#12 on ice"}
```

---

## 🔍 Debugging Common Issues

### Issue: "Player not found"

**Look for these logs:**
```
[VoiceCmd] Finding player # 12
[Actions] Finding player with number: 12 (parsed: 12)
[Actions] Available players: [...]
[Actions] Found: NOT FOUND
```

**Possible causes:**
1. Player number doesn't exist in roster
2. Number parsed incorrectly (check "parsed:" value)
3. Player list is empty

**How to fix:**
- Check the "Available players" log to see all player numbers
- Verify the number you said matches a player number
- Make sure you've added players to the team before the match

---

### Issue: Infinite loop of LLM calls

**Fixed!** But if it happens again, look for:
```
[Voice] Final transcript: goal for us 7
[VoiceCmd] Processing transcript: goal for us 7
[Voice] Clearing transcript  ← This should appear!
[LLM] Interpreting: goal for us 7
...
[Voice] Final transcript: goal for us 7  ← Should NOT repeat
```

**If you see repeated transcripts:**
- The clearTranscript() might not be working
- Check that `voiceRecognition.clearTranscript()` is being called

---

### Issue: LLM not understanding commands

**Look for:**
```
[LLM] Raw response: {"error":"Could not understand command","confidence":0}
```

**Or:**
```
[LLM] Parsed: {intent: "wrong_intent", entities: {...}}
```

**How to debug:**
1. Check the raw transcript: `[Voice] Final transcript: ...`
2. See what the LLM returned: `[LLM] Raw response: ...`
3. Check if entities were extracted: `[VoiceCmd] Entities: {...}`

**Possible fixes:**
- Speak more clearly
- Use standard command phrasing
- Check language setting matches your speech
- Try the fuzzy matcher instead (toggle in debug UI)

---

### Issue: Player numbers not being recognized

**Check entity extraction:**
```
[LLM] Parsed: {intent: "player_on_ice", entities: {players: []}}  ← Empty!
```

**Or:**
```
[VoiceCmd] Entities: {players: []}  ← No numbers extracted
```

**Possible causes:**
1. LLM didn't extract numbers from speech
2. Numbers were spoken unclearly
3. LLM response format is wrong

**How to verify:**
- Check raw transcript: Did it hear the number?
- Check LLM response: Did it extract the number?
- Check entity parsing: Did the code parse it correctly?

---

## 🧪 Testing & Debugging Workflow

### 1. Open Browser Console
```
Chrome: F12 → Console tab
Safari: Cmd+Option+C
Edge: F12 → Console tab
```

### 2. Clear Console
```
Click the 🚫 icon or press Cmd+K (Mac) / Ctrl+L (Windows)
```

### 3. Say a Command
```
Example: "player 12 enters ice"
```

### 4. Review Logs
```
Look for:
✅ [Voice] Final transcript: ... (correct text?)
✅ [LLM] Response received in ... ms (fast enough?)
✅ [LLM] Parsed: ... (correct intent?)
✅ [Actions] Found: ... (player found?)
✅ [VoiceCmd] Execution result: {success: true}
```

### 5. Identify Issues
```
❌ Wrong transcript? → Speech recognition issue (microphone, language)
❌ Wrong intent? → LLM interpretation issue (phrasing, prompt)
❌ Player not found? → Number mismatch or roster issue
❌ Execution error? → App state issue
```

---

## 📋 Debug Checklist

When reporting bugs, provide:

- [ ] Console logs (copy/paste entire sequence)
- [ ] What you said (exact words)
- [ ] Expected behavior
- [ ] Actual behavior
- [ ] Language setting (EN/FR)
- [ ] Interpreter mode (Fuzzy/LLM)
- [ ] Player roster (numbers and names)

---

## 🔧 Quick Fixes

### Force Clear Everything
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Test Without LLM
```
1. Go to debug UI: ?debug=voice
2. Toggle to "🔤 Fuzzy Match"
3. Test same command
4. Compare results
```

### Check API Key
```
1. Open debug UI
2. Look for yellow warning box
3. If "API Key Not Configured", check .env file
```

### Verify Player Numbers
```javascript
// In browser console:
console.log(JSON.parse(localStorage.getItem('appState')));
// Check teams → players → number field
```

---

## 🎯 Expected Log Pattern

**Successful Command:**
```
[Voice] Final transcript: goal for us 7 assisted by 12
[VoiceCmd] New transcript received
[VoiceCmd] Processing transcript
[Voice] Clearing transcript
[LLM] Interpreting
[LLM] Response received in 280 ms
[LLM] Parsed: {intent: "goal_us", entities: {scorer: 7, assist1: 12}}
[VoiceCmd] Executing command
[VoiceCmd] Goal - Scorer: 7 A1: 12 A2: null
[VoiceCmd] Recording goal for us
[VoiceCmd] Execution result: {success: true, message: "Goal by #7 (A: #12)"}
```

**Failed Command:**
```
[Voice] Final transcript: xyz 999
[LLM] Interpreting: xyz 999
[LLM] Parsed: {error: "Could not understand command"}
[VoiceCmd] Interpretation failed: Could not understand command
```

---

## 🚨 Known Issues & Workarounds

### 1. Microphone Permission Denied
**Error:** No logs at all
**Fix:** Allow microphone access in browser settings

### 2. HTTPS Required in Production
**Error:** "Speech recognition not supported"
**Fix:** Deploy to Vercel/Netlify (automatic HTTPS)

### 3. Rate Limiting (Groq)
**Error:** "API error: 429"
**Fix:** Wait a minute, or create new API key

### 4. Numbers Not Converting
**Example:** "twenty three" → interpreted as text, not 23
**Check:** `[LLM] Parsed` should show numeric entity
**Fix:** LLM should handle this, check prompt

---

## 📞 Getting Help

If logs don't help you identify the issue:

1. **Copy all console logs** from when you click "Start Listening" to the result
2. **Note the exact command** you said
3. **Check if it works in debug mode:** `?debug=voice`
4. **Try fuzzy matcher** to isolate LLM vs recognition issues
5. **Share logs** with relevant sections highlighted

---

## 💡 Pro Tips

### Filter Console Logs
```
Click the filter icon and type: [VoiceCmd]
Shows only command execution logs
```

### Save Logs
```
Right-click in console → "Save as..." → log.txt
```

### Performance Check
```
Look for [LLM] Response received in X ms
Should be < 1000ms for Groq
```

### Verify Entities
```
Every command should show:
[VoiceCmd] Intent: ... Entities: {...}
If entities are {} or wrong, LLM didn't extract properly
```

---

**Last Updated:** 2025-11-29

