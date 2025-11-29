import { useState, useEffect, useCallback } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';
import { interpretCommand } from '../utils/commandInterpreter';
import { interpretCommandWithLLM } from '../utils/llmInterpreter';
import { hasApiKey } from '../utils/encryption';

/**
 * Voice Commands Hook - Integrates voice recognition with app actions
 * 
 * This hook connects the voice recognition and interpretation layers
 * to the actual app state management functions.
 * 
 * @param {Object} actions - Object containing app action functions
 * @param {Object} context - App context (players, match state, etc.)
 * @param {boolean} useLLM - Whether to use LLM interpretation
 * @returns {Object} - Voice command state and controls
 */
export function useVoiceCommands(actions, context = {}, useLLM = true) {
  const voiceRecognition = useVoiceRecognition();
  const [commandHistory, setCommandHistory] = useState([]);
  const [lastCommand, setLastCommand] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: string }
  const [needsPassword, setNeedsPassword] = useState(!hasApiKey());

  // Show feedback temporarily
  const showFeedback = useCallback((type, message, duration = 3000) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), duration);
  }, []);

  // Execute command based on interpreted intent and entities
  const executeCommand = useCallback(async (interpretation) => {
    console.log('[VoiceCmd] Executing command:', interpretation);
    
    if (!interpretation.success) {
      console.log('[VoiceCmd] Interpretation failed:', interpretation.error);
      showFeedback('error', interpretation.error);
      return { success: false, error: interpretation.error };
    }

    setIsExecuting(true);
    try {
      const { intent, entities } = interpretation;
      console.log('[VoiceCmd] Intent:', intent, 'Entities:', entities);
      let result = { success: true, message: '' };

      switch (intent) {
        case 'player_on_ice': {
          const playerNumbers = entities.players || [];
          console.log('[VoiceCmd] Looking for players:', playerNumbers);
          let playerIdsToAdd = [];
          let addedPlayers = [];
          let errors = [];

          // First, collect all player IDs (validation phase)
          for (const num of playerNumbers) {
            console.log('[VoiceCmd] Finding player #', num);
            const player = actions.findPlayerByNumber(num);
            console.log('[VoiceCmd] Found player:', player);
            if (player) {
              if (!player.onIce) {
                playerIdsToAdd.push(player.id);
                addedPlayers.push(`#${num}`);
              } else {
                console.log('[VoiceCmd] Player already on ice:', player.number);
              }
            } else {
              console.error('[VoiceCmd] Player not found:', num);
              // Suggest similar numbers (off by 10, or single digit from double digit)
              const availableNums = context.players?.map(p => parseInt(p.number)) || [];
              const similar = availableNums.filter(n => 
                n === num % 10 || // 11 → 1
                n === Math.floor(num / 10) || // 11 → 1  
                n === num - 10 || // 11 → 1
                n === num + 10 // 1 → 11
              );
              
              if (similar.length > 0) {
                errors.push(`#${num} not found. Did you mean: ${similar.map(n => `#${n}`).join(', ')}?`);
              } else {
                const closest = availableNums.sort((a, b) => 
                  Math.abs(a - num) - Math.abs(b - num)
                ).slice(0, 3);
                errors.push(`#${num} not found. Available: ${closest.map(n => `#${n}`).join(', ')}`);
              }
            }
          }

          // Now toggle all players at once (batched update)
          if (playerIdsToAdd.length > 0) {
            console.log('[VoiceCmd] Adding players to ice (batched):', playerIdsToAdd);
            if (actions.toggleMultiplePlayersOnIce) {
              // Use batch function if available
              actions.toggleMultiplePlayersOnIce(playerIdsToAdd);
            } else {
              // Fallback: toggle one by one with proper state chaining
              for (const playerId of playerIdsToAdd) {
                console.log('[VoiceCmd] Adding player to ice:', playerId);
                actions.togglePlayerOnIce(playerId);
              }
            }
          }

          if (addedPlayers.length > 0) {
            result.message = `${addedPlayers.join(', ')} on ice`;
            showFeedback('success', result.message);
          }
          if (errors.length > 0) {
            result.success = false;
            result.message = errors.join(', ');
            showFeedback('error', result.message);
          }
          break;
        }

        case 'player_off_ice': {
          const playerNumbers = entities.players || [];
          let playerIdsToRemove = [];
          let removedPlayers = [];
          let errors = [];

          // First, collect all player IDs (validation phase)
          for (const num of playerNumbers) {
            const player = actions.findPlayerByNumber(num);
            if (player) {
              if (player.onIce) {
                playerIdsToRemove.push(player.id);
                removedPlayers.push(`#${num}`);
              }
            } else {
              errors.push(`Player #${num} not found`);
            }
          }

          // Now toggle all players at once (batched update)
          if (playerIdsToRemove.length > 0) {
            console.log('[VoiceCmd] Removing players from ice (batched):', playerIdsToRemove);
            if (actions.toggleMultiplePlayersOnIce) {
              actions.toggleMultiplePlayersOnIce(playerIdsToRemove);
            } else {
              for (const playerId of playerIdsToRemove) {
                actions.togglePlayerOnIce(playerId);
              }
            }
          }

          if (removedPlayers.length > 0) {
            result.message = `${removedPlayers.join(', ')} off ice`;
            showFeedback('success', result.message);
          }
          if (errors.length > 0) {
            result.success = false;
            result.message = errors.join(', ');
            showFeedback('error', result.message);
          }
          break;
        }

        case 'goal_us': {
          const scorer = entities.scorer;
          const assist1 = entities.assist1 || null;
          const assist2 = entities.assist2 || null;

          console.log('[VoiceCmd] Goal - Scorer:', scorer, 'A1:', assist1, 'A2:', assist2);

          if (!scorer) {
            result.success = false;
            result.message = 'Scorer number required';
            showFeedback('error', result.message);
            break;
          }

          // Validate scorer exists
          const scorerPlayer = actions.findPlayerByNumber(scorer);
          if (!scorerPlayer) {
            result.success = false;
            result.message = `Player #${scorer} not found in roster`;
            showFeedback('error', result.message);
            break;
          }

          // Validate assists exist
          if (assist1) {
            const assist1Player = actions.findPlayerByNumber(assist1);
            if (!assist1Player) {
              result.success = false;
              result.message = `Assistant #${assist1} not found in roster`;
              showFeedback('error', result.message);
              break;
            }
          }
          
          if (assist2) {
            const assist2Player = actions.findPlayerByNumber(assist2);
            if (!assist2Player) {
              result.success = false;
              result.message = `Assistant #${assist2} not found in roster`;
              showFeedback('error', result.message);
              break;
            }
          }

          console.log('[VoiceCmd] Recording goal for us');
          actions.recordGoal(true, scorer, assist1, assist2);
          result.message = `Goal by #${scorer}${assist1 ? ` (A: #${assist1}${assist2 ? `, #${assist2}` : ''})` : ''}`;
          showFeedback('success', result.message);
          break;
        }

        case 'goal_them': {
          console.log('[VoiceCmd] Recording goal for them');
          actions.recordGoal(false, null, null, null);
          result.message = 'Opponent goal recorded';
          showFeedback('success', result.message);
          break;
        }

        case 'shot': {
          const playerNum = entities.player;
          console.log('[VoiceCmd] Shot by player:', playerNum);
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            console.error('[VoiceCmd] Player not found');
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            console.warn('[VoiceCmd] Player not on ice');
            showFeedback('error', result.message);
            break;
          }

          console.log('[VoiceCmd] Recording shot for player:', player.number);
          actions.updatePlayerStat(player.id, 'shots', 1);
          result.message = `Shot by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'block': {
          const playerNum = entities.player;
          console.log('[VoiceCmd] Block - Player:', playerNum);
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            console.warn('[VoiceCmd] Player not found');
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            console.warn('[VoiceCmd] Player not on ice');
            showFeedback('error', result.message);
            break;
          }

          console.log('[VoiceCmd] Recording block for player:', player.number);
          actions.updatePlayerStat(player.id, 'blocks', 1);
          result.message = `Block by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'hit': {
          const playerNum = entities.player;
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            showFeedback('error', result.message);
            break;
          }

          actions.updatePlayerStat(player.id, 'hits', 1);
          result.message = `Hit by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'zone_entry': {
          const playerNum = entities.player;
          console.log('[VoiceCmd] Zone entry - Player:', playerNum);
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            console.warn('[VoiceCmd] Player not found');
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            console.warn('[VoiceCmd] Player not on ice');
            showFeedback('error', result.message);
            break;
          }

          console.log('[VoiceCmd] Recording zone entry for player:', player.number);
          actions.updatePlayerStat(player.id, 'zoneEntries', 1);
          result.message = `Zone entry by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'takeaway': {
          const playerNum = entities.player;
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            showFeedback('error', result.message);
            break;
          }

          actions.updatePlayerStat(player.id, 'takeaways', 1);
          result.message = `Takeaway by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'giveaway': {
          const playerNum = entities.player;
          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            showFeedback('error', result.message);
            break;
          }

          if (!player.onIce) {
            result.success = false;
            result.message = `Player #${playerNum} must be on ice`;
            showFeedback('error', result.message);
            break;
          }

          actions.updatePlayerStat(player.id, 'giveaways', 1);
          result.message = `Giveaway by #${playerNum}`;
          showFeedback('success', result.message);
          break;
        }

        case 'start_clock': {
          console.log('[VoiceCmd] Starting clock');
          if (actions.startClock) {
            actions.startClock();
            result.message = 'Clock started';
            showFeedback('success', result.message);
          } else {
            result.success = false;
            result.message = 'Clock control not available';
            showFeedback('error', result.message);
          }
          break;
        }

        case 'pause_clock': {
          console.log('[VoiceCmd] Pausing clock');
          if (actions.pauseClock) {
            actions.pauseClock();
            result.message = 'Clock paused';
            showFeedback('success', result.message);
          } else {
            result.success = false;
            result.message = 'Clock control not available';
            showFeedback('error', result.message);
          }
          break;
        }

        case 'set_clock': {
          const timestamp = entities.timestamp;
          console.log('[VoiceCmd] Setting clock to:', timestamp);

          if (!timestamp) {
            result.success = false;
            result.message = 'Time required (format: MM:SS)';
            showFeedback('error', result.message);
            break;
          }

          // Parse timestamp MM:SS to milliseconds
          const parts = timestamp.split(':');
          let totalSeconds = 0;
          
          if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            totalSeconds = minutes * 60 + seconds;
          } else if (parts.length === 1) {
            // Just seconds
            totalSeconds = parseInt(parts[0]) || 0;
          }

          const milliseconds = totalSeconds * 1000;

          if (actions.setClockTime) {
            console.log('[VoiceCmd] Setting clock to', totalSeconds, 'seconds (', milliseconds, 'ms)');
            actions.setClockTime(milliseconds);
            result.message = `Clock set to ${timestamp}`;
            showFeedback('success', result.message);
          } else {
            result.success = false;
            result.message = 'Clock control not available';
            showFeedback('error', result.message);
          }
          break;
        }

        case 'penalty': {
          const playerNum = entities.player;
          const duration = entities.duration || 2; // Default 2 minutes
          const reason = entities.reason || 'other';
          const timestamp = entities.timestamp || null;

          console.log('[VoiceCmd] Penalty - Player:', playerNum, 'Duration:', duration, 'Reason:', reason, 'Time:', timestamp);

          if (!playerNum) {
            result.success = false;
            result.message = 'Player number required for penalty';
            showFeedback('error', result.message);
            break;
          }

          const player = actions.findPlayerByNumber(playerNum);
          
          if (!player) {
            result.success = false;
            result.message = `Player #${playerNum} not found`;
            showFeedback('error', result.message);
            break;
          }

          if (actions.addPenalty) {
            console.log('[VoiceCmd] Adding penalty');
            actions.addPenalty({
              playerNumber: playerNum,
              duration,
              reason,
              timestamp
            });
            result.message = `${duration} min penalty for #${playerNum} (${reason})${timestamp ? ` at ${timestamp}` : ''}`;
            showFeedback('success', result.message);
          } else {
            result.success = false;
            result.message = 'Penalty system not available';
            showFeedback('error', result.message);
          }
          break;
        }

        default:
          result.success = false;
          result.message = `Unknown intent: ${intent}`;
          showFeedback('error', result.message);
      }

      return result;
    } catch (error) {
      console.error('Command execution error:', error);
      showFeedback('error', error.message);
      return { success: false, error: error.message };
    } finally {
      setIsExecuting(false);
    }
  }, [actions, showFeedback]);

  // Process transcript when it changes
  useEffect(() => {
    if (voiceRecognition.transcript && voiceRecognition.transcript.trim().length > 0) {
      console.log('[VoiceCmd] New transcript received:', voiceRecognition.transcript);
      
      const processCommand = async () => {
        const currentTranscript = voiceRecognition.transcript;
        
        // Clear transcript immediately to prevent re-processing
        voiceRecognition.clearTranscript();
        
        console.log('[VoiceCmd] Processing transcript:', currentTranscript);
        
        // Interpret the command
        let interpretation;
        if (useLLM) {
          console.log('[VoiceCmd] Using LLM interpretation');
          interpretation = await interpretCommandWithLLM(currentTranscript, context);
        } else {
          console.log('[VoiceCmd] Using fuzzy interpretation');
          interpretation = interpretCommand(currentTranscript, context);
        }

        console.log('[VoiceCmd] Interpretation result:', interpretation);

        setLastCommand({
          timestamp: new Date().toLocaleTimeString(),
          transcript: currentTranscript,
          interpretation,
          usedLLM: useLLM
        });

        // Execute the command
        const result = await executeCommand(interpretation);
        
        console.log('[VoiceCmd] Execution result:', result);

        // Add to history
        setCommandHistory(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            transcript: currentTranscript,
            interpretation,
            result,
            usedLLM: useLLM
          },
          ...prev.slice(0, 19) // Keep last 20
        ]);
      };

      processCommand();
    }
  }, [voiceRecognition.transcript]); // Only depend on transcript, not context or useLLM to avoid re-processing

  return {
    ...voiceRecognition,
    commandHistory,
    lastCommand,
    isExecuting,
    feedback,
    clearFeedback: () => setFeedback(null),
    clearHistory: () => setCommandHistory([]),
    needsPassword,
    setNeedsPassword
  };
}

