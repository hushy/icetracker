# Hockey TOI + Plus/Minus Tracker 🏒

A mobile-first web application for tracking hockey statistics during games. Perfect for coaches, team managers, or anyone tracking player performance in real-time.

## Features

### Core Tracking
- **Time On Ice (TOI)** - Automatic tracking per player with live updates
- **Plus/Minus** - Track goal differential for each player
- **Game Clock** - Start/Pause/Reset with MM:SS display

### Player Stats
Track comprehensive statistics for each player:
- 🎯 **Shots on Goal**
- 🛡️ **Blocked Shots**
- 💥 **Hits**
- ⚡ **Takeaways**
- ❌ **Giveaways**

### Easy Player Management
- **Quick Add** - Add players with jersey number and name (press Enter ↵)
- **Safe Delete** - Two-click confirmation prevents accidental removal
- **On-Ice Toggle** - Tap anywhere on player tile or use dedicated button
- **Bench All** - Quick action to bench entire lineup

### Game Events
- **Goal Tracking** - Record goals for "Us" or "Them"
- **Auto Plus/Minus** - Automatically applies to all on-ice players
- **Event Log** - Complete game history with timestamps
- **Undo** - Revert the last goal if needed

### Data Management
- **Offline Support** - Works without internet connection
- **Auto-Save** - State persists on page refresh (localStorage)
- **CSV Export** - Download complete stats with all player data

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000

### Build

```bash
npm run build
```

## Usage

### Adding Players
1. Enter jersey number (optional) and player name
2. Press Enter or click "Add (↵)"
3. Player appears in roster

### Tracking During Game
1. Click "Start" to begin game clock
2. Tap players to toggle them on/ice (or use ⛸/🪑 buttons)
3. Record goals with the bottom action buttons:
   - 🥅 **Goal: Us** - Adds +1 to all on-ice players
   - 🚨 **Goal: Them** - Adds -1 to all on-ice players
4. Tap colored stat buttons below each player to track shots, hits, blocks, etc.

### Quick Stats Tracking
- Tap any stat button to increment it instantly
- Color-coded buttons for easy identification:
  - 🎯 Blue = Shots
  - 🛡️ Purple = Blocks
  - 💥 Orange = Hits
  - ⚡ Green = Takeaways
  - ❌ Red = Giveaways
- Current count shown on each button
- No panels to open - just tap and go!

### Removing Players
- Click ✕ button once - turns red showing "Confirm?"
- Click again within 3 seconds to confirm deletion
- Automatically resets if you don't confirm

### Exporting Data
- Click "Export CSV" in the header
- Downloads file: `hockey_YYYY-MM-DD.csv`
- Includes all stats: Team, Number, Name, ±, TOI, Shots, Blocks, Hits, Takeaways, Giveaways

## Features Detail

### On-Ice Cap
- Default: 6 players (adjustable 1-6)
- Live counter shows current on-ice count
- Warning indicator when over cap
- Prevents confusion during line changes

### Smart TOI Tracking
- Automatically starts when clock starts
- Accrues when clock pauses
- Continues correctly when resuming
- Shows live time while clock is running

### Mobile-First Design
- Large tap targets (minimum 44x44px)
- High contrast colors
- Works on any screen size
- Touch-optimized interactions
- Fast (<100ms response time)

## Tech Stack

- **React 18** - UI framework
- **Vite 6** - Build tool
- **Tailwind CSS 3** - Styling
- **localStorage** - Data persistence

## Browser Support

Works on all modern browsers:
- Chrome/Edge (desktop & mobile)
- Safari (desktop & mobile)
- Firefox (desktop & mobile)

## Data Storage

All data is stored locally in your browser using `localStorage`:
- **Key**: `hockey-pm-tracker-v3`
- **Persists**: Until you clear browser data or click "Reset"
- **Privacy**: Never leaves your device

## Tips

- **Quick Line Changes**: Use "Bench all" then tap players for next line
- **Fix Mistakes**: Use "Undo" for the last goal, or adjust stats manually
- **Jersey Numbers**: Optional but helps with sorting
- **Export Often**: Save CSV files after each period
- **Mobile Use**: Add to home screen for full-screen experience

## Future Enhancements (Not in POC)

- PWA support (offline install)
- Opponent team tracking
- Line management presets
- Per-player goals and assists
- Penalty tracking
- JSON import/export for rosters

## License

MIT

## Support

For issues or feature requests, please open an issue in the repository.

