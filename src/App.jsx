import React, { useEffect, useRef, useState, createContext, useContext } from "react";

/**
 * HOCKEY TOI + PLUS/MINUS TRACKER — Single-team POC
 * Mobile-first React + Tailwind, offline (localStorage).
 * - One team, on-ice tracking (tap tile to toggle)
 * - Chrono with Start/Pause/Reset
 * - Per-player TOI accumulation
 * - Goal: Us/Them (+/- to all on-ice)
 * - Event log + Undo
 * - Export CSV
 */

// ---------- i18n (Internationalization) ----------
const translations = {
  en: {
    // Common
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    remove: "Remove",
    reset: "Reset",
    back: "Back",
    close: "Close",
    yes: "Yes",
    no: "No",
    
    // App
    appTitle: "Hockey Tracker",
    version: "v",
    
    // Team Management
    teams: "Teams",
    createTeam: "Create New Team",
    editTeam: "Edit Team",
    teamName: "Team Name",
    teamNamePlaceholder: "e.g., Mighty Ducks",
    onIceCap: "On-Ice Cap",
    players: "Players",
    addPlayer: "Add Player",
    playerNumber: "Number",
    playerName: "Name",
    isGoalie: "Goalie",
    selectTeam: "Select a team",
    noTeamsYet: "No teams yet. Create one to get started!",
    
    // Match Management
    matches: "Matches",
    createMatch: "Create New Match",
    matchName: "Match Name",
    matchNamePlaceholder: "e.g., vs Rangers, Home Game, Practice, etc.",
    ourTeam: "Our Team",
    opponent: "Opponent",
    teamNames: "Team Names",
    opponentTeamName: "Opponent team name",
    selectMatch: "Select a match or create a new one",
    
    // Navigation
    iceManager: "Ice Manager",
    myPlayers: "My Players",
    allStats: "All Stats",
    penalties: "Penalties",
    
    // Clock
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    period: "Period (min)",
    newPeriod: "New Period",
    
    // Players
    noPlayers: "No players selected. Tap players below to add them.",
    tapToAdd: "Tap players below to add them",
    tapToToggle: "Tap players below to put them on ice",
    playerOnIce: "Player must be on ice to track stats",
    selectPlayersToTrack: "Select players you want to track stats for during the match",
    
    // Goals
    goal: "Goal",
    goalUs: "Goal",
    goalThem: "Goal",
    scorerNumber: "Scorer Number",
    assist1: "Assist 1 (optional)",
    assist2: "Assist 2 (optional)",
    saveGoal: "Save Goal",
    availableNumbers: "Available numbers:",
    
    // Stats
    shots: "Shots",
    shot: "Shot",
    zoneEntries: "Zone Entries",
    zoneEntry: "Zone Entry",
    blockedShots: "Blocks",
    block: "Block",
    hits: "Hits",
    hit: "Hit",
    takeaways: "Takeaways",
    takeaway: "Takeaway",
    giveaways: "Giveaways",
    giveaway: "Giveaway",
    plusMinus: "Plus/Minus",
    toi: "TOI",
    saves: "Saves",
    saveGoalie: "Save",
    goalAgainst: "Goal Against",
    goalsAgainst: "Goals Against",
    shutouts: "Shutouts",
    shutout: "Shutout",
    leaderboard: "Leaderboard",
    putOnIce: "Put on ice",
    benched: "Benched",
    
    // Penalties
    addPenalty: "Add Penalty",
    penaltyType: "Penalty Type",
    infraction: "Infraction",
    minor: "Minor",
    doubleMicreateor: "Double Minor",
    major: "Major",
    misconduct: "Misconduct",
    matchPenalty: "Match Penalty",
    activePenalties: "Active Penalties",
    noPenalties: "No active penalties",
    gameSituation: "Game Situation",
    coincident: "Coincident",
    earlyRelease: "Goal",
    
    // Infractions
    tripping: "Tripping",
    hooking: "Hooking",
    slashing: "Slashing",
    highSticking: "High-sticking",
    interference: "Interference",
    holding: "Holding",
    crossChecking: "Cross-checking",
    boarding: "Boarding",
    charging: "Charging",
    roughing: "Roughing",
    elbowing: "Elbowing",
    fighting: "Fighting",
    delayOfGame: "Delay of game",
    tooManyPlayers: "Too many players",
    unsportsmanlike: "Unsportsmanlike conduct",
    other: "Other",
    
    // Events
    eventLog: "Event log",
    noEvents: "No events yet.",
    onIcePlayers: "On-ice players",
    
    // Actions
    undo: "Undo",
    export: "Export",
    endMatch: "End Match",
    exportCSV: "Export CSV",
    
    // Messages
    overCap: "Over the on-ice cap — adjust before recording.",
    confirmEndMatch: "End match and return to match selection?",
    enterMatchName: "Please enter a match name",
    enterScorerNumber: "Please enter the scorer's number",
    enterPlayerNumber: "Please enter player number",
    oneGoalieOnly: "Only one goalie can be on ice at a time. Please bench the current goalie first.",
    onIce: "On ice",
    onBench: "On bench",
    tapToBench: "Tap circle to bench",
    tapToPutOnIce: "Tap circle to put on ice",
    statsGuide: "Stats Guide",
    hideStatsGuide: "Hide Stats Guide",
    quickStats: "Quick Stats (tap to add)",
    score: "Score",
    roster: "Roster",
    onIceCount: "On-ice",
    overCapShort: "Over cap!",
    overCapMessage: "Over cap — bench someone before recording a goal.",
    current: "Current",
    clearIce: "Clear Ice",
    bench: "Bench",
    allPlayersOnIce: "All players are on ice",
    add: "Add",
    matchReplay: "Match Replay",
    penaltyBox: "Penalty Box",
    selectPlayersToView: "Select one or more players to view their on-ice periods and actions",
    selectPlayersAbove: "Select players above to view their timeline",
    noActionsRecorded: "No actions recorded during this period",
  },
  fr: {
    // Common
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    remove: "Retirer",
    reset: "Réinitialiser",
    back: "Retour",
    close: "Fermer",
    yes: "Oui",
    no: "Non",
    
    // App
    appTitle: "Hockey Tracker",
    version: "v",
    
    // Team Management
    teams: "Équipes",
    createTeam: "Créer une Équipe",
    editTeam: "Modifier l'Équipe",
    teamName: "Nom de l'Équipe",
    teamNamePlaceholder: "ex: Les Aigles",
    onIceCap: "Limite sur Glace",
    players: "Joueurs",
    addPlayer: "Ajouter un Joueur",
    playerNumber: "Numéro",
    playerName: "Nom",
    isGoalie: "Gardien",
    selectTeam: "Sélectionner une équipe",
    noTeamsYet: "Aucune équipe. Créez-en une pour commencer !",
    
    // Match Management
    matches: "Matchs",
    createMatch: "Créer un Match",
    matchName: "Nom du Match",
    matchNamePlaceholder: "ex: vs Rangers, Match Domicile, Entraînement, etc.",
    ourTeam: "Notre Équipe",
    opponent: "Adversaire",
    teamNames: "Noms des Équipes",
    opponentTeamName: "Nom de l'équipe adverse",
    selectMatch: "Sélectionnez un match ou créez-en un",
    
    // Navigation
    iceManager: "Gestion Glace",
    myPlayers: "Mes Joueurs",
    allStats: "Toutes Stats",
    penalties: "Pénalités",
    
    // Clock
    start: "Démarrer",
    pause: "Pause",
    resume: "Reprendre",
    period: "Période (min)",
    newPeriod: "Nouvelle Période",
    
    // Players
    noPlayers: "Aucun joueur sélectionné. Appuyez sur les joueurs ci-dessous pour les ajouter.",
    tapToAdd: "Appuyez sur les joueurs ci-dessous pour les ajouter",
    tapToToggle: "Appuyez sur les joueurs ci-dessous pour les mettre sur la glace",
    playerOnIce: "Le joueur doit être sur la glace pour suivre les stats",
    selectPlayersToTrack: "Sélectionnez les joueurs dont vous voulez suivre les stats pendant le match",
    
    // Goals
    goal: "But",
    goalUs: "But",
    goalThem: "But",
    scorerNumber: "Numéro Buteur",
    assist1: "Passe 1 (optionnel)",
    assist2: "Passe 2 (optionnel)",
    saveGoal: "Enregistrer But",
    availableNumbers: "Numéros disponibles :",
    
    // Stats
    shots: "Tirs",
    shot: "Tir",
    zoneEntries: "Entrées Zone",
    zoneEntry: "Entrée Zone",
    blockedShots: "Tirs Bloqués",
    block: "Tir Bloqué",
    hits: "Mises en Échec",
    hit: "Mise en Échec",
    takeaways: "Récupérations",
    takeaway: "Récupération",
    giveaways: "Revirements",
    giveaway: "Revirement",
    plusMinus: "Plus/Minus",
    toi: "TGI",
    saves: "Arrêts",
    saveGoalie: "Arrêt",
    goalAgainst: "But Contre",
    goalsAgainst: "Buts Contre",
    shutouts: "Blanchissages",
    shutout: "Blanchissage",
    leaderboard: "Classement",
    putOnIce: "Mis sur glace",
    benched: "Mis au banc",
    
    // Penalties
    addPenalty: "Ajouter Pénalité",
    penaltyType: "Type de Pénalité",
    infraction: "Infraction",
    minor: "Mineure",
    doubleMinor: "Double Mineure",
    major: "Majeure",
    misconduct: "Inconduite",
    matchPenalty: "Pénalité de Match",
    activePenalties: "Pénalités Actives",
    noPenalties: "Aucune pénalité active",
    gameSituation: "Situation de Jeu",
    coincident: "Coïncidente",
    earlyRelease: "But",
    
    // Infractions
    tripping: "Faire trébucher",
    hooking: "Accrocher",
    slashing: "Cingler",
    highSticking: "Bâton élevé",
    interference: "Obstruction",
    holding: "Retenir",
    crossChecking: "Double-échec",
    boarding: "Rudesse contre la bande",
    charging: "Charge",
    roughing: "Rudesse",
    elbowing: "Coup de coude",
    fighting: "Bagarre",
    delayOfGame: "Retarder le jeu",
    tooManyPlayers: "Trop de joueurs",
    unsportsmanlike: "Conduite antisportive",
    other: "Autre",
    
    // Events
    eventLog: "Journal d'événements",
    noEvents: "Aucun événement.",
    onIcePlayers: "Joueurs sur glace",
    
    // Actions
    undo: "Annuler",
    export: "Exporter",
    endMatch: "Terminer Match",
    exportCSV: "Exporter CSV",
    
    // Messages
    overCap: "Dépassement de la limite — ajustez avant d'enregistrer.",
    confirmEndMatch: "Terminer le match et retourner à la sélection ?",
    enterMatchName: "Veuillez entrer un nom de match",
    enterScorerNumber: "Veuillez entrer le numéro du buteur",
    enterPlayerNumber: "Veuillez entrer le numéro du joueur",
    oneGoalieOnly: "Un seul gardien peut être sur la glace. Veuillez d'abord retirer le gardien actuel.",
    onIce: "Sur glace",
    onBench: "Au banc",
    tapToBench: "Appuyez pour mettre au banc",
    tapToPutOnIce: "Appuyez pour mettre sur glace",
    statsGuide: "Guide Stats",
    hideStatsGuide: "Masquer Guide",
    quickStats: "Stats rapides (appuyez pour ajouter)",
    score: "Score",
    roster: "Alignement",
    onIceCount: "Sur glace",
    overCapShort: "Dépassement!",
    overCapMessage: "Dépassement — retirez quelqu'un avant d'enregistrer un but.",
    current: "Actuel",
    clearIce: "Vider la glace",
    bench: "Banc",
    allPlayersOnIce: "Tous les joueurs sont sur la glace",
    add: "Ajouter",
    matchReplay: "Relecture Match",
    penaltyBox: "Prison",
    selectPlayersToView: "Sélectionnez un ou plusieurs joueurs pour voir leurs périodes sur glace et actions",
    selectPlayersAbove: "Sélectionnez les joueurs ci-dessus pour voir leur chronologie",
    noActionsRecorded: "Aucune action enregistrée pendant cette période",
  }
};

