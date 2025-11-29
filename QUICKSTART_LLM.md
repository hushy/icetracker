# 🚀 Quick Start: LLM Voice Commands

## 3-Minute Setup

### 1️⃣ Get Free API Key
Go to: **https://console.groq.com** → Sign up → Create API Key

### 2️⃣ Create `.env` File
In your project root (`/Users/lucas.verdonk/test copy/`), create a file named `.env`:

```bash
VITE_GROQ_API_KEY=gsk_paste_your_key_here
VITE_LLM_PROVIDER=groq
```

### 3️⃣ Restart Server
```bash
npm run dev
```

### 4️⃣ Test!
1. Open `http://localhost:5173/?debug=voice`
2. Toggle to **"🤖 LLM (AI)"** mode
3. Click **"Start Listening"**
4. Say: *"player twelve enters ice"*

## ✅ It's Working When...
- You see "🤖 GROQ" badge
- Latency shows ~200-500ms
- Commands are understood correctly

## ❌ Troubleshooting

**"Groq API key not configured"**
→ Check your `.env` file exists and has the correct key

**Can't find .env file?**
→ It's a hidden file. Create it in: `/Users/lucas.verdonk/test copy/.env`

**Still not working?**
→ Make sure you restarted the dev server after creating `.env`

---

## Example `.env` File Contents

Copy this exactly and replace with your key:

```
VITE_GROQ_API_KEY=gsk_your_actual_groq_key_here
VITE_LLM_PROVIDER=groq
```

**No quotes, no spaces around the `=` sign!**

---

## Test Commands

Try these to see the AI in action:

```
✅ "player 12 enters ice"
✅ "goal for us number seven assisted by twelve and three"
✅ "twenty three blocks the puck"  
✅ "shot by fifteen"
✅ "player eighteen coming off ice"
✅ "goal for them" or "they scored"
✅ "hit by number nine"
✅ "takeaway by seven"
```

The AI handles:
- Natural language variations
- Spelled-out numbers ("twelve" → 12)
- Different phrasings
- Typos and unclear speech

---

## Compare: Fuzzy vs LLM

In the debug UI, toggle between modes to see the difference:

**🔤 Fuzzy Match:**
- Instant, no latency
- Requires exact keywords
- Limited flexibility

**🤖 LLM:**
- ~200-500ms latency
- Understands natural language
- Much more flexible and accurate

---

**Need more help?** See `LLM_SETUP.md` for detailed guide!

