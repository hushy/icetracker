import { describe, it, expect } from 'vitest';

describe('Events and Undo Logic', () => {
  describe('addEvent', () => {
    const addEvent = (events, event) => {
      const newEvent = {
        ...event,
        id: `evt_${Date.now()}`,
        timestamp: Date.now()
      };
      return [...events, newEvent];
    };

    it('should add a goal event', () => {
      const events = [];
      const goalEvent = {
        type: 'goal',
        team: 'US',
        scorer: 7,
        assists: [12, 3],
        matchTime: 120000
      };
      
      const result = addEvent(events, goalEvent);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('goal');
      expect(result[0].scorer).toBe(7);
      expect(result[0].id).toBeDefined();
      expect(result[0].timestamp).toBeDefined();
    });

    it('should add a penalty event', () => {
      const events = [];
      const penaltyEvent = {
        type: 'penalty',
        team: 'US',
        player: 5,
        duration: 2,
        reason: 'hooking',
        matchTime: 60000
      };
      
      const result = addEvent(events, penaltyEvent);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('penalty');
      expect(result[0].player).toBe(5);
    });

    it('should preserve existing events', () => {
      const events = [
        { id: 'evt1', type: 'goal', timestamp: 100 }
      ];
      
      const newEvent = {
        type: 'penalty',
        player: 5
      };
      
      const result = addEvent(events, newEvent);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('evt1');
    });
  });

  describe('undoLastEvent', () => {
    const undoLastEvent = (events) => {
      if (events.length === 0) return events;
      return events.slice(0, -1);
    };

    it('should remove last event', () => {
      const events = [
        { id: 'evt1', type: 'goal' },
        { id: 'evt2', type: 'penalty' }
      ];
      
      const result = undoLastEvent(events);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('evt1');
    });

    it('should handle empty events array', () => {
      const events = [];
      const result = undoLastEvent(events);
      
      expect(result).toHaveLength(0);
    });

    it('should allow multiple undos', () => {
      const events = [
        { id: 'evt1', type: 'goal' },
        { id: 'evt2', type: 'penalty' },
        { id: 'evt3', type: 'shot' }
      ];
      
      let result = undoLastEvent(events);
      expect(result).toHaveLength(2);
      
      result = undoLastEvent(result);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('evt1');
    });
  });

  describe('getEventsByType', () => {
    const getEventsByType = (events, type) => {
      return events.filter(e => e.type === type);
    };

    it('should filter goals', () => {
      const events = [
        { id: 'evt1', type: 'goal' },
        { id: 'evt2', type: 'penalty' },
        { id: 'evt3', type: 'goal' }
      ];
      
      const result = getEventsByType(events, 'goal');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('evt1');
      expect(result[1].id).toBe('evt3');
    });

    it('should filter penalties', () => {
      const events = [
        { id: 'evt1', type: 'goal' },
        { id: 'evt2', type: 'penalty' },
        { id: 'evt3', type: 'penalty' }
      ];
      
      const result = getEventsByType(events, 'penalty');
      
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no matches', () => {
      const events = [
        { id: 'evt1', type: 'goal' }
      ];
      
      const result = getEventsByType(events, 'penalty');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getEventsByPlayer', () => {
    const getEventsByPlayer = (events, playerNumber) => {
      return events.filter(e => {
        if (e.type === 'goal') {
          return e.scorer === playerNumber || 
                 e.assists?.includes(playerNumber);
        }
        if (e.type === 'penalty') {
          return e.player === playerNumber;
        }
        if (e.type === 'shot' || e.type === 'block' || e.type === 'zone_entry') {
          return e.player === playerNumber;
        }
        return false;
      });
    };

    it('should find goals by scorer', () => {
      const events = [
        { type: 'goal', scorer: 7, assists: [12] },
        { type: 'goal', scorer: 12, assists: [7] }
      ];
      
      const result = getEventsByPlayer(events, 7);
      
      expect(result).toHaveLength(2); // Both as scorer and assistant
    });

    it('should find goals by assists', () => {
      const events = [
        { type: 'goal', scorer: 7, assists: [12, 3] },
        { type: 'goal', scorer: 5, assists: [7] }
      ];
      
      const result = getEventsByPlayer(events, 12);
      
      expect(result).toHaveLength(1);
      expect(result[0].scorer).toBe(7);
    });

    it('should find penalties by player', () => {
      const events = [
        { type: 'penalty', player: 5 },
        { type: 'penalty', player: 7 }
      ];
      
      const result = getEventsByPlayer(events, 5);
      
      expect(result).toHaveLength(1);
      expect(result[0].player).toBe(5);
    });

    it('should find multiple event types for player', () => {
      const events = [
        { type: 'goal', scorer: 7 },
        { type: 'penalty', player: 7 },
        { type: 'shot', player: 7 },
        { type: 'block', player: 7 }
      ];
      
      const result = getEventsByPlayer(events, 7);
      
      expect(result).toHaveLength(4);
    });
  });

  describe('getTimelineEvents', () => {
    const getTimelineEvents = (events) => {
      return events
        .sort((a, b) => a.matchTime - b.matchTime)
        .map(e => ({
          ...e,
          displayTime: formatMatchTime(e.matchTime)
        }));
    };

    const formatMatchTime = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    it('should sort events by match time', () => {
      const events = [
        { id: 'evt1', matchTime: 180000 }, // 3:00
        { id: 'evt2', matchTime: 60000 },  // 1:00
        { id: 'evt3', matchTime: 120000 }  // 2:00
      ];
      
      const result = getTimelineEvents(events);
      
      expect(result[0].id).toBe('evt2'); // 1:00
      expect(result[1].id).toBe('evt3'); // 2:00
      expect(result[2].id).toBe('evt1'); // 3:00
    });

    it('should add display time to events', () => {
      const events = [
        { id: 'evt1', matchTime: 65000 }  // 1:05
      ];
      
      const result = getTimelineEvents(events);
      
      expect(result[0].displayTime).toBe('1:05');
    });

    it('should handle empty events array', () => {
      const events = [];
      const result = getTimelineEvents(events);
      
      expect(result).toHaveLength(0);
    });
  });
});