const LanguageContext = createContext();

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("hockey-language") || "en";
  });

  const t = (key) => {
    return translations[language][key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("hockey-language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ---------- Utilities ----------
const STORAGE_KEY = "hockey-pm-tracker-v4";
const APP_VERSION = "4.0.0"; // Multi-team/match workflow

const mkId = () => Math.random().toString(36).slice(2, 9);

function nowHHMMSS() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function download(filename, text) {
  const a = document.createElement("a");
  a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  a.setAttribute("download", filename);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}

function mmss(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function mmssCountdown(totalSeconds) {
  // For countdown, use Math.ceil to round up so any fractional seconds show as the next second
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function getEventTimestamps(clock) {
  const elapsedMs =
    clock.running && clock.lastStartedAt
      ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
      : clock.elapsedMs;
  
  const remainingMs = clock.countdownDurationMs
    ? Math.max(0, clock.countdownDurationMs - elapsedMs)
    : null;
  
  return {
    elapsedTime: mmss(elapsedMs / 1000),
    remainingTime: remainingMs !== null ? mmssCountdown(remainingMs / 1000) : null,
  };
}

const initialsOf = (n) =>
  (n || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

// ---------- Types (informal) ----------
// Player = { id, number, name, initials, onIce, plusMinus, toiSeconds, enteredAt|null, 
//            shots, blockedShots, hits, takeaways, giveaways, breakaways,
//            isGoalie, saves, goalsAgainst, shutouts }
// Team   = { id, name, onIceCap, players: Player[] }
// Match  = { id, name, teamId, startedAt, clock, events, myPlayerIds, players (snapshot) }
// Clock  = { running, elapsedMs, lastStartedAt|null, countdownDurationMs|null }
// Event  = { id, time, elapsedTime, remainingTime, type:'GOAL'|'STAT_CHANGE'|'ON_ICE_CHANGE', 
//            scorer?:'US'|'THEM', ourOnIceIds?: string[],
//            playerId?: string, stat?: string, value?: number, delta?: number, onIce?: boolean }

const defaultState = {
  teams: [], // Array of teams
  matches: [], // Array of matches
  currentTeamId: null,
  currentMatchId: null,
  appPhase: "team-selection", // "team-selection", "match-selection", "match"
};

function usePersistentState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      
      const parsed = JSON.parse(raw);
      
      // Migration: Ensure arrays are always arrays and goalie fields are initialized
      if (parsed.teams && Array.isArray(parsed.teams)) {
        parsed.teams = parsed.teams.map(team => ({
          ...team,
          players: Array.isArray(team.players) ? team.players.map(p => ({
            ...p,
            isGoalie: p.isGoalie || false,
            saves: p.saves || 0,
            goalsAgainst: p.goalsAgainst || 0,
            shutouts: p.shutouts || 0,
          })) : []
        }));
      }
      
      if (parsed.matches && Array.isArray(parsed.matches)) {
        parsed.matches = parsed.matches.map(match => ({
          ...match,
          players: Array.isArray(match.players) ? match.players.map(p => ({
            ...p,
            isGoalie: p.isGoalie || false,
            saves: p.saves || 0,
            goalsAgainst: p.goalsAgainst || 0,
            shutouts: p.shutouts || 0,
          })) : [],
          events: Array.isArray(match.events) ? match.events : [],
          myPlayerIds: Array.isArray(match.myPlayerIds) ? match.myPlayerIds : []
        }));
      }
      
      // Ensure top-level arrays exist
      if (!Array.isArray(parsed.teams)) parsed.teams = [];
      if (!Array.isArray(parsed.matches)) parsed.matches = [];
      
      return parsed;
    } catch {
      return defaultState;
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  const reset = () => setState(defaultState);
  return [state, setState, reset];
}

// ---------- Chrono Component ----------
function Chrono({ clock, onStartClock, onPauseClock, onResetClock, onSetCountdown, onNewPeriod }) {
  const { t } = useLanguage();
  const [, force] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(
    clock.countdownDurationMs ? Math.round(clock.countdownDurationMs / 60000) : ""
  );
  const clockRef = useRef(clock);
  const isEditingRef = useRef(false);

  // Keep clockRef updated with latest clock values
  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  useEffect(() => {
    if (!clock.running) return;
    let tickCount = 0;
    const id = setInterval(() => {
      tickCount++;
      // Update display every second (every 10 ticks at 100ms)
      if (tickCount % 10 === 0) {
        force((x) => x + 1);
      }
      // Check if countdown has reached zero and pause if so (check every 100ms for accuracy)
      const currentClock = clockRef.current;
      if (currentClock.countdownDurationMs) {
        const now = Date.now();
        const currentElapsed = currentClock.elapsedMs + (now - (currentClock.lastStartedAt || now));
        const remainingMs = Math.max(0, currentClock.countdownDurationMs - currentElapsed);
        if (remainingMs <= 0) {
          onPauseClock();
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [clock.running, onPauseClock]);

  useEffect(() => {
    // Only update countdownMinutes from clock if user isn't actively editing
    // This prevents resetting the input while the user is typing
    if (!isEditingRef.current) {
      if (clock.countdownDurationMs) {
        setCountdownMinutes(Math.round(clock.countdownDurationMs / 60000).toString());
      } else if (countdownMinutes === "") {
        setCountdownMinutes("");
      }
    }
  }, [clock.countdownDurationMs]);

  const elapsedMs =
    clock.running && clock.lastStartedAt
      ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
      : clock.elapsedMs;

  // Calculate remaining time - use clock.countdownDurationMs if set, otherwise calculate from countdownMinutes
  const countdownDurationMs = clock.countdownDurationMs || 
    (countdownMinutes ? parseInt(countdownMinutes) * 60000 : null);
  const remainingMs = countdownDurationMs
    ? Math.max(0, countdownDurationMs - elapsedMs)
    : null;

  // Check if countdown is actually set (not just being typed)
  // Only consider it a countdown if clock.countdownDurationMs is set, not just if there's input
  const isCountdown = clock.countdownDurationMs !== null && clock.countdownDurationMs > 0;

  function start() {
    if (clock.running) return;
    // Save countdown duration before starting only if there's a value in the input
    const minutesStr = String(countdownMinutes || "").trim();
    if (minutesStr !== "") {
      handleSetCountdown();
    }
    onStartClock();
  }

  function pause() {
    if (!clock.running) return;
    onPauseClock();
  }

  function reset() {
    onResetClock();
  }

  function handleSetCountdown() {
    const minutes = parseInt(countdownMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      onSetCountdown(null);
      setCountdownMinutes("");
    } else {
      onSetCountdown(minutes * 60000);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Countdown input - shown when not running and no countdown set */}
      {!clock.running && !isCountdown && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder={t("period")}
            value={countdownMinutes}
            onChange={(e) => {
              isEditingRef.current = true;
              setCountdownMinutes(e.target.value);
            }}
            onFocus={() => {
              isEditingRef.current = true;
            }}
            onBlur={(e) => {
              isEditingRef.current = false;
              handleSetCountdown();
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                isEditingRef.current = false;
                handleSetCountdown();
                e.target.blur();
              }
            }}
            className="w-28 px-3 py-2 rounded-xl border text-sm"
          />
          <button onClick={start} className="px-4 py-2 rounded-xl bg-black text-white font-medium">
            {t("start")}
          </button>
        </div>
      )}

      {/* Time displays - shown when countdown is set or when running/paused */}
      {(isCountdown || clock.running || clock.elapsedMs > 0) && (
        <>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-mono tabular-nums px-3 py-2 rounded-xl border bg-white">
              {mmss(elapsedMs / 1000)}
            </div>
            {(isCountdown || (countdownMinutes && !isEditingRef.current)) && (
              <>
                <span className="text-gray-400">/</span>
                <div className={`text-2xl font-mono tabular-nums px-3 py-2 rounded-xl border ${
                  remainingMs !== null && remainingMs === 0 ? "bg-red-100 border-red-300 text-red-700" : 
                  remainingMs !== null && remainingMs < 60000 ? "bg-yellow-100 border-yellow-300 text-yellow-700" : 
                  "bg-white"
                }`}>
                  {remainingMs !== null ? mmssCountdown(remainingMs / 1000) : (countdownDurationMs ? mmssCountdown(countdownDurationMs / 1000) : "00:00")}
                </div>
              </>
            )}
          </div>
          {clock.running ? (
            <button onClick={pause} className="px-4 py-2 rounded-xl border font-medium hover:bg-gray-50">
              {t("pause")}
            </button>
          ) : (
            <button onClick={start} className="px-4 py-2 rounded-xl bg-black text-white font-medium">
              {clock.elapsedMs > 0 ? t("resume") : t("start")}
            </button>
          )}
          {isCountdown && clock.elapsedMs > 0 && onNewPeriod && (
            <button onClick={onNewPeriod} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
              {t("newPeriod")}
            </button>
          )}
          <button onClick={reset} className="px-4 py-2 rounded-xl border font-medium hover:bg-gray-50">
            {t("reset")}
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Team Selection Screen ----------
function TeamSelectionScreen({ teams, onSelectTeam, onCreateTeam }) {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">🏒 {t("appTitle")}</h1>
          <LanguageSelector />
        </div>
        <p className="text-gray-600">{t("selectTeam")}</p>
        <p className="text-xs text-gray-400 mt-2">{t("version")}{APP_VERSION}</p>
      </div>

      {teams.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{t("teams")}</h2>
          <div className="space-y-2">
            {teams.map((team) => {
              const playerCount = Array.isArray(team.players) ? team.players.length : 0;
              return (
                <button
                  key={team.id}
                  onClick={() => onSelectTeam(team.id)}
                  className="w-full p-4 rounded-xl border-2 hover:border-blue-500 bg-white text-left transition-colors"
                >
                  <div className="font-semibold text-lg">{team.name}</div>
                  <div className="text-sm text-gray-600">
                    {playerCount} {t("players").toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 mb-6">{t("noTeamsYet")}</p>
      )}

      <button
        onClick={onCreateTeam}
        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold transition-colors"
      >
        ➕ {t("createTeam")}
      </button>
    </div>
  );
}

// ---------- Team Create/Edit Screen ----------
function TeamCreateScreen({ team, onSave, onCancel }) {
  const { t } = useLanguage();
  const [teamName, setTeamName] = useState(team?.name || "");
  const [players, setPlayers] = useState(team?.players || []);
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [isGoalie, setIsGoalie] = useState(false);
  const numInputRef = useRef(null);

  function addPlayer() {
    if (!name.trim()) return;
    const player = {
      id: mkId(),
      number: num.trim(),
      name: name.trim(),
      initials: initialsOf(name.trim()),
      onIce: false,
      plusMinus: 0,
      toiSeconds: 0,
      enteredAt: null,
      shots: 0,
      blockedShots: 0,
      hits: 0,
      takeaways: 0,
      giveaways: 0,
      breakaways: 0,
      isGoalie: isGoalie,
      saves: 0,
      goalsAgainst: 0,
      shutouts: 0,
    };
    setPlayers([...players, player]);
    setNum("");
    setName("");
    setIsGoalie(false);
    setTimeout(() => numInputRef.current?.focus(), 0);
  }

  function removePlayer(id) {
    setPlayers(players.filter((p) => p.id !== id));
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      addPlayer();
    }
  }

  function handleSave() {
    if (!teamName.trim()) {
      alert(t("enterMatchName"));
      return;
    }
    if (players.length === 0) {
      alert(t("noPlayers"));
      return;
    }
    onSave({
      id: team?.id || mkId(),
      name: teamName.trim(),
      onIceCap: 6,
      players: players,
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">🏒 {team ? t("editTeam") : t("createTeam")}</h1>
          <LanguageSelector />
        </div>
        <p className="text-xs text-gray-400 mt-2">{t("version")}{APP_VERSION}</p>
      </div>

      {/* Team Name */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t("teamName")} *</label>
        <input
          type="text"
          placeholder={t("teamNamePlaceholder")}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3 text-lg"
        />
      </div>

      {/* Add Players */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t("addPlayer")}</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            ref={numInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="#"
            value={num}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setNum(value);
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-20 rounded-lg border px-3 py-2 text-center font-mono text-lg"
          />
          <input
            type="text"
            placeholder={t("playerName") + " *"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button onClick={addPlayer} className="px-4 py-2 rounded-lg bg-black text-white font-medium">
            {t("addPlayer")}
          </button>
        </div>
        
        {/* Goalie checkbox */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="isGoalie"
            checked={isGoalie}
            onChange={(e) => setIsGoalie(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isGoalie" className="text-sm font-medium text-gray-700 cursor-pointer">
            🥅 {t("isGoalie")}
          </label>
        </div>

        {/* Player List */}
        {players.length > 0 && (
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {p.number && (
                    <div className={`w-10 h-10 rounded-full ${p.isGoalie ? 'bg-yellow-600' : 'bg-blue-600'} text-white flex items-center justify-center font-bold`}>
                      {p.number}
                    </div>
                  )}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {p.name}
                      {p.isGoalie && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">🥅 {t("isGoalie")}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <strong>{players.length}</strong> {t("players").toLowerCase()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 text-gray-700 text-lg font-bold transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={!teamName.trim() || players.length === 0}
          className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold transition-colors"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}

// ---------- Match Selection Screen ----------
function MatchSelectionScreen({ matches, team, onSelectMatch, onCreateMatch, onBack }) {
  const { t } = useLanguage();
  const teamMatches = matches.filter((m) => m.teamId === team.id);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <button onClick={onBack} className="text-blue-600 hover:text-blue-700">
            ← {t("back")}
          </button>
          <LanguageSelector />
        </div>
        <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
        <p className="text-gray-600">{t("selectMatch")}</p>
        <p className="text-xs text-gray-400 mt-2">{t("version")}{APP_VERSION}</p>
      </div>

      {teamMatches.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{t("matches")}</h2>
          <div className="space-y-2">
            {teamMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className="w-full p-4 rounded-xl border-2 hover:border-green-500 bg-white text-left transition-colors"
              >
                <div className="font-semibold text-lg">{match.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(match.startedAt).toLocaleDateString()} • {mmss(Math.floor(match.clock.elapsedMs / 1000))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onCreateMatch}
        className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-lg font-bold transition-colors"
      >
        ➕ {t("createMatch")}
      </button>
    </div>
  );
}

// ---------- Match Create Screen ----------
function MatchCreateScreen({ team, onSave, onCancel }) {
  const { t } = useLanguage();
  const [matchName, setMatchName] = useState("");
  const [ourTeamName, setOurTeamName] = useState(team.name || "Us");
  const [opponentTeamName, setOpponentTeamName] = useState("Them");

  function handleSave() {
    if (!matchName.trim()) {
      alert(t("enterMatchName"));
      return;
    }
    onSave(matchName.trim(), ourTeamName.trim() || "Us", opponentTeamName.trim() || "Them");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <button onClick={onCancel} className="text-blue-600 hover:text-blue-700">
            ← {t("back")}
          </button>
          <LanguageSelector />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t("createMatch")}</h1>
        <p className="text-gray-600">{team.name}</p>
        <p className="text-xs text-gray-400 mt-2">{t("version")}{APP_VERSION}</p>
      </div>

      <div className="bg-white rounded-2xl border p-6 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t("matchName")} *</label>
        <input
          type="text"
          placeholder={t("matchNamePlaceholder")}
          value={matchName}
          onChange={(e) => setMatchName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSave()}
          className="w-full rounded-lg border px-4 py-3 text-lg"
          autoFocus
        />
      </div>

      <div className="bg-white rounded-2xl border p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-4">{t("teamNames")}</label>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t("ourTeam")}</label>
            <input
              type="text"
              placeholder={t("ourTeam")}
              value={ourTeamName}
              onChange={(e) => setOurTeamName(e.target.value)}
              className="w-full rounded-lg border px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t("opponent")}</label>
            <input
              type="text"
              placeholder={t("opponentTeamName")}
              value={opponentTeamName}
              onChange={(e) => setOpponentTeamName(e.target.value)}
              className="w-full rounded-lg border px-4 py-2"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 text-gray-700 text-lg font-bold transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={!matchName.trim()}
          className="flex-1 py-4 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold transition-colors"
        >
          {t("start")}
        </button>
      </div>
    </div>
  );
}

// ---------- OLD Team Setup Screen (TO BE REMOVED) ----------
function TeamSetupScreen({ team, updateTeam, onStartMatch }) {
  const [teamName, setTeamName] = useState(team.name || "");
  const [matchName, setMatchName] = useState("");
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const numInputRef = useRef(null);

  function addPlayer() {
    if (!name.trim()) return;
    const player = {
      id: mkId(),
      number: num.trim(),
      name: name.trim(),
      initials: initialsOf(name.trim()),
      onIce: false,
      plusMinus: 0,
      toiSeconds: 0,
      enteredAt: null,
      shots: 0,
      blockedShots: 0,
      hits: 0,
      takeaways: 0,
      giveaways: 0,
      breakaways: 0,
    };
    updateTeam({ ...team, name: teamName, players: [...team.players, player] });
    setNum("");
    setName("");
    // Focus back on number input for quick entry
    setTimeout(() => numInputRef.current?.focus(), 0);
  }

  function removePlayer(id) {
    updateTeam({ ...team, players: team.players.filter((p) => p.id !== id) });
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      addPlayer();
    }
  }

  function handleStartMatch() {
    if (!teamName.trim()) {
      alert("Please enter a team name");
      return;
    }
    if (!matchName.trim()) {
      alert("Please enter a match name");
      return;
    }
    if (team.players.length === 0) {
      alert("Please add at least one player");
      return;
    }
    updateTeam({ ...team, name: teamName });
    onStartMatch(matchName.trim());
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏒 Setup Your Team</h1>
        <p className="text-gray-600">Create your team roster before starting the match</p>
      </div>

      {/* Team Name */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name *</label>
        <input
          type="text"
          placeholder="e.g., Mighty Ducks, Lightning, etc."
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3 text-lg mb-4"
        />
        
        <label className="block text-sm font-semibold text-gray-700 mb-2">Match Name *</label>
        <input
          type="text"
          placeholder="e.g., vs Rangers, Home Game, Practice, etc."
          value={matchName}
          onChange={(e) => setMatchName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3 text-lg"
        />
      </div>

      {/* Add Players */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add Players</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            ref={numInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="#"
            value={num}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setNum(value);
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-20 rounded-lg border px-3 py-2 text-center font-mono text-lg"
          />
          <input
            type="text"
            placeholder="Player name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button onClick={addPlayer} className="px-4 py-2 rounded-lg bg-black text-white font-medium">
            {t("add")}
          </button>
        </div>

        {/* Player List */}
        {team.players.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
            No players added yet
          </div>
        ) : (
          <div className="space-y-2">
            {team.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                    {p.number || "?"}
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">#{p.number || "—"}</div>
                  </div>
                </div>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <strong>{team.players.length}</strong> player{team.players.length !== 1 ? 's' : ''} added
        </div>
      </div>

      {/* Start Match Button */}
      <button
        onClick={handleStartMatch}
        disabled={!teamName.trim() || !matchName.trim() || team.players.length === 0}
        className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold transition-colors"
      >
        {teamName.trim() && matchName.trim() && team.players.length > 0 
          ? `Start "${matchName}" with ${team.players.length} Players` 
          : "Complete Team & Match Setup to Start"}
      </button>
    </div>
  );
}

// ---------- Simple Roster View (Main View - Mobile First) ----------
function SimpleRosterView({ team, updateTeam, clock, togglePlayerOnIce, penalties = [] }) {
  const { t } = useLanguage();
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [, forceUpdate] = useState(0);

  // Force re-render every second to update penalty timers
  useEffect(() => {
    if (!clock.running) return;
    const interval = setInterval(() => {
      forceUpdate(x => x + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [clock.running]);

  // Get elapsed time for penalty calculations
  const currentElapsedMs = clock.running && clock.lastStartedAt
    ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
    : clock.elapsedMs;

  // Get active penalties for our team that affect strength
  const activeOurPenalties = penalties.filter(p => p.team === "US" && !p.served && p.affectsStrength);
  
  // Calculate effective on-ice cap (reduced by penalties)
  const effectiveOnIceCap = Math.max(3, (team.onIceCap || 6) - activeOurPenalties.length);
  
  // Get players in penalty box (have active penalty) with penalty details
  const playersInPenalty = team.players
    .map(p => {
      const playerPenalty = penalties.find(pen => 
        pen.playerNumber === p.number && 
        pen.team === "US" && 
        !pen.served && 
        pen.affectsStrength
      );
      if (playerPenalty) {
        const elapsed = currentElapsedMs - playerPenalty.startTimeMs;
        const remaining = Math.max(0, playerPenalty.durationMs - elapsed);
        const remainingSec = Math.ceil(remaining / 1000);
        return { ...p, penalty: playerPenalty, remainingSec };
      }
      return null;
    })
    .filter(p => p !== null);
  
  // Filter out players in penalty box from on-ice and benched lists
  const playersInPenaltyIds = playersInPenalty.map(p => p.id);
  const onIcePlayers = team.players.filter((p) => p.onIce && !playersInPenaltyIds.includes(p.id));
  const benchedPlayers = team.players.filter((p) => !p.onIce && !playersInPenaltyIds.includes(p.id));
  
  const onIceCount = onIcePlayers.length;
  const overCap = onIceCount > effectiveOnIceCap;

  function addPlayer() {
    if (!num && !name) return;
    const player = {
      id: mkId(),
      number: num.trim(),
      name: name.trim(),
      initials: initialsOf(name.trim()),
      onIce: false,
      plusMinus: 0,
      toiSeconds: 0,
      enteredAt: null,
      shots: 0,
      blockedShots: 0,
      hits: 0,
      takeaways: 0,
      giveaways: 0,
      breakaways: 0,
    };
    updateTeam({ ...team, players: [...team.players, player] });
    setNum("");
    setName("");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      addPlayer();
    }
  }

  function toggleOnIce(id) {
    // Use the event-logging toggle function if provided
    if (togglePlayerOnIce) {
      togglePlayerOnIce(id);
      return;
    }
    
    // Fallback to local logic (for backwards compatibility)
    const now = Date.now();
    const playerToToggle = team.players.find((p) => p.id === id);
    if (!playerToToggle) return;
    
    // If putting a goalie on ice, check if there's already a goalie on ice
    if (!playerToToggle.onIce && playerToToggle.isGoalie) {
      const goalieOnIce = team.players.find((p) => p.onIce && p.isGoalie && p.id !== id);
      if (goalieOnIce) {
        alert(t("oneGoalieOnly"));
        return;
      }
    }
    
    const next = team.players.map((p) => {
      if (p.id !== id) {
        // If putting a goalie on ice, bench any other goalie
        if (!playerToToggle.onIce && playerToToggle.isGoalie && p.isGoalie && p.onIce) {
          if (clock.running && p.enteredAt != null) {
            const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
            return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
          }
          return { ...p, onIce: false, enteredAt: null };
        }
        return p;
      }
      if (p.onIce) {
        if (clock.running && p.enteredAt != null) {
          const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
          return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
        }
        return { ...p, onIce: false, enteredAt: null };
      } else {
        return { ...p, onIce: true, enteredAt: clock.running ? now : null };
      }
    });
    updateTeam({ ...team, players: next });
  }

  function benchAll() {
    const now = Date.now();
    const next = team.players.map((p) => {
      if (p.onIce && p.enteredAt != null && clock.running) {
        const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
        return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
      }
      return { ...p, onIce: false, enteredAt: null };
    });
    updateTeam({ ...team, players: next });
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{team.name}</h2>
          <button onClick={benchAll} className="px-3 py-1.5 rounded-lg border text-sm bg-white">
            {t("clearIce")}
          </button>
        </div>
      </div>

      {/* Add Player */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="#"
          value={num}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
              setNum(value);
            }
          }}
          onKeyPress={handleKeyPress}
          className="w-20 rounded-lg border px-3 py-2 text-center font-mono text-lg"
        />
        <input
          type="text"
          placeholder={t("playerName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button onClick={addPlayer} className="px-4 py-2 rounded-lg bg-black text-white font-medium">
          Add
        </button>
      </div>

      {/* On Ice Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {t("onIce")} {onIceCount > 0 && `(${onIceCount}/${effectiveOnIceCap})`}
          </h3>
          {overCap && <span className="text-xs text-red-600 font-medium">{t("overCapShort")}</span>}
        </div>
        
        {onIcePlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
            {t("tapToToggle")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {onIcePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleOnIce(p.id)}
                className="flex flex-col items-center gap-1 group"
                title={`${p.name}${p.isGoalie ? ' 🥅 ' + t("isGoalie") : ''} - ${t("tapToBench")}`}
              >
                <div className={`w-16 h-16 rounded-full ${p.isGoalie ? 'bg-yellow-500 border-4 border-yellow-600' : 'bg-emerald-600 border-4 border-emerald-700'} flex items-center justify-center text-white font-bold text-xl shadow-lg group-active:scale-95 transition-transform relative`}>
                  {p.number || "?"}
                  {p.isGoalie && <span className="absolute -top-1 -right-1 text-lg">🥅</span>}
                </div>
                <div className="text-xs font-medium text-gray-700 max-w-[64px] truncate">
                  {p.name || "—"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Penalty Box Section */}
      {playersInPenalty.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            ⚖️ {t("penaltyBox")} ({playersInPenalty.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {playersInPenalty.map((p) => {
              const penalty = p.penalty;
              const isExpired = p.remainingSec <= 0;
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1 bg-orange-50 border-2 border-orange-200 rounded-xl p-2"
                >
                  <div className={`w-16 h-16 rounded-full ${p.isGoalie ? 'bg-yellow-500 border-4 border-yellow-600' : 'bg-orange-500 border-4 border-orange-700'} flex items-center justify-center text-white font-bold text-xl shadow-lg relative`}>
                    {p.number || "?"}
                    {p.isGoalie && <span className="absolute -top-1 -right-1 text-lg">🥅</span>}
                  </div>
                  <div className="text-xs font-medium text-gray-700 max-w-[64px] truncate">
                    {p.name || "—"}
                  </div>
                  {penalty && (
                    <>
                      <div className="text-xs text-orange-700 font-semibold">
                        {penalty.type} ({penalty.duration}min)
                      </div>
                      <div className={`text-sm font-mono font-bold ${
                        p.remainingSec <= 10 ? "text-red-600" : "text-orange-600"
                      }`}>
                        {mmss(p.remainingSec)}
                      </div>
                      {penalty.infraction && (
                        <div className="text-xs text-gray-500 max-w-[80px] truncate">
                          {penalty.infraction}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bench Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          {t("bench")} {benchedPlayers.length > 0 && `(${benchedPlayers.length})`}
        </h3>
        
        {benchedPlayers.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            {t("allPlayersOnIce")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {benchedPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleOnIce(p.id)}
                className="flex flex-col items-center gap-1 group"
                title={`${p.name}${p.isGoalie ? ' 🥅 ' + t("isGoalie") : ''} - ${t("tapToPutOnIce")}`}
              >
                <div className={`w-16 h-16 rounded-full ${p.isGoalie ? 'bg-yellow-100 border-4 border-yellow-300' : 'bg-gray-100 border-4 border-gray-300'} flex items-center justify-center ${p.isGoalie ? 'text-yellow-800' : 'text-gray-700'} font-bold text-xl group-active:scale-95 transition-transform relative`}>
                  {p.number || "?"}
                  {p.isGoalie && <span className="absolute -top-1 -right-1 text-lg">🥅</span>}
                </div>
                <div className="text-xs font-medium text-gray-600 max-w-[64px] truncate">
                  {p.name || "—"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- My Players Stats View ----------
function MyPlayersView({ team, myPlayerIds, onToggleMyPlayer, updatePlayerStat, togglePlayerOnIce, clock }) {
  const { t } = useLanguage();
  const myPlayers = team.players.filter((p) => myPlayerIds.includes(p.id));
  const otherPlayers = team.players.filter((p) => !myPlayerIds.includes(p.id));

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t("myPlayers")}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t("selectPlayersToTrack")}
        </p>

        {myPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
            {t("noPlayers")}
          </div>
        ) : (
          <div className="space-y-3">
            {myPlayers.map((p) => (
              <div key={p.id} className={`rounded-xl p-4 ${p.onIce ? 'bg-emerald-50 border-2 border-emerald-400' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => togglePlayerOnIce(p.id)}
                      className="flex-shrink-0"
                    >
                      <div className={`w-12 h-12 rounded-full ${p.onIce ? (p.isGoalie ? 'bg-yellow-500 border-4 border-yellow-600' : 'bg-emerald-600 border-4 border-emerald-700') : (p.isGoalie ? 'bg-yellow-100 border-4 border-yellow-300' : 'bg-gray-200 border-4 border-gray-300')} ${p.onIce ? 'text-white' : 'text-gray-700'} flex items-center justify-center font-bold text-lg relative transition-all active:scale-95`}>
                        {p.number || "?"}
                        {p.isGoalie && <span className="absolute -top-1 -right-1 text-sm">🥅</span>}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        {p.name}
                        {p.isGoalie && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{t("isGoalie")}</span>}
                        {p.onIce && (
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                            🧊 {t("onIce")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {p.onIce ? `${t("onIce")} - ${t("tapToBench")}` : `${t("onBench")} - ${t("tapToPutOnIce")}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleMyPlayer(p.id)}
                    className="px-3 py-1 rounded-lg border bg-white text-sm flex-shrink-0"
                  >
                    {t("remove")}
                  </button>
                </div>

                {/* Stats grid */}
                {!p.onIce && (
                  <div className="mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-center">
                    ⚠️ {t("playerOnIce")}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {p.isGoalie ? (
                    // Goalie stats
                    [
                      { key: 'saves', label: t('saves'), icon: '🛡️', color: '#0891b2' },
                      { key: 'goalsAgainst', label: t('goalsAgainst'), icon: '🚨', color: '#dc2626' },
                      { key: 'shutouts', label: t('shutouts'), icon: '⭐', color: '#fbbf24' },
                    ].map((stat) => (
                      <button
                        key={stat.key}
                        onClick={() => p.onIce && updatePlayerStat(p.id, stat.key, 1)}
                        disabled={!p.onIce}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-white transition-transform ${
                          p.onIce ? 'active:scale-95 hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                        style={{ backgroundColor: stat.color }}
                      >
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-xs mt-1">{stat.label}</span>
                        <span className="text-lg font-bold mt-1">{p[stat.key] || 0}</span>
                      </button>
                    ))
                  ) : (
                    // Regular player stats
                    [
                      { key: 'shots', label: t('shots'), icon: '🎯', color: '#2563eb' },
                      { key: 'breakaways', label: t('zoneEntries'), icon: '🚀', color: '#0891b2' },
                      { key: 'blockedShots', label: t('blockedShots'), icon: '🛡️', color: '#9333ea' },
                      { key: 'hits', label: t('hits'), icon: '💥', color: '#ea580c' },
                      { key: 'takeaways', label: t('takeaways'), icon: '⚡', color: '#16a34a' },
                      { key: 'giveaways', label: t('giveaways'), icon: '❌', color: '#dc2626' },
                    ].map((stat) => (
                      <button
                        key={stat.key}
                        onClick={() => p.onIce && updatePlayerStat(p.id, stat.key, 1)}
                        disabled={!p.onIce}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-white transition-transform ${
                          p.onIce ? 'active:scale-95 hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                        style={{ backgroundColor: stat.color }}
                      >
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-xs mt-1">{stat.label}</span>
                        <span className="text-lg font-bold mt-1">{p[stat.key] || 0}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Players */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Available Players
        </h3>
        
        {otherPlayers.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            All players are being tracked
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {otherPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => onToggleMyPlayer(p.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
              >
                <div className={`w-8 h-8 rounded-full ${p.isGoalie ? 'bg-yellow-200' : 'bg-gray-200'} flex items-center justify-center font-bold text-sm relative`}>
                  {p.number || "?"}
                  {p.isGoalie && <span className="absolute -top-0.5 -right-0.5 text-xs">🥅</span>}
                </div>
                <span className="text-sm font-medium flex items-center gap-1">
                  {p.name}
                  {p.isGoalie && <span className="text-xs text-yellow-700">(G)</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Leaderboard Component ----------
function Leaderboard({ players }) {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState("shots");
  
  const statConfigs = {
    shots: { label: t("shots"), key: "shots", icon: "🎯", color: "blue" },
    breakaways: { label: t("zoneEntries"), key: "breakaways", icon: "🚀", color: "cyan" },
    blockedShots: { label: t("blockedShots"), key: "blockedShots", icon: "🛡️", color: "purple" },
    hits: { label: t("hits"), key: "hits", icon: "💥", color: "orange" },
    takeaways: { label: t("takeaways"), key: "takeaways", icon: "⚡", color: "green" },
    plusMinus: { label: t("plusMinus"), key: "plusMinus", icon: "±", color: "emerald" },
    saves: { label: t("saves"), key: "saves", icon: "🛡️", color: "cyan" },
    goalsAgainst: { label: t("goalsAgainst"), key: "goalsAgainst", icon: "🚨", color: "red" },
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    if (bVal !== aVal) return bVal - aVal;
    // Tie-breaker: by number
    const an = Number(a.number);
    const bn = Number(b.number);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return (a.name || "").localeCompare(b.name || "");
  });

  const topPlayers = sortedPlayers.slice(0, 10);
  const currentConfig = statConfigs[sortBy] || statConfigs.shots;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t("leaderboard")}</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm bg-white"
        >
          <option value="shots">🎯 {t("shots")}</option>
          <option value="breakaways">🚀 {t("zoneEntries")}</option>
          <option value="blockedShots">🛡️ {t("blockedShots")}</option>
          <option value="hits">💥 {t("hits")}</option>
          <option value="takeaways">⚡ {t("takeaways")}</option>
          <option value="plusMinus">± {t("plusMinus")}</option>
          <option value="saves">🛡️ {t("saves")} ({t("isGoalie")})</option>
          <option value="goalsAgainst">🚨 {t("goalsAgainst")} ({t("isGoalie")})</option>
        </select>
      </div>

      {topPlayers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No players to display</div>
      ) : (
        <div className="space-y-2">
          {topPlayers.map((p, idx) => {
            const value = p[sortBy] || 0;
            const isGoalie = p.isGoalie;
            const showStat = isGoalie 
              ? (sortBy === "saves" || sortBy === "goalsAgainst" || sortBy === "plusMinus")
              : (sortBy !== "saves" && sortBy !== "goalsAgainst");
            
            if (!showStat && sortBy !== "plusMinus") return null;

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  idx === 0 ? "bg-yellow-50 border-yellow-300" :
                  idx === 1 ? "bg-gray-50 border-gray-300" :
                  idx === 2 ? "bg-orange-50 border-orange-200" :
                  "bg-white border-gray-200"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? "bg-yellow-500 text-white" :
                  idx === 1 ? "bg-gray-400 text-white" :
                  idx === 2 ? "bg-orange-500 text-white" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  {idx + 1}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  p.isGoalie ? "bg-yellow-500" : "bg-emerald-600"
                } text-white relative`}>
                  {p.number || "?"}
                  {p.isGoalie && <span className="absolute -top-0.5 -right-0.5 text-xs">🥅</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {p.name}
                    {p.isGoalie && <span className="ml-2 text-xs text-yellow-700">(G)</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    currentConfig.color === "blue" ? "text-blue-600" :
                    currentConfig.color === "cyan" ? "text-cyan-600" :
                    currentConfig.color === "purple" ? "text-purple-600" :
                    currentConfig.color === "orange" ? "text-orange-600" :
                    currentConfig.color === "green" ? "text-green-600" :
                    currentConfig.color === "emerald" ? "text-emerald-600" :
                    currentConfig.color === "red" ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                    {value}
                  </div>
                  <div className="text-xs text-gray-500">{currentConfig.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Player Timeline Component ----------
function PlayerTimeline({ players, events, ourTeamName, opponentTeamName }) {
  const { t } = useLanguage();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  const togglePlayer = (playerId) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Helper to parse time string (HH:MM:SS AM/PM or HH:MM:SS) to seconds for sorting
  const timeToSeconds = (timeStr) => {
    if (!timeStr || timeStr === "Current" || timeStr === "Match Start") return 0;
    try {
      // Handle AM/PM format (e.g., "02:07:21 PM")
      const hasAMPM = timeStr.includes("AM") || timeStr.includes("PM");
      let timePart = timeStr.split(" ")[0]; // Get "HH:MM:SS" part
      const parts = timePart.split(":").map(Number);
      let hours = parts[0];
      const minutes = parts[1] || 0;
      const seconds = parts[2] || 0;
      
      if (hasAMPM) {
        const isPM = timeStr.includes("PM");
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }
      
      return hours * 3600 + minutes * 60 + seconds;
    } catch {
      return 0;
    }
  };

  // Build timeline periods for a player
  const buildPlayerTimeline = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return [];

    // Get all relevant events for this player, sorted by time
    const playerEvents = events
      .filter((ev) => {
        if (ev.type === "ON_ICE_CHANGE") {
          return ev.playerId === playerId;
        }
        if (ev.type === "STAT_CHANGE") {
          return ev.playerId === playerId;
        }
        if (ev.type === "GOAL") {
          return ev.ourOnIceIds?.includes(playerId);
        }
        return false;
      })
      .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));

    if (playerEvents.length === 0) return [];

    const periods = [];
    let currentPeriod = null;
    let wasOnIceInitially = false;

    // Check if player started on ice
    const firstEvent = playerEvents[0];
    const firstOnIceChange = playerEvents.find((ev) => ev.type === "ON_ICE_CHANGE" && ev.onIce);
    const firstBenchChange = playerEvents.find((ev) => ev.type === "ON_ICE_CHANGE" && !ev.onIce);
    
    // Determine if player started on ice:
    // 1. If first event is GOAL (can only happen when on ice), assume started on ice
    // 2. If first event is STAT_CHANGE and player is currently on ice, assume started on ice
    // 3. If first ON_ICE_CHANGE is benching (not putting on ice), assume started on ice
    if (firstEvent) {
      if (firstEvent.type === "GOAL") {
        // Goals can only happen when on ice
        wasOnIceInitially = true;
        currentPeriod = {
          startTime: firstEvent.time,
          endTime: null,
          events: [],
        };
      } else if (firstEvent.type === "STAT_CHANGE") {
        // If player is currently on ice or will be put on ice, assume started on ice
        if (player.onIce || firstOnIceChange) {
          wasOnIceInitially = true;
          currentPeriod = {
            startTime: firstEvent.time,
            endTime: null,
            events: [],
          };
        }
      } else if (firstEvent.type === "ON_ICE_CHANGE" && !firstEvent.onIce) {
        // First event is benching, so they must have started on ice
        wasOnIceInitially = true;
        // Create initial period that will be closed when benched
        currentPeriod = {
          startTime: "Match Start", // Placeholder - will show as period start
          endTime: null,
          events: [],
        };
      }
    }

    for (const ev of playerEvents) {
      if (ev.type === "ON_ICE_CHANGE") {
        if (ev.onIce) {
          // Starting a new on-ice period
          if (currentPeriod && currentPeriod.endTime === null) {
            // Close previous period if exists and is still open
            currentPeriod.endTime = ev.time;
            periods.push(currentPeriod);
          }
          currentPeriod = {
            startTime: ev.time,
            endTime: null,
            events: [],
          };
        } else {
          // Ending current period
          if (currentPeriod) {
            if (currentPeriod.endTime === null) {
              currentPeriod.endTime = ev.time;
            }
            periods.push(currentPeriod);
            currentPeriod = null;
          } else if (wasOnIceInitially && ev === firstEvent) {
            // Handle case where first event is benching - create period from match start
            periods.push({
              startTime: "Match Start",
              endTime: ev.time,
              events: [],
            });
          }
        }
      } else {
        // STAT_CHANGE or GOAL event
        if (currentPeriod) {
          // Add to current on-ice period
          currentPeriod.events.push(ev);
        } else {
          // Event happened while not in a tracked period
          // If this is a GOAL, player must have been on ice (goals only happen when on ice)
          // If player is currently on ice or was on ice initially, assume they were on ice
          if (ev.type === "GOAL" || wasOnIceInitially || player.onIce) {
            // Create an on-ice period for this event
            currentPeriod = {
              startTime: ev.time,
              endTime: null,
              events: [ev],
            };
          } else {
            // Create a bench period for this event
            periods.push({
              startTime: ev.time,
              endTime: ev.time,
              events: [ev],
              isBench: true,
            });
          }
        }
      }
    }

    // Close any open period
    if (currentPeriod) {
      currentPeriod.endTime = currentPeriod.endTime || "Current";
      periods.push(currentPeriod);
    }

    return periods;
  };

  const getEventIcon = (ev) => {
    if (ev.type === "GOAL") {
      return ev.scorer === "US" ? "⚽" : "🚨";
    }
    if (ev.type === "STAT_CHANGE") {
      const icons = {
        shots: "🎯",
        breakaways: "🚀",
        blockedShots: "🛡️",
        hits: "💥",
        takeaways: "⚡",
        giveaways: "❌",
        saves: "🛡️",
        goalsAgainst: "🚨",
        shutouts: "⭐",
      };
      return icons[ev.stat] || "📊";
    }
    return "•";
  };

  const ourName = ourTeamName || "Us";
  const opponentName = opponentTeamName || "Them";
  
  const getEventLabel = (ev) => {
    if (ev.type === "GOAL") {
      let label = `${ev.scorer === "US" ? `Goal: ${ourName}` : `Goal: ${opponentName}`}`;
      if (ev.scorer === "US" && ev.scorerNumber) {
        const assists = [];
        if (ev.assist1Number) assists.push(`A: ${ev.assist1Number}`);
        if (ev.assist2Number) assists.push(`A: ${ev.assist2Number}`);
        label = `Goal: #${ev.scorerNumber}`;
        if (assists.length > 0) {
          label += ` (${assists.join(", ")})`;
        }
      }
      return label;
    }
    if (ev.type === "STAT_CHANGE") {
      const labels = {
        shots: "Shot",
        breakaways: "Zone Entry",
        blockedShots: "Block",
        hits: "Hit",
        takeaways: "Takeaway",
        giveaways: "Giveaway",
        saves: "Save",
        goalsAgainst: "Goal Against",
        shutouts: "Shutout",
      };
      return `${labels[ev.stat] || ev.stat}: ${ev.value}`;
    }
    return "Event";
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime || endTime === "Current") return null;
    try {
      const start = timeToSeconds(startTime);
      const end = timeToSeconds(endTime);
      const duration = end - start;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">{t("matchReplay")}</h2>
        <p className="text-sm text-gray-600 mb-3">
          {t("selectPlayersToView")}
        </p>
        
        {/* Player Selector */}
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const isSelected = selectedPlayerIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  p.isGoalie ? "bg-yellow-500" : "bg-emerald-600"
                } text-white relative`}>
                  {p.number || "?"}
                  {p.isGoalie && <span className="absolute -top-0.5 -right-0.5 text-[10px]">🥅</span>}
                </div>
                <span className="font-medium">{p.name}</span>
                {isSelected && <span className="text-emerald-600">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {selectedPlayerIds.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
          {t("selectPlayersAbove")}
        </div>
      ) : (
        <div className="space-y-4">
          {selectedPlayerIds.map((playerId) => {
            const player = players.find((p) => p.id === playerId);
            if (!player) return null;
            const periods = buildPlayerTimeline(playerId);

            return (
              <div key={playerId} className="border rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    player.isGoalie ? "bg-yellow-500" : "bg-emerald-600"
                  } text-white relative`}>
                    {player.number || "?"}
                    {player.isGoalie && <span className="absolute -top-0.5 -right-0.5 text-xs">🥅</span>}
                  </div>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs text-gray-500">
                      {periods.length} on-ice period{periods.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {periods.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">
                    No on-ice periods recorded for this player
                  </div>
                ) : (
                  <div className="space-y-3">
                    {periods.map((period, periodIdx) => {
                      const duration = calculateDuration(period.startTime, period.endTime);
                      const isOnIce = !period.isBench;

                      return (
                        <div
                          key={periodIdx}
                          className={`rounded-lg border-2 ${
                            isOnIce
                              ? "bg-emerald-50 border-emerald-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          {/* Period Header */}
                          <div className={`flex items-center justify-between p-3 border-b ${
                            isOnIce ? "border-emerald-200" : "border-gray-200"
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{isOnIce ? "🧊" : "🪑"}</span>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {isOnIce ? t("onIce") : t("onBench")}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {period.startTime}
                                  {period.endTime && period.endTime !== "Current" && ` → ${period.endTime}`}
                                  {period.endTime === "Current" && ` → ${t("current")}`}
                                </div>
                              </div>
                            </div>
                            {duration && (
                              <div className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                                {duration}
                              </div>
                            )}
                          </div>

                          {/* Period Events */}
                          {period.events.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              {t("noActionsRecorded")}
                            </div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {period.events.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="flex items-start gap-2 p-2 rounded bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <span className="text-lg flex-shrink-0">{getEventIcon(ev)}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                      {getEventLabel(ev)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">{ev.time}</div>
                                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                      <span>Elapsed: {ev.elapsedTime || "00:00"}</span>
                                      {ev.remainingTime !== null && ev.remainingTime !== undefined && (
                                        <span>• Remaining: {ev.remainingTime}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Team Panel (Detailed Stats View - Read-only display) ----------
function TeamPanel({ team, clock }) {
  const { t } = useLanguage();
  const [showLegendHelp, setShowLegendHelp] = useState(false);

  function pmBadge(pm) {
    if (pm > 0) return "bg-green-50 text-green-700 border-green-200";
    if (pm < 0) return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  // Calculate on-ice status
  const onIceCount = team.players.filter((p) => p.onIce).length;
  const overCap = onIceCount > team.onIceCap;

  // Sort: on-ice first, then by number, then name
  const sorted = [...team.players].sort((a, b) => {
    if (a.onIce !== b.onIce) return a.onIce ? -1 : 1;
    const an = Number(a.number);
    const bn = Number(b.number);
    const aIsNum = !isNaN(an);
    const bIsNum = !isNaN(bn);
    if (aIsNum && bIsNum && an !== bn) return an - bn;
    if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const now = Date.now();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{team.name} {t("roster")}</h2>
        <div className="flex items-center gap-2">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              overCap ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {t("onIceCount")} <span className="font-bold ml-1">{onIceCount}</span>/<span>{team.onIceCap}</span>
          </div>
        </div>
      </div>

      {/* Stats Legend - Collapsed by default with help icon */}
      <div className="mb-3">
        <button
          onClick={() => setShowLegendHelp(!showLegendHelp)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium transition-colors"
        >
          <span>ℹ️</span>
          <span>{showLegendHelp ? t("hideStatsGuide") : t("statsGuide")}</span>
        </button>
      </div>

      {showLegendHelp && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl border">
          <div className="text-xs font-semibold text-gray-600 mb-2">{t("quickStats")}</div>
        
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-600 text-white font-semibold">🎯</span>
              <span className="text-gray-700">{t("shots")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-cyan-600 text-white font-semibold">🚀</span>
              <span className="text-gray-700">{t("zoneEntries")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-purple-600 text-white font-semibold">🛡️</span>
              <span className="text-gray-700">{t("blockedShots")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-orange-600 text-white font-semibold">💥</span>
              <span className="text-gray-700">{t("hits")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-600 text-white font-semibold">⚡</span>
              <span className="text-gray-700">{t("takeaways")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded bg-red-600 text-white font-semibold">❌</span>
              <span className="text-gray-700">{t("giveaways")}</span>
            </div>
          </div>

          {/* Detailed explanations */}
          <div className="mt-3 pt-3 border-t space-y-2 text-xs">
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-blue-600 mb-1">🎯 Shots on Goal</div>
              <div className="text-gray-700">Any shot attempt that reaches the net (on target). Count when your player shoots and the goalie makes a save or scores.</div>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-cyan-600 mb-1">🚀 Zone Entries</div>
              <div className="text-gray-700">Player carries puck from defensive zone through neutral into offensive zone. Includes breakaways, rushes, and controlled entries.</div>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-purple-600 mb-1">🛡️ Blocked Shots</div>
              <div className="text-gray-700">Player blocks opponent's shot with their body or equipment. Shows defensive positioning and sacrifice.</div>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-orange-600 mb-1">💥 Hits</div>
              <div className="text-gray-700">Legal body check to separate opponent from puck. Includes checks into boards, shoulder contact, and clean physical play.</div>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-green-600 mb-1">⚡ Takeaways (Good ✓)</div>
              <div className="text-gray-700">Player steals/intercepts puck from opponent. Poke checks, pass interceptions, winning puck battles. Higher is better.</div>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-red-600 mb-1">❌ Giveaways (Bad ✗)</div>
              <div className="text-gray-700">Player loses puck to opponent through mistake. Bad passes, turnovers, losing battles. Lower is better - this tracks errors.</div>
            </div>
          </div>
        </div>
      )}


      {overCap && (
        <div className="text-sm text-red-700 mb-2">{t("overCapMessage")}</div>
      )}

      <ul className="grid grid-cols-1 gap-3">
        {sorted.map((p) => {
          const liveTOI =
            (p.toiSeconds || 0) +
            (p.onIce && p.enteredAt && clock.running ? Math.floor((now - p.enteredAt) / 1000) : 0);
          
          return (
            <li
              key={p.id}
              className={`rounded-2xl border ${
                p.onIce ? "bg-emerald-50 border-emerald-200" : "bg-white"
              }`}
            >
              {/* Main player card */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Player info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-base relative ${
                        p.isGoalie 
                          ? (p.onIce ? "bg-yellow-500 text-white border-yellow-600" : "bg-yellow-100 text-yellow-800 border-yellow-300")
                          : (p.onIce ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300")
                      }`}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <div className="text-sm">#{p.number || "?"}</div>
                        <div className="text-[10px] opacity-80">{p.initials || ""}</div>
                      </div>
                      {p.isGoalie && <span className="absolute -top-1 -right-1 text-xs">🥅</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate flex items-center gap-2">
                        {p.name || "—"}
                        {p.isGoalie && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Goalie</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${pmBadge(
                            p.plusMinus
                          )}`}
                        >
                          ± {p.plusMinus}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-800">
                          🕒 {mmss(liveTOI)}
                        </span>
                        {p.onIce && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${p.isGoalie ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            ⛸ On Ice
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats display (read-only) */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {p.isGoalie ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 text-sm font-semibold border border-cyan-200">
                        🛡️ Saves: {p.saves || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                        🚨 GA: {p.goalsAgainst || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-semibold border border-yellow-200">
                        ⭐ SO: {p.shutouts || 0}
                      </span>
                      {(p.saves || 0) + (p.goalsAgainst || 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-semibold border border-gray-200">
                          SV%: {((p.saves || 0) / ((p.saves || 0) + (p.goalsAgainst || 0)) * 100).toFixed(1)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
                        🎯 {p.shots || 0}
                      </span>
                      
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 text-sm font-semibold border border-cyan-200">
                        🚀 {p.breakaways || 0}
                      </span>
                      
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200">
                        🛡️ {p.blockedShots || 0}
                      </span>
                      
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-200">
                        💥 {p.hits || 0}
                      </span>
                      
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                        ⚡ {p.takeaways || 0}
                      </span>
                      
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                        ❌ {p.giveaways || 0}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Goal Input Modal ----------
function GoalInputModal({ isOpen, onClose, onSave, players, teamName, penalties = [], team = "US" }) {
  const { t } = useLanguage();
  const [scorerNumber, setScorerNumber] = useState("");
  const [assist1Number, setAssist1Number] = useState("");
  const [assist2Number, setAssist2Number] = useState("");

  if (!isOpen) return null;

  function handleSave() {
    if (!scorerNumber.trim()) {
      alert(t("enterScorerNumber"));
      return;
    }
    onSave(
      scorerNumber.trim(),
      assist1Number.trim() || null,
      assist2Number.trim() || null
    );
    // Reset form
    setScorerNumber("");
    setAssist1Number("");
    setAssist2Number("");
  }

  function handleCancel() {
    setScorerNumber("");
    setAssist1Number("");
    setAssist2Number("");
    onClose();
  }

  // Get players in penalty box
  const playersInPenaltyIds = players
    .filter(p => {
      const playerPenalty = penalties.find(pen => 
        pen.playerNumber === p.number && 
        pen.team === team && 
        !pen.served && 
        pen.affectsStrength
      );
      return !!playerPenalty;
    })
    .map(p => p.id);

  // Filter players: only on-ice players, not in penalty box, with numbers
  const availablePlayers = players.filter((p) => 
    p.onIce && 
    !playersInPenaltyIds.includes(p.id) &&
    p.number
  );

  // Get list of player numbers for reference (only available players)
  const playerNumbers = availablePlayers
    .map((p) => p.number)
    .sort((a, b) => {
      const numA = parseInt(a) || 999;
      const numB = parseInt(b) || 999;
      return numA - numB;
    });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4">{t("goal")}: {teamName}</h2>
        <p className="text-sm text-gray-600 mb-4">{t("enterPlayerNumber")}</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("scorerNumber")} *
            </label>
            <input
              type="text"
              placeholder="e.g., 23"
              value={scorerNumber}
              onChange={(e) => setScorerNumber(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-lg"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("assist1")}
            </label>
            <input
              type="text"
              placeholder="e.g., 12"
              value={assist1Number}
              onChange={(e) => setAssist1Number(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-lg"
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("assist2")}
            </label>
            <input
              type="text"
              placeholder="e.g., 8"
              value={assist2Number}
              onChange={(e) => setAssist2Number(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-lg"
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        {playerNumbers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">{t("availableNumbers")}</p>
            <div className="flex flex-wrap gap-2">
              {playerNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (!scorerNumber) {
                      setScorerNumber(num);
                    } else if (!assist1Number) {
                      setAssist1Number(num);
                    } else if (!assist2Number) {
                      setAssist2Number(num);
                    }
                  }}
                  className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
                >
                  #{num}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-xl border text-lg font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold"
          >
            {t("saveGoal")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Controls ----------
function ControlsBar({ goalUs, goalThem, undo, canUndo, ourTeamName, opponentTeamName }) {
  const { t } = useLanguage();
  const ourName = ourTeamName || "Us";
  const opponentName = opponentTeamName || "Them";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex items-center justify-between gap-2 z-50">
      <button onClick={goalUs} className="flex-1 px-4 py-4 rounded-2xl bg-green-600 text-white text-lg font-semibold">
        🥅 {t("goal")}: {ourName}
      </button>
      <button
        onClick={goalThem}
        className="flex-1 px-4 py-4 rounded-2xl bg-rose-600 text-white text-lg font-semibold"
      >
        🚨 {t("goal")}: {opponentName}
      </button>
      <button
        onClick={undo}
        disabled={!canUndo}
        className="px-4 py-4 rounded-2xl border text-lg font-semibold disabled:opacity-40"
      >
        {t("undo")}
      </button>
    </div>
  );
}

// ---------- Event Log ----------
function EventLog({ events, players = [], ourTeamName, opponentTeamName }) {
  const { t } = useLanguage();
  if (!events.length) return <div className="text-sm text-gray-500">{t("noEvents")}</div>;
  
  const ourName = ourTeamName || "Us";
  const opponentName = opponentTeamName || "Them";
  
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? `${player.number || "?"} - ${player.name}` : playerId;
  };

  const getEventDisplay = (ev) => {
    if (ev.type === "GOAL") {
      let details = `${t("onIcePlayers")}: ${ev.ourOnIceIds?.length || 0}`;
      if (ev.scorer === "US" && ev.scorerNumber) {
        const assists = [];
        if (ev.assist1Number) assists.push(`A: ${ev.assist1Number}`);
        if (ev.assist2Number) assists.push(`A: ${ev.assist2Number}`);
        details = `${t("goal")}: #${ev.scorerNumber}`;
        if (assists.length > 0) {
          details += ` (${assists.join(", ")})`;
        }
      }
      return {
        icon: ev.scorer === "US" ? "⚽" : "🚨",
        label: ev.scorer === "US" ? `${t("goal")}: ${ourName}` : `${t("goal")}: ${opponentName}`,
        color: ev.scorer === "US" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200",
        details: details,
      };
    }
    if (ev.type === "STAT_CHANGE") {
      const statLabels = {
        shots: `🎯 ${t("shot")}`,
        breakaways: `🚀 ${t("zoneEntry")}`,
        blockedShots: `🛡️ ${t("block")}`,
        hits: `💥 ${t("hit")}`,
        takeaways: `⚡ ${t("takeaway")}`,
        giveaways: `❌ ${t("giveaway")}`,
        saves: `🛡️ ${t("saveGoalie")}`,
        goalsAgainst: `🚨 ${t("goalAgainst")}`,
        shutouts: `⭐ ${t("shutout")}`,
      };
      return {
        icon: statLabels[ev.stat]?.split(" ")[0] || "📊",
        label: `${statLabels[ev.stat] || ev.stat}: ${ev.value}`,
        color: "bg-blue-50 text-blue-700 border-blue-200",
        details: getPlayerName(ev.playerId),
      };
    }
    if (ev.type === "ON_ICE_CHANGE") {
      return {
        icon: ev.onIce ? "🧊" : "🪑",
        label: ev.onIce ? t("putOnIce") : t("benched"),
        color: ev.onIce ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200",
        details: getPlayerName(ev.playerId),
      };
    }
    return {
      icon: "•",
      label: t("eventLog"),
      color: "bg-gray-50 text-gray-700 border-gray-200",
      details: "",
    };
  };

  return (
    <ol className="space-y-2">
      {events.map((ev) => {
        const display = getEventDisplay(ev);
        return (
          <li key={ev.id} className="border rounded-2xl p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{display.icon}</span>
                <div>
                  <div className="text-sm text-gray-500">{ev.time}</div>
                  <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                    <span>Elapsed: {ev.elapsedTime || "00:00"}</span>
                    {ev.remainingTime !== null && ev.remainingTime !== undefined && (
                      <span>• Remaining: {ev.remainingTime}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{display.details}</div>
                </div>
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${display.color}`}>
                {display.label}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Penalty Management Component ----------
function PenaltyManagement({ match, clock, onAddPenalty, onRemovePenalty, onEarlyRelease, ourTeamName, opponentTeamName }) {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [penaltyTeam, setPenaltyTeam] = useState("US");
  const [, forceUpdate] = useState(0);

  const penalties = match?.penalties || [];
  const activePenalties = penalties.filter(p => !p.served);

  // Force re-render every second to update timers and auto-complete expired penalties
  useEffect(() => {
    if (!clock.running) return;
    const interval = setInterval(() => {
      forceUpdate(x => x + 1);
      
      // Auto-mark expired penalties as served
      const currentElapsed = clock.elapsedMs + (Date.now() - (clock.lastStartedAt || Date.now()));
      const currentPenalties = match?.penalties || [];
      const expiredPenalties = currentPenalties.filter(p => {
        if (p.served) return false;
        const elapsed = currentElapsed - p.startTimeMs;
        const remaining = p.durationMs - elapsed;
        return remaining <= 0;
      });
      
      if (expiredPenalties.length > 0) {
        expiredPenalties.forEach(p => onRemovePenalty(p.id));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [clock.running, clock.elapsedMs, clock.lastStartedAt, match, onRemovePenalty]);

  // Calculate game situation
  const ourPenalties = activePenalties.filter(p => p.team === "US" && p.affectsStrength);
  const theirPenalties = activePenalties.filter(p => p.team === "THEM" && p.affectsStrength);
  const ourPlayers = 5 - ourPenalties.length;
  const theirPlayers = 5 - theirPenalties.length;
  const gameSituation = `${ourPlayers}vs${theirPlayers}`;

  // Get elapsed time for penalty calculations
  const currentElapsedMs = clock.running && clock.lastStartedAt
    ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
    : clock.elapsedMs;

  return (
    <div className="space-y-4">
      {/* Game Situation Display */}
      <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl border-2 p-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">{t("gameSituation")}</div>
          <div className="text-4xl font-bold">{gameSituation}</div>
          <div className="text-xs text-gray-500 mt-1">
            {ourPenalties.length > 0 && `${ourTeamName}: ${ourPenalties.length} ${t("penalties").toLowerCase()}`}
            {ourPenalties.length > 0 && theirPenalties.length > 0 && " | "}
            {theirPenalties.length > 0 && `${opponentTeamName}: ${theirPenalties.length} ${t("penalties").toLowerCase()}`}
          </div>
        </div>
      </div>

      {/* Add Penalty Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPenaltyTeam("US");
            setShowAddModal(true);
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          ➕ {ourTeamName} {t("addPenalty")}
        </button>
        <button
          onClick={() => {
            setPenaltyTeam("THEM");
            setShowAddModal(true);
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          ➕ {opponentTeamName} {t("addPenalty")}
        </button>
      </div>

      {/* Active Penalties List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("activePenalties")}</h3>
        
        {activePenalties.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t("noPenalties")}</div>
        ) : (
          <div className="space-y-2">
            {activePenalties.map((penalty) => {
              const elapsed = currentElapsedMs - penalty.startTimeMs;
              const remaining = Math.max(0, penalty.durationMs - elapsed);
              const remainingSec = Math.ceil(remaining / 1000);
              const isExpired = remaining <= 0;

              return (
                <div
                  key={penalty.id}
                  className={`p-4 rounded-xl border-2 ${
                    penalty.team === "US" 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-red-50 border-red-200"
                  } ${isExpired ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          #{penalty.playerNumber}
                        </span>
                        <span className="text-sm text-gray-600">
                          {penalty.type} ({penalty.duration}min)
                        </span>
                        {penalty.coincident && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                            {t("coincident")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {penalty.infraction}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-mono font-bold ${
                        remainingSec <= 10 ? "text-red-600" : ""
                      }`}>
                        {mmss(remainingSec)}
                      </div>
                      <div className="flex flex-col gap-1">
                        {penalty.type === "Minor" && remaining > 0 && (
                          <button
                            onClick={() => onEarlyRelease(penalty.id)}
                            className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                            title={t("earlyRelease")}
                          >
                            {t("goal")}
                          </button>
                        )}
                        <button
                          onClick={() => onRemovePenalty(penalty.id)}
                          className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Penalty Modal */}
      {showAddModal && (
        <AddPenaltyModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(penalty) => {
            onAddPenalty({ ...penalty, team: penaltyTeam });
            setShowAddModal(false);
          }}
          teamName={penaltyTeam === "US" ? ourTeamName : opponentTeamName}
          currentElapsedMs={currentElapsedMs}
          players={match?.players || []}
          penalties={penalties}
          team={penaltyTeam}
        />
      )}
    </div>
  );
}

// ---------- Add Penalty Modal ----------
function AddPenaltyModal({ isOpen, onClose, onSave, teamName, currentElapsedMs, players = [], penalties = [], team = "US" }) {
  const { t } = useLanguage();
  const [playerNumber, setPlayerNumber] = useState("");
  const [penaltyType, setPenaltyType] = useState("Minor");
  const [infraction, setInfraction] = useState("");

  if (!isOpen) return null;

  // Get players in penalty box
  const playersInPenaltyIds = players
    .filter(p => {
      const playerPenalty = penalties.find(pen => 
        pen.playerNumber === p.number && 
        pen.team === team && 
        !pen.served && 
        pen.affectsStrength
      );
      return !!playerPenalty;
    })
    .map(p => p.id);

  // Get on-ice players (excluding those in penalty box) for suggestions
  const onIcePlayers = players.filter((p) => 
    p.onIce && 
    !playersInPenaltyIds.includes(p.id) &&
    p.number
  );

  const penaltyTypes = {
    "Minor": { label: t("minor"), duration: 2 },
    "Double Minor": { label: t("doubleMinor"), duration: 4 },
    "Major": { label: t("major"), duration: 5 },
    "Misconduct": { label: t("misconduct"), duration: 10 },
    "Match Penalty": { label: t("matchPenalty"), duration: 0 },
  };

  const infractions = [
    { key: "tripping", label: t("tripping") },
    { key: "hooking", label: t("hooking") },
    { key: "slashing", label: t("slashing") },
    { key: "highSticking", label: t("highSticking") },
    { key: "interference", label: t("interference") },
    { key: "holding", label: t("holding") },
    { key: "crossChecking", label: t("crossChecking") },
    { key: "boarding", label: t("boarding") },
    { key: "charging", label: t("charging") },
    { key: "roughing", label: t("roughing") },
    { key: "elbowing", label: t("elbowing") },
    { key: "fighting", label: t("fighting") },
    { key: "delayOfGame", label: t("delayOfGame") },
    { key: "tooManyPlayers", label: t("tooManyPlayers") },
    { key: "unsportsmanlike", label: t("unsportsmanlike") },
    { key: "other", label: t("other") },
  ];

  function handleSave() {
    if (!playerNumber.trim()) {
      alert(t("enterPlayerNumber"));
      return;
    }

    const duration = penaltyTypes[penaltyType].duration;
    const penalty = {
      id: mkId(),
      playerNumber: playerNumber.trim(),
      type: penaltyType,
      duration: duration,
      durationMs: duration * 60 * 1000,
      infraction: infraction || penaltyType,
      startTimeMs: currentElapsedMs,
      served: false,
      affectsStrength: penaltyType !== "Misconduct" && penaltyType !== "Match Penalty",
      coincident: false,
    };

    onSave(penalty);
    setPlayerNumber("");
    setInfraction("");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{t("addPenalty")}: {teamName}</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("playerNumber")} *
            </label>
            <input
              type="text"
              placeholder="e.g., 23"
              value={playerNumber}
              onChange={(e) => setPlayerNumber(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-lg"
              autoFocus
            />
            {onIcePlayers.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">{t("suggestedPlayers") || "Suggested (on-ice)"}:</p>
                <div className="flex flex-wrap gap-2">
                  {onIcePlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlayerNumber(p.number)}
                      className={`px-2 py-1 text-xs rounded border hover:bg-gray-50 ${
                        playerNumber === p.number ? "bg-blue-100 border-blue-300" : ""
                      }`}
                    >
                      #{p.number} {p.name ? `(${p.name})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("penaltyType")} *
            </label>
            <select
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-lg"
            >
              {Object.keys(penaltyTypes).map(type => (
                <option key={type} value={type}>
                  {penaltyTypes[type].label} ({penaltyTypes[type].duration}min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("infraction")}
            </label>
            <select
              value={infraction}
              onChange={(e) => setInfraction(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">{t("infraction")}...</option>
              {infractions.map(inf => (
                <option key={inf.key} value={inf.label}>{inf.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border text-lg font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold"
          >
            {t("addPenalty")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Language Selector ----------
function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          language === "en"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title="English"
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => changeLanguage("fr")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          language === "fr"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title="Français"
      >
        🇫🇷 FR
      </button>
    </div>
  );
}

// ---------- App ----------
function App() {
  const { t } = useLanguage();
  const [state, setState, reset] = usePersistentState();
  const { teams, matches, currentTeamId, currentMatchId, appPhase } = state;
  const [currentView, setCurrentView] = useState("main"); // "main", "stats", "myplayers", or "penalties"
  const [subPhase, setSubPhase] = useState(""); // "creating-team", "creating-match"
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [pendingGoalUsScored, setPendingGoalUsScored] = useState(false);

  // Get current team and match
  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const currentMatch = matches.find((m) => m.id === currentMatchId);
  
  // For match phase, extract match data (ensure arrays)
  const matchPlayers = Array.isArray(currentMatch?.players) ? currentMatch.players : [];
  const clock = currentMatch?.clock || { running: false, elapsedMs: 0, lastStartedAt: null, countdownDurationMs: null };
  const events = Array.isArray(currentMatch?.events) ? currentMatch.events : [];
  const myPlayerIds = Array.isArray(currentMatch?.myPlayerIds) ? currentMatch.myPlayerIds : [];

  // Team management
  function selectTeam(teamId) {
    setState({ ...state, currentTeamId: teamId, appPhase: "match-selection" });
  }

  function createTeamStart() {
    setSubPhase("creating-team");
  }

  function saveTeam(team) {
    const existingIndex = teams.findIndex((t) => t.id === team.id);
    let nextTeams;
    if (existingIndex >= 0) {
      nextTeams = [...teams];
      nextTeams[existingIndex] = team;
    } else {
      nextTeams = [...teams, team];
    }
    setState({ ...state, teams: nextTeams, currentTeamId: team.id, appPhase: "match-selection" });
    setSubPhase("");
  }

  function cancelTeamCreate() {
    setSubPhase("");
  }

  // Match management
  function selectMatch(matchId) {
    setState({ ...state, currentMatchId: matchId, appPhase: "match" });
  }

  function createMatchStart() {
    setSubPhase("creating-match");
  }

  function saveMatch(matchName, ourTeamName, opponentTeamName) {
    if (!currentTeam) return;
    
    // Create match with team's players as initial snapshot
    const teamPlayers = Array.isArray(currentTeam.players) ? currentTeam.players : [];
    const match = {
      id: mkId(),
      name: matchName,
      teamId: currentTeam.id,
      ourTeamName: ourTeamName || "Us",
      opponentTeamName: opponentTeamName || "Them",
      startedAt: Date.now(),
      clock: { running: false, elapsedMs: 0, lastStartedAt: null, countdownDurationMs: null },
      events: [],
      penalties: [],
      myPlayerIds: [],
      players: teamPlayers.map(p => ({
        ...p, 
        onIce: false, 
        plusMinus: 0, 
        toiSeconds: 0, 
        enteredAt: null,
        saves: p.saves || 0,
        goalsAgainst: p.goalsAgainst || 0,
        shutouts: p.shutouts || 0,
      })),
    };
    
    setState({ 
      ...state, 
      matches: [...matches, match], 
      currentMatchId: match.id, 
      appPhase: "match" 
    });
    setSubPhase("");
  }

  function cancelMatchCreate() {
    setSubPhase("");
  }

  function backToTeamSelection() {
    setState({ ...state, currentTeamId: null, appPhase: "team-selection" });
  }

  function endMatch() {
    if (confirm("End match and return to match selection?")) {
      setState({ ...state, currentMatchId: null, appPhase: "match-selection" });
    }
  }

  // Update match in state
  function updateMatch(updater) {
    if (!currentMatch) return;
    const nextMatch = updater(currentMatch);
    const nextMatches = matches.map((m) => (m.id === currentMatch.id ? nextMatch : m));
    setState({ ...state, matches: nextMatches });
  }

  // Start clock and set enteredAt for all on-ice players
  function handleStartClock() {
    updateMatch((match) => {
      const now = Date.now();
      const nextPlayers = match.players.map((p) => {
        if (p.onIce) {
          return { ...p, enteredAt: now };
        }
        return p;
      });
      return {
        ...match,
        clock: { running: true, elapsedMs: match.clock.elapsedMs, lastStartedAt: now },
        players: nextPlayers,
      };
    });
  }

  // Pause clock and accrue TOI for all on-ice players
  function handlePauseClock() {
    updateMatch((match) => {
      const now = Date.now();
      const newElapsed = match.clock.elapsedMs + (now - (match.clock.lastStartedAt || now));
      const nextPlayers = match.players.map((p) => {
        if (p.onIce && p.enteredAt != null) {
          const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
          return { ...p, toiSeconds: (p.toiSeconds || 0) + delta, enteredAt: null };
        }
        return p;
      });
      return {
        ...match,
        clock: { running: false, elapsedMs: newElapsed, lastStartedAt: null },
        players: nextPlayers,
      };
    });
  }

  // Reset clock and all match data
  function handleResetClock() {
    updateMatch((match) => {
      // Reset all players to initial state
      const resetPlayers = match.players.map((p) => ({
        ...p,
        onIce: false,
        plusMinus: 0,
        toiSeconds: 0,
        enteredAt: null,
        shots: 0,
        blockedShots: 0,
        hits: 0,
        takeaways: 0,
        giveaways: 0,
        breakaways: 0,
        saves: 0,
        goalsAgainst: 0,
        shutouts: 0,
      }));
      
      return {
        ...match,
        clock: { 
          running: false, 
          elapsedMs: 0, 
          lastStartedAt: null, 
          countdownDurationMs: match.clock.countdownDurationMs // Preserve countdown setting
        },
        players: resetPlayers,
        events: [],
        myPlayerIds: [],
      };
    });
  }

  // Set countdown duration
  function handleSetCountdown(durationMs) {
    updateMatch((match) => ({
      ...match,
      clock: {
        ...match.clock,
        countdownDurationMs: durationMs,
      },
    }));
  }

  // New Period - reset countdown timer but keep all stats
  function handleNewPeriod() {
    updateMatch((match) => {
      // Reset all players' on-ice status and TOI tracking for new period
      const now = Date.now();
      const resetPlayers = match.players.map((p) => {
        // If player was on ice, accrue their TOI before resetting
        if (p.onIce && p.enteredAt != null && match.clock.running) {
          const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
          return {
            ...p,
            onIce: false,
            enteredAt: null,
            toiSeconds: (p.toiSeconds || 0) + delta,
          };
        }
        return {
          ...p,
          onIce: false,
          enteredAt: null,
        };
      });

      return {
        ...match,
        clock: {
          running: false,
          elapsedMs: 0,
          lastStartedAt: null,
          countdownDurationMs: match.clock.countdownDurationMs, // Keep countdown setting
        },
        players: resetPlayers,
      };
    });
  }

  function updateMatchPlayers(nextPlayersOrTeam) {
    // Handle both cases: array of players or team object
    const nextPlayers = Array.isArray(nextPlayersOrTeam) 
      ? nextPlayersOrTeam 
      : (nextPlayersOrTeam?.players || []);
    updateMatch((match) => ({ ...match, players: nextPlayers }));
  }

  function toggleMyPlayer(playerId) {
    updateMatch((match) => {
      const isTracking = match.myPlayerIds.includes(playerId);
      const newIds = isTracking 
        ? match.myPlayerIds.filter(id => id !== playerId)
        : [...match.myPlayerIds, playerId];
      return { ...match, myPlayerIds: newIds };
    });
  }

  function updatePlayerStat(playerId, stat, delta) {
    updateMatch((match) => {
      const player = match.players.find((p) => p.id === playerId);
      if (!player) return match;
      
      const newValue = Math.max(0, (player[stat] || 0) + delta);
      const nextPlayers = match.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, [stat]: newValue };
        }
        return p;
      });
      
      // Log stat change event
      const timestamps = getEventTimestamps(match.clock);
      const ev = {
        id: mkId(),
        time: nowHHMMSS(),
        elapsedTime: timestamps.elapsedTime,
        remainingTime: timestamps.remainingTime,
        type: "STAT_CHANGE",
        playerId: playerId,
        stat: stat,
        value: newValue,
        delta: delta,
      };
      
      return { ...match, players: nextPlayers, events: [...match.events, ev] };
    });
  }

  function togglePlayerOnIce(playerId) {
    const now = Date.now();
    updateMatch((match) => {
      const playerToToggle = match.players.find((p) => p.id === playerId);
      if (!playerToToggle) return match;
      
      // If putting a goalie on ice, check if there's already a goalie on ice
      if (!playerToToggle.onIce && playerToToggle.isGoalie) {
        const goalieOnIce = match.players.find((p) => p.onIce && p.isGoalie && p.id !== playerId);
        if (goalieOnIce) {
          alert(t("oneGoalieOnly"));
          return match;
        }
      }
      
      const timestamps = getEventTimestamps(match.clock);
      const newEvents = [];
      const nextPlayers = match.players.map((p) => {
        if (p.id !== playerId) {
          // If putting a goalie on ice, bench any other goalie
          if (!playerToToggle.onIce && playerToToggle.isGoalie && p.isGoalie && p.onIce) {
            if (clock.running && p.enteredAt != null) {
              const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
              // Log goalie benched event
              newEvents.push({
                id: mkId(),
                time: nowHHMMSS(),
                elapsedTime: timestamps.elapsedTime,
                remainingTime: timestamps.remainingTime,
                type: "ON_ICE_CHANGE",
                playerId: p.id,
                onIce: false,
              });
              return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
            }
            // Log goalie benched event
            newEvents.push({
              id: mkId(),
              time: nowHHMMSS(),
              elapsedTime: timestamps.elapsedTime,
              remainingTime: timestamps.remainingTime,
              type: "ON_ICE_CHANGE",
              playerId: p.id,
              onIce: false,
            });
            return { ...p, onIce: false, enteredAt: null };
          }
          return p;
        }
        if (p.onIce) {
          // Taking player off ice
          if (clock.running && p.enteredAt != null) {
            const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
            return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
          }
          return { ...p, onIce: false, enteredAt: null };
        } else {
          // Putting player on ice
          return { ...p, onIce: true, enteredAt: clock.running ? now : null };
        }
      });
      
      // Log the main player's on-ice change
      const newOnIceState = !playerToToggle.onIce;
      newEvents.push({
        id: mkId(),
        time: nowHHMMSS(),
        elapsedTime: timestamps.elapsedTime,
        remainingTime: timestamps.remainingTime,
        type: "ON_ICE_CHANGE",
        playerId: playerId,
        onIce: newOnIceState,
      });
      
      return { ...match, players: nextPlayers, events: [...match.events, ...newEvents] };
    });
  }

  function applyPlusMinus(usScored) {
    // Show modal to get scorer and assists for both teams
    setPendingGoalUsScored(usScored);
    setShowGoalModal(true);
  }

  function recordGoal(usScored, scorerNumber, assist1Number, assist2Number) {
    updateMatch((match) => {
      const ourOnIce = match.players.filter((p) => p.onIce);
      const goalieOnIce = ourOnIce.find((p) => p.isGoalie);
      const timestamps = getEventTimestamps(match.clock);
      const ev = {
        id: mkId(),
        time: nowHHMMSS(),
        elapsedTime: timestamps.elapsedTime,
        remainingTime: timestamps.remainingTime,
        type: "GOAL",
        scorer: usScored ? "US" : "THEM",
        ourOnIceIds: ourOnIce.map((p) => p.id),
        scorerNumber: scorerNumber || null,
        assist1Number: assist1Number || null,
        assist2Number: assist2Number || null,
      };
      const delta = usScored ? +1 : -1;
      const nextPlayers = match.players.map((p) => {
        if (!ev.ourOnIceIds.includes(p.id)) return p;
        const updated = { ...p, plusMinus: p.plusMinus + delta };
        // If goalie and THEY scored, increment goalsAgainst
        if (p.isGoalie && !usScored) {
          updated.goalsAgainst = (updated.goalsAgainst || 0) + 1;
        }
        return updated;
      });
      
      // Remove ONE minor penalty for the team that scored (early release on goal)
      const scoringTeam = usScored ? "US" : "THEM";
      const penalties = match.penalties || [];
      // Find the first unserved minor penalty for the scoring team
      const penaltyToRelease = penalties.find(p => 
        p.team === scoringTeam && 
        p.type === "Minor" && 
        !p.served
      );
      const nextPenalties = penalties.map(p => {
        // Only mark the first found minor penalty as served
        if (penaltyToRelease && p.id === penaltyToRelease.id) {
          return { ...p, served: true };
        }
        return p;
      });
      
      return { ...match, players: nextPlayers, events: [...match.events, ev], penalties: nextPenalties };
    });
  }

  function handleGoalSave(scorerNumber, assist1Number, assist2Number) {
    recordGoal(pendingGoalUsScored, scorerNumber, assist1Number, assist2Number);
    setShowGoalModal(false);
    setPendingGoalUsScored(false);
  }

  function handleGoalCancel() {
    setShowGoalModal(false);
    setPendingGoalUsScored(false);
  }

  // Penalty management functions
  function addPenalty(penalty) {
    updateMatch((match) => {
      const penalties = match.penalties || [];
      const newPenalties = [...penalties, penalty];
      
      // Check for coincident penalties (same duration, different teams, within 10 seconds)
      const recentPenalties = newPenalties.filter(p => 
        !p.served && 
        Math.abs(p.startTimeMs - penalty.startTimeMs) < 10000 // Within 10 seconds
      );
      
      // Find matching penalty from opposite team with same duration
      const matchingPenalty = recentPenalties.find(p => 
        p.team !== penalty.team && 
        p.duration === penalty.duration &&
        p.id !== penalty.id
      );
      
      // If we found a coincident penalty, mark both as coincident and not affecting strength
      if (matchingPenalty) {
        return {
          ...match,
          penalties: newPenalties.map(p => {
            if (p.id === penalty.id || p.id === matchingPenalty.id) {
              return { ...p, coincident: true, affectsStrength: false };
            }
            return p;
          })
        };
      }
      
      // If penalty affects strength and is for our team, remove player from ice
      let nextPlayers = match.players;
      if (penalty.team === "US" && penalty.affectsStrength) {
        const playerToPenalize = match.players.find(p => p.number === penalty.playerNumber);
        if (playerToPenalize && playerToPenalize.onIce) {
          const now = Date.now();
          const timestamps = getEventTimestamps(match.clock);
          nextPlayers = match.players.map((p) => {
            if (p.id === playerToPenalize.id) {
              // Calculate TOI before removing from ice
              if (match.clock.running && p.enteredAt != null) {
                const delta = Math.max(0, Math.floor((now - p.enteredAt) / 1000));
                return { ...p, onIce: false, enteredAt: null, toiSeconds: (p.toiSeconds || 0) + delta };
              }
              return { ...p, onIce: false, enteredAt: null };
            }
            return p;
          });
          
          // Log the on-ice change event
          const newEvent = {
            id: mkId(),
            time: nowHHMMSS(),
            elapsedTime: timestamps.elapsedTime,
            remainingTime: timestamps.remainingTime,
            type: "ON_ICE_CHANGE",
            playerId: playerToPenalize.id,
            onIce: false,
          };
          return { 
            ...match, 
            players: nextPlayers, 
            penalties: newPenalties,
            events: [...match.events, newEvent]
          };
        }
      }
      
      return { ...match, penalties: newPenalties, players: nextPlayers };
    });
  }

  function removePenalty(penaltyId) {
    updateMatch((match) => {
      const penalties = match.penalties || [];
      return { ...match, penalties: penalties.filter(p => p.id !== penaltyId) };
    });
  }

  function earlyReleasePenalty(penaltyId) {
    updateMatch((match) => {
      const penalties = match.penalties || [];
      return {
        ...match,
        penalties: penalties.map(p =>
          p.id === penaltyId ? { ...p, served: true } : p
        )
      };
    });
  }

  function undoLast() {
    updateMatch((match) => {
      if (!match.events.length) return match;
      const last = match.events[match.events.length - 1];
      if (last.type !== "GOAL") return match;
      const delta = last.scorer === "US" ? -1 : +1;
      const nextPlayers = match.players.map((p) => {
        if (!last.ourOnIceIds.includes(p.id)) return p;
        const updated = { ...p, plusMinus: p.plusMinus + delta };
        // If goalie and THEY scored, decrement goalsAgainst
        if (p.isGoalie && last.scorer === "THEM") {
          updated.goalsAgainst = Math.max(0, (updated.goalsAgainst || 0) - 1);
        }
        return updated;
      });
      return { ...match, players: nextPlayers, events: match.events.slice(0, -1) };
    });
  }

  function exportCSV() {
    if (!currentMatch || !currentTeam) return;
    const rows = [
      ["Match", "Team", "Number", "Name", "Initials", "IsGoalie", "PlusMinus", "OnIce", "TOI", "Shots", "ZoneEntries", "BlockedShots", "Hits", "Takeaways", "Giveaways", "Saves", "GoalsAgainst", "Shutouts", "SavePercentage"],
      ...matchPlayers
        .map((p) => {
          const totalShots = (p.saves || 0) + (p.goalsAgainst || 0);
          const savePct = totalShots > 0 ? ((p.saves || 0) / totalShots * 100).toFixed(2) : "0.00";
          return [
            currentMatch.name,
            currentTeam.name,
            p.number,
            p.name,
            p.initials || "",
            p.isGoalie ? "Yes" : "No",
            p.plusMinus,
            p.onIce ? "Yes" : "No",
            mmss(p.toiSeconds || 0),
            p.shots || 0,
            p.breakaways || 0,
            p.blockedShots || 0,
            p.hits || 0,
            p.takeaways || 0,
            p.giveaways || 0,
            p.saves || 0,
            p.goalsAgainst || 0,
            p.shutouts || 0,
            savePct,
          ];
        })
        .map((r) => r.map(csvEscape).join(",")),
    ];
    const csv = rows.map((r) => (Array.isArray(r) ? r.join(",") : r)).join("\n");
    const safeName = currentMatch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    download(`${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  // Render based on appPhase
  
  // Team selection
  if (appPhase === "team-selection") {
    if (subPhase === "creating-team") {
      return (
        <div className="min-h-screen py-8 px-3 sm:px-6">
          <TeamCreateScreen team={null} onSave={saveTeam} onCancel={cancelTeamCreate} />
        </div>
      );
    }
    return (
      <div className="min-h-screen py-8 px-3 sm:px-6">
        <TeamSelectionScreen 
          teams={teams} 
          onSelectTeam={selectTeam} 
          onCreateTeam={createTeamStart} 
        />
      </div>
    );
  }

  // Match selection
  if (appPhase === "match-selection") {
    if (!currentTeam) {
      // Safety: go back to team selection if no team
      setState({ ...state, appPhase: "team-selection" });
      return null;
    }
    
    if (subPhase === "creating-match") {
      return (
        <div className="min-h-screen py-8 px-3 sm:px-6">
          <MatchCreateScreen 
            team={currentTeam} 
            onSave={saveMatch} 
            onCancel={cancelMatchCreate} 
          />
        </div>
      );
    }
    
    return (
      <div className="min-h-screen py-8 px-3 sm:px-6">
        <MatchSelectionScreen 
          matches={matches} 
          team={currentTeam} 
          onSelectMatch={selectMatch} 
          onCreateMatch={createMatchStart} 
          onBack={backToTeamSelection} 
        />
      </div>
    );
  }

  // Match phase - show ice manager and stats views
  if (appPhase === "match") {
    if (!currentMatch || !currentTeam) {
      // Safety: go back to match selection if no match
      setState({ ...state, appPhase: "match-selection" });
      return null;
    }

    // Create a temporary team object for components that expect it
    const tempTeam = {
      ...currentTeam,
      players: matchPlayers,
    };

    // Calculate on-ice status
    const ourOnIce = matchPlayers.filter((p) => p.onIce);
    const overCap = ourOnIce.length > (currentTeam?.onIceCap || 6);

    // Calculate score from events
    const scoreUs = events.filter((e) => e.type === "GOAL" && e.scorer === "US").length;
    const scoreThem = events.filter((e) => e.type === "GOAL" && e.scorer === "THEM").length;
    const ourTeamName = currentMatch?.ourTeamName || "Us";
    const opponentTeamName = currentMatch?.opponentTeamName || "Them";

    return (
    <div className="min-h-screen pb-28 px-3 sm:px-6 max-w-5xl mx-auto">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="px-3 sm:px-6 py-3">
          {/* Top row: Title, Score, Clock, Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold">{currentMatch.name}</h1>
                <div className="text-xs text-gray-500">{currentTeam.name}</div>
              </div>
              
              {/* Score Display */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-50 to-red-50 border-2 border-gray-200 shadow-sm">
                <div className="text-center min-w-[40px]">
                  <div className="text-[10px] sm:text-xs text-gray-600 font-medium">{ourTeamName}</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-700">{scoreUs}</div>
                </div>
                <div className="text-gray-400 mx-0.5 sm:mx-1 text-lg sm:text-xl">-</div>
                <div className="text-center min-w-[40px]">
                  <div className="text-[10px] sm:text-xs text-gray-600 font-medium">{opponentTeamName}</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-700">{scoreThem}</div>
                </div>
              </div>
              
              <Chrono 
                clock={clock} 
                onStartClock={handleStartClock} 
                onPauseClock={handlePauseClock}
                onResetClock={handleResetClock}
                onSetCountdown={handleSetCountdown}
                onNewPeriod={handleNewPeriod}
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="px-3 py-2 rounded-lg border text-sm hidden sm:block">
                {t("export")}
              </button>
              <button onClick={endMatch} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                {t("endMatch")}
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView("main")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === "main"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏒 {t("iceManager")}
            </button>
            <button
              onClick={() => setCurrentView("myplayers")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === "myplayers"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⭐ {t("myPlayers")} {myPlayerIds.length > 0 && `(${myPlayerIds.length})`}
            </button>
            <button
              onClick={() => setCurrentView("stats")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === "stats"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📊 {t("allStats")}
            </button>
            <button
              onClick={() => setCurrentView("penalties")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === "penalties"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⚖️ {t("penalties")}
            </button>
          </div>
        </div>
      </header>

      <main className="mt-4">
        {currentView === "main" ? (
          /* Main View - Simple On/Off Management */
          <section className="rounded-2xl border p-4 bg-white">
            <SimpleRosterView team={tempTeam} updateTeam={updateMatchPlayers} clock={clock} togglePlayerOnIce={togglePlayerOnIce} penalties={currentMatch?.penalties || []} />
          </section>
        ) : currentView === "myplayers" ? (
          /* My Players View - Track specific players' stats */
          <section className="rounded-2xl border p-4 bg-white">
            <MyPlayersView 
              team={tempTeam} 
              myPlayerIds={myPlayerIds}
              onToggleMyPlayer={toggleMyPlayer}
              updatePlayerStat={updatePlayerStat}
              togglePlayerOnIce={togglePlayerOnIce}
              clock={clock}
            />
          </section>
        ) : currentView === "penalties" ? (
          /* Penalties View - Penalty Box Management */
          <section className="rounded-2xl border p-4 bg-white">
            <PenaltyManagement
              match={currentMatch}
              clock={clock}
              onAddPenalty={addPenalty}
              onRemovePenalty={removePenalty}
              onEarlyRelease={earlyReleasePenalty}
              ourTeamName={ourTeamName}
              opponentTeamName={opponentTeamName}
            />
          </section>
        ) : (
          /* Stats View - Detailed with all stats */
          <>
            <section className="rounded-2xl border p-4 mb-4">
              <PlayerTimeline players={matchPlayers} events={events} ourTeamName={ourTeamName} opponentTeamName={opponentTeamName} />
            </section>

            <section className="rounded-2xl border p-4 mb-4">
              <Leaderboard players={matchPlayers} />
            </section>

            <section className="rounded-2xl border p-3 mb-4">
              <TeamPanel team={tempTeam} clock={clock} />
            </section>

            <section className="rounded-2xl border p-3">
              <h2 className="text-lg font-semibold mb-2">Event log</h2>
              <EventLog events={events} players={matchPlayers} ourTeamName={ourTeamName} opponentTeamName={opponentTeamName} />
            </section>
          </>
        )}
      </main>

      <GoalInputModal
        isOpen={showGoalModal}
        onClose={handleGoalCancel}
        onSave={handleGoalSave}
        players={pendingGoalUsScored ? matchPlayers : []} // Only show player list for our team
        teamName={pendingGoalUsScored ? ourTeamName : opponentTeamName}
        penalties={currentMatch?.penalties || []}
        team={pendingGoalUsScored ? "US" : "THEM"}
      />

      <ControlsBar
        goalUs={() => applyPlusMinus(true)}
        goalThem={() => applyPlusMinus(false)}
        undo={undoLast}
        canUndo={events.length > 0}
        ourTeamName={ourTeamName}
        opponentTeamName={opponentTeamName}
      />

      {/* Helper note */}
      <div className="fixed bottom-20 left-0 right-0 mx-3 sm:mx-auto sm:max-w-xl text-center pointer-events-none">
        {overCap && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm shadow">
            Over the on-ice cap — adjust before recording.
          </div>
        )}
      </div>

      {/* Version footer */}
      <div className="fixed bottom-2 right-4 text-xs text-gray-400 pointer-events-none">
        v{APP_VERSION}
      </div>
    </div>
    );
  }

  // Default: should never reach here
  return null;
}

// Wrap App with LanguageProvider
export default function AppWithProvider() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
