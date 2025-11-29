/**
 * Voice Command Actions
 * 
 * This module provides helper functions to create the actions object
 * needed by the VoiceCommandWidget. It acts as an adapter between
 * voice commands and the main app's state management.
 */

/**
 * Create voice command actions from app functions and state
 * 
 * @param {Object} params - Parameters object
 * @param {Function} params.togglePlayerOnIce - Function to toggle player on/off ice
 * @param {Function} params.recordGoal - Function to record a goal
 * @param {Function} params.updatePlayerStat - Function to update player stats
 * @param {Function} params.startClock - Function to start the game clock
 * @param {Function} params.pauseClock - Function to pause the game clock
 * @param {Function} params.setClockTime - Function to set clock to specific time
 * @param {Function} params.addPenalty - Function to add a penalty
 * @param {Array} params.players - Array of player objects
 * @returns {Object} Actions object for voice commands
 */
export function createVoiceCommandActions({
  togglePlayerOnIce,
  toggleMultiplePlayersOnIce,
  recordGoal,
  updatePlayerStat,
  startClock,
  pauseClock,
  setClockTime,
  addPenalty,
  players = []
}, context = {}) {
  return {
    /**
     * Find a player by their jersey number
     */
    findPlayerByNumber: (number) => {
      const numInt = parseInt(number);
      console.log('[Actions] Finding player with number:', number, '(parsed:', numInt, ')');
      console.log('[Actions] Available players:', players.map(p => ({ id: p.id, number: p.number, name: p.name })));
      
      // Handle both string and integer player numbers with loose equality
      const found = players.find(p => {
        const playerNum = parseInt(p.number);
        console.log('[Actions] Comparing:', playerNum, '===', numInt, '?', playerNum === numInt);
        return playerNum === numInt;
      });
      
      console.log('[Actions] Found:', found ? `${found.name} (#${found.number})` : 'NOT FOUND');
      return found;
    },

    /**
     * Toggle player on/off ice
     */
    togglePlayerOnIce: (playerId) => {
      togglePlayerOnIce(playerId);
    },

    /**
     * Toggle multiple players on/off ice at once (batched update)
     * This prevents React state batching issues when adding multiple players
     */
    toggleMultiplePlayersOnIce: toggleMultiplePlayersOnIce ? (playerIds) => {
      console.log('[Actions] Toggling multiple players (batched):', playerIds);
      toggleMultiplePlayersOnIce(playerIds);
    } : null,

    /**
     * Record a goal
     * @param {boolean} usScored - true if we scored, false if opponent scored
     * @param {number} scorerNumber - Scorer's jersey number
     * @param {number} assist1Number - First assist's jersey number (optional)
     * @param {number} assist2Number - Second assist's jersey number (optional)
     */
    recordGoal: (usScored, scorerNumber, assist1Number, assist2Number) => {
      recordGoal(usScored, scorerNumber, assist1Number, assist2Number);
    },

    /**
     * Update a player's stat
     * @param {string} playerId - Player's ID
     * @param {string} stat - Stat name (shots, blocks, hits, etc.)
     * @param {number} delta - Amount to change (+1, -1, etc.)
     */
    updatePlayerStat: (playerId, stat, delta) => {
      updatePlayerStat(playerId, stat, delta);
    },

    /**
     * Start the game clock
     */
    startClock: startClock ? () => {
      console.log('[Actions] Starting clock');
      startClock();
    } : null,

    /**
     * Pause the game clock
     */
    pauseClock: pauseClock ? () => {
      console.log('[Actions] Pausing clock');
      pauseClock();
    } : null,

    /**
     * Set clock to specific time
     * @param {number} milliseconds - Time in milliseconds
     */
    setClockTime: setClockTime ? (milliseconds) => {
      console.log('[Actions] Setting clock to:', milliseconds, 'ms');
      setClockTime(milliseconds);
    } : null,

    /**
     * Add a penalty
     * @param {Object} penalty - Penalty details
     */
    addPenalty: addPenalty ? (penaltyInfo) => {
      console.log('[Actions] Adding penalty:', penaltyInfo);
      
      // Create properly formatted penalty object
      // ✅ Use match elapsed time, not Date.now()!
      const currentMatchTime = context?.clock?.elapsedMs || 0;
      const durationMap = {
        2: 'Minor',
        4: 'Double Minor', 
        5: 'Major',
        10: 'Misconduct',
        20: 'Match Penalty'
      };
      
      const durationMinutes = penaltyInfo.duration || 2;
      const durationMs = durationMinutes * 60 * 1000; // Convert minutes to milliseconds
      
      const penalty = {
        id: 'p' + Math.random().toString(36).substr(2, 9),
        playerNumber: penaltyInfo.playerNumber,
        type: durationMap[durationMinutes] || 'Minor',
        infraction: penaltyInfo.reason || 'other',
        duration: durationMinutes,
        durationMs: durationMs,
        team: 'US', // Assuming it's always for our team from voice commands
        startTimeMs: currentMatchTime, // ✅ Use match time, not Date.now()!
        served: false,
        affectsStrength: true,
        coincident: false
      };
      
      console.log('[Actions] Penalty startTimeMs:', currentMatchTime, 'Duration:', durationMs);
      
      console.log('[Actions] Formatted penalty:', penalty);
      addPenalty(penalty);
    } : null
  };
}

/**
 * Create context object for voice commands
 * Provides additional information that might be useful for interpretation
 * 
 * @param {Object} params - Parameters object
 * @param {Array} params.players - Array of player objects
 * @param {Object} params.match - Current match object
 * @returns {Object} Context object
 */
export function createVoiceCommandContext({
  players = [],
  match = null
}) {
  return {
    players,
    onIcePlayers: players.filter(p => p.onIce),
    availableNumbers: players.map(p => p.number),
    matchActive: !!match
  };
}

