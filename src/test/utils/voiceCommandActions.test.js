import { describe, it, expect, vi } from 'vitest';
import { createVoiceCommandActions, createVoiceCommandContext } from '../../utils/voiceCommandActions';

describe('Voice Command Actions', () => {
  const mockPlayers = [
    { id: 'p1', number: '1', name: 'Player One', onIce: true },
    { id: 'p2', number: '2', name: 'Player Two', onIce: false },
    { id: 'p3', number: '12', name: 'Player Twelve', onIce: true },
  ];

  const mockContext = {
    clock: { elapsedMs: 60000, running: true },
    match: { id: 'm1' }
  };

  describe('findPlayerByNumber', () => {
    it('should find player by number', () => {
      const actions = createVoiceCommandActions({ players: mockPlayers });
      
      const player = actions.findPlayerByNumber(1);
      expect(player).toBeDefined();
      expect(player.number).toBe('1');
      expect(player.name).toBe('Player One');
    });

    it('should handle string and number inputs', () => {
      const actions = createVoiceCommandActions({ players: mockPlayers });
      
      expect(actions.findPlayerByNumber('1').id).toBe('p1');
      expect(actions.findPlayerByNumber(1).id).toBe('p1');
      expect(actions.findPlayerByNumber('12').id).toBe('p3');
      expect(actions.findPlayerByNumber(12).id).toBe('p3');
    });

    it('should return undefined for non-existent player', () => {
      const actions = createVoiceCommandActions({ players: mockPlayers });
      
      const player = actions.findPlayerByNumber(99);
      expect(player).toBeUndefined();
    });
  });

  describe('toggleMultiplePlayersOnIce', () => {
    it('should call toggleMultiplePlayersOnIce with correct parameters', () => {
      const mockToggle = vi.fn();
      const actions = createVoiceCommandActions({ 
        toggleMultiplePlayersOnIce: mockToggle,
        players: mockPlayers 
      });
      
      actions.toggleMultiplePlayersOnIce(['p1', 'p2'], true);
      
      expect(mockToggle).toHaveBeenCalledWith(['p1', 'p2'], true);
    });
  });

  describe('recordGoal', () => {
    it('should call recordGoal with correct parameters', () => {
      const mockRecordGoal = vi.fn();
      const actions = createVoiceCommandActions({ 
        recordGoal: mockRecordGoal,
        players: mockPlayers 
      });
      
      actions.recordGoal(true, 7, 12, 3);
      
      expect(mockRecordGoal).toHaveBeenCalledWith(true, 7, 12, 3);
    });
  });

  describe('addPenalty', () => {
    it('should create penalty with correct timing from context', () => {
      const mockAddPenalty = vi.fn();
      const actions = createVoiceCommandActions({ 
        addPenalty: mockAddPenalty,
        players: mockPlayers 
      }, mockContext);
      
      actions.addPenalty({
        playerNumber: 1,
        duration: 2,
        reason: 'hooking'
      }, mockContext);
      
      expect(mockAddPenalty).toHaveBeenCalled();
      const penalty = mockAddPenalty.mock.calls[0][0];
      
      expect(penalty.playerNumber).toBe(1);
      expect(penalty.type).toBe('Minor');
      expect(penalty.duration).toBe(2);
      expect(penalty.durationMs).toBe(120000);
      expect(penalty.infraction).toBe('hooking');
      expect(penalty.startTimeMs).toBe(60000); // From context
      expect(penalty.team).toBe('US');
      expect(penalty.served).toBe(false);
      expect(penalty.affectsStrength).toBe(true);
    });

    it('should map duration to penalty type', () => {
      const mockAddPenalty = vi.fn();
      const actions = createVoiceCommandActions({ 
        addPenalty: mockAddPenalty,
        players: mockPlayers 
      }, mockContext);
      
      // Minor
      actions.addPenalty({ playerNumber: 1, duration: 2 }, mockContext);
      expect(mockAddPenalty.mock.calls[0][0].type).toBe('Minor');
      
      // Double Minor
      actions.addPenalty({ playerNumber: 1, duration: 4 }, mockContext);
      expect(mockAddPenalty.mock.calls[1][0].type).toBe('Double Minor');
      
      // Major
      actions.addPenalty({ playerNumber: 1, duration: 5 }, mockContext);
      expect(mockAddPenalty.mock.calls[2][0].type).toBe('Major');
      
      // Misconduct
      actions.addPenalty({ playerNumber: 1, duration: 10 }, mockContext);
      expect(mockAddPenalty.mock.calls[3][0].type).toBe('Misconduct');
    });

    it('should default to 2 minutes if no duration', () => {
      const mockAddPenalty = vi.fn();
      const actions = createVoiceCommandActions({ 
        addPenalty: mockAddPenalty,
        players: mockPlayers 
      }, mockContext);
      
      actions.addPenalty({ playerNumber: 1 }, mockContext);
      
      const penalty = mockAddPenalty.mock.calls[0][0];
      expect(penalty.duration).toBe(2);
      expect(penalty.durationMs).toBe(120000);
    });
  });

  describe('clock controls', () => {
    it('should start clock', () => {
      const mockStartClock = vi.fn();
      const actions = createVoiceCommandActions({ 
        startClock: mockStartClock,
        players: mockPlayers 
      });
      
      actions.startClock();
      expect(mockStartClock).toHaveBeenCalled();
    });

    it('should pause clock', () => {
      const mockPauseClock = vi.fn();
      const actions = createVoiceCommandActions({ 
        pauseClock: mockPauseClock,
        players: mockPlayers 
      });
      
      actions.pauseClock();
      expect(mockPauseClock).toHaveBeenCalled();
    });

    it('should set clock time', () => {
      const mockSetClockTime = vi.fn();
      const actions = createVoiceCommandActions({ 
        setClockTime: mockSetClockTime,
        players: mockPlayers 
      });
      
      actions.setClockTime(300000); // 5 minutes
      expect(mockSetClockTime).toHaveBeenCalledWith(300000);
    });
  });

  describe('createVoiceCommandContext', () => {
    it('should create context with players and match info', () => {
      const context = createVoiceCommandContext({
        players: mockPlayers,
        match: { id: 'm1' },
        clock: { elapsedMs: 60000 }
      });
      
      expect(context.players).toEqual(mockPlayers);
      expect(context.clock.elapsedMs).toBe(60000);
      expect(context.onIcePlayers).toHaveLength(2);
      expect(context.availableNumbers).toEqual(['1', '2', '12']);
      expect(context.matchActive).toBe(true);
    });

    it('should handle empty players array', () => {
      const context = createVoiceCommandContext({
        players: [],
        match: null
      });
      
      expect(context.players).toEqual([]);
      expect(context.onIcePlayers).toEqual([]);
      expect(context.availableNumbers).toEqual([]);
      expect(context.matchActive).toBe(false);
    });
  });
});

