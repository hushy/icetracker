# Voice Command Debug Mode

## Accessing Debug Mode

The voice command debug interface is hidden by default and only accessible via URL parameter.

### URL Access

Add `?debug=voice` to your URL:

**Development:**
```
http://localhost:5173/?debug=voice
```

**Production:**
```
https://your-domain.com/?debug=voice
```

### Why Hidden?

The debug mode is hidden from regular users because:
- It's a developer/testing tool
- Avoids cluttering the main UI
- Prevents accidental access
- Keeps the main app clean and focused

---

## Using Debug Mode

### Features Available:

1. **Live Transcript** - See what the speech recognition hears
2. **Intent Detection** - View recognized intents
3. **Entity Extraction** - See extracted player numbers
4. **Confidence Scores** - Check interpretation confidence
5. **Command History** - Review last 10 commands
6. **Mode Toggle** - Switch between Fuzzy and LLM interpretation
7. **Language Selection** - Test English and French

### Controls:

- **Start/Stop Listening** - Big green/red button
- **Language Toggle** - 🇺🇸 EN / 🇫🇷 FR buttons
- **Interpreter Mode** - 🔤 Fuzzy Match / 🤖 LLM
- **Clear History** - Reset command log
- **Back to App** - Return to main application

---

## Testing Workflow

### 1. Basic Test
```
1. Open: http://localhost:5173/?debug=voice
2. Click "Start Listening"
3. Say: "player 12 enters ice"
4. Check interpretation results
```

### 2. Compare Interpreters
```
1. Test command with Fuzzy Match
2. Note the results
3. Toggle to LLM mode
4. Test same command
5. Compare accuracy
```

### 3. Bilingual Test
```
1. Set language to English
2. Test commands
3. Switch to French
4. Test same commands in French
5. Verify both work correctly
```

### 4. Edge Cases
```
Test these scenarios:
- Non-existent player numbers
- Players not on ice
- Unclear speech
- Background noise
- Multiple rapid commands
```

---

## Interpreting Results

### Success Indicators:
- ✅ Green checkmark
- **Intent** clearly identified
- **Entities** correctly extracted
- **Action** describes what will happen
- **Confidence** > 80%

### Failure Indicators:
- ❌ Red X
- Error message shown
- Low confidence score
- No entities extracted
- Intent: null or wrong

---

## Common Debug Scenarios

### "Player not found"
**Cause:** Player number doesn't exist in roster  
**Fix:** Add player to team or use existing number

### Low Confidence
**Cause:** Unclear speech or unusual phrasing  
**Fix:** Speak more clearly or use standard commands

### Wrong Intent
**Cause:** Ambiguous command or missing keywords  
**Fix:** Use more explicit phrasing

### No Recognition
**Cause:** Microphone not working or no speech detected  
**Fix:** Check browser permissions and microphone

---

## Switching Back

To exit debug mode and return to main app:

1. Click **"Back to App"** button (bottom-right)
2. Or manually remove `?debug=voice` from URL
3. Or navigate to `http://localhost:5173/`

---

## Production Deployment

### Security Considerations:

The debug mode is safe to deploy to production because:
- ✅ No sensitive data exposed
- ✅ Only accessible via URL parameter
- ✅ No buttons or links to it
- ✅ Doesn't affect main app functionality
- ✅ API keys already in frontend (Groq free tier)

### Sharing Debug Access:

If you want someone to test voice commands:
```
Share this URL:
https://your-app.vercel.app/?debug=voice
```

They can test without affecting live users!

---

## Advanced: Keyboard Shortcuts

While in debug mode (future enhancement):
- `Space` - Toggle listening
- `L` - Toggle LLM/Fuzzy
- `E` - Switch to English
- `F` - Switch to French
- `C` - Clear history
- `Esc` - Back to app

*(Not yet implemented)*

---

## Troubleshooting Debug Mode

### Can't Access Debug Mode
- Check URL has `?debug=voice`
- Verify dev server is running
- Try hard refresh (Cmd+Shift+R)

### Features Not Working
- Check browser console for errors
- Verify API key is configured
- Test microphone permissions
- Try different browser

### Back Button Not Working
- Manually navigate to `/`
- Refresh the page
- Check browser console

---

## Developer Notes

The debug mode is implemented in:
- `src/AppRouter.jsx` - URL routing logic
- `src/components/VoiceCommandDebug.jsx` - Debug UI

To modify debug mode behavior, edit these files.

---

**Last Updated:** 2025-11-29

