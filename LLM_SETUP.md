# LLM Voice Command Setup 🤖

## Quick Setup (5 minutes)

### Step 1: Get Your Free Groq API Key

1. Go to **https://console.groq.com**
2. Sign up (free, no credit card required)
3. Click **"API Keys"** in the left menu
4. Click **"Create API Key"**
5. Copy your API key (starts with `gsk_...`)

### Step 2: Configure Your App

Create a `.env` file in your project root:

```bash
# In: /Users/lucas.verdonk/test copy/.env
VITE_GROQ_API_KEY=gsk_your_api_key_here
VITE_LLM_PROVIDER=groq
```

**Important:** Replace `gsk_your_actual_key_here` with your actual Groq API key!

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test It!

1. Open **http://localhost:5173/?debug=voice**
2. Toggle to **"🤖 LLM (AI)"** mode
3. Click "Start Listening"
4. Say: "player 12 enters ice"
5. See the AI interpretation! ✨

---

## Why Groq?

| Feature | Groq | OpenAI | Anthropic |
|---------|------|--------|-----------|
| **Cost** | 🟢 FREE | 🟡 $0.15/1M tokens | 🟡 $3/1M tokens |
| **Speed** | 🟢 ~200-500ms | 🟡 ~1-2s | 🟡 ~1-2s |
| **Setup** | 🟢 No CC required | 🔴 CC required | 🔴 CC required |
| **Free Tier** | 🟢 14,400 req/day | 🔴 $5 credit | 🟡 Limited |
| **Quality** | 🟢 Excellent | 🟢 Excellent | 🟢 Excellent |

**Groq is perfect for this use case:**
- Super fast (~200-500ms vs ~2s for others)
- Completely free (no credit card)
- Uses Llama 3.3 70B (very accurate)
- 14,400 requests/day = ~10 requests/min all day

---

## Alternative: OpenAI (If You Prefer)

### Setup with OpenAI

1. Get API key from: **https://platform.openai.com/api-keys**
2. Update your `.env`:

```bash
VITE_OPENAI_API_KEY=sk-your_key_here
VITE_LLM_PROVIDER=openai
```

3. Restart server

**Cost:** ~$0.15 per 1 million input tokens (very cheap, but needs credit card)

---

## Troubleshooting

### "Groq API key not configured"
- Check your `.env` file exists in project root
- Verify the API key starts with `gsk_`
- Make sure you restarted the dev server after creating `.env`

### "API error: 401"
- Your API key is invalid or expired
- Create a new key at https://console.groq.com

### "API error: 429"
- You hit the rate limit (unlikely - 14,400/day)
- Wait a minute or create a new API key

### Slow responses
- Groq should be ~200-500ms
- If slower, check your internet connection
- OpenAI is typically ~1-2 seconds (normal)

### "Failed to fetch"
- Check your internet connection
- Verify the API key is correct
- Try toggling back to Fuzzy Match mode to test

---

## Comparing Fuzzy vs LLM

### Fuzzy Match (🔤)
- ✅ Instant (no latency)
- ✅ Works offline
- ✅ No API needed
- ❌ Limited understanding
- ❌ Requires exact phrasing

### LLM Mode (🤖)
- ✅ Understands natural language
- ✅ Handles variations & typos
- ✅ More accurate
- ✅ Contextual understanding
- ❌ ~200-500ms latency
- ❌ Requires API key
- ❌ Needs internet

---

## Advanced: Switching Models

### Groq Models (edit `llmInterpreter.js`)

```javascript
// Current: Fast and accurate
model: 'llama-3.3-70b-versatile'

// Alternatives:
model: 'llama-3.1-70b-versatile'  // Slightly older
model: 'mixtral-8x7b-32768'        // Faster, less accurate
```

### OpenAI Models

```javascript
model: 'gpt-4o-mini'      // Current: Cheap & good
model: 'gpt-4o'           // More accurate, more expensive
model: 'gpt-3.5-turbo'    // Cheaper, less accurate
```

---

## API Usage & Costs

### Groq (Free Tier)
- **Rate Limits:** 30 requests/minute, 14,400/day
- **Token Limits:** 6,000 tokens/minute
- **Cost:** FREE ✨

For a hockey game (~2 hours):
- ~100-200 voice commands
- Well within free limits
- No cost!

### OpenAI (if you use it)
- **gpt-4o-mini:** $0.15/1M input tokens
- **Average command:** ~200 tokens
- **Cost per command:** ~$0.00003 (basically free)
- **100 commands in a game:** ~$0.003 (less than a penny)

---

## Security Notes

⚠️ **IMPORTANT:** 
- Never commit your `.env` file to git
- The `.env` file is already in `.gitignore`
- Don't share your API keys publicly
- API keys in frontend code are visible to users (this is OK for rate-limited free APIs like Groq)

For production apps with paid APIs, you'd want a backend server to hide the keys. But for Groq's free tier, it's fine to use in the frontend.

---

## Next Steps

Once LLM is working:
1. Test various commands and natural language
2. Compare accuracy vs fuzzy matching
3. Integrate into your main app (not just debug UI)
4. Add confirmation UI for low-confidence commands
5. Consider voice feedback (text-to-speech responses)

🎉 **Enjoy your AI-powered voice commands!**

