import { describe, it, expect } from 'vitest';

describe('Player Management Logic', () => {
  describe('addPlayer', () => {
    const addPlayer = (players, { number, name }) => {
      if (!number && !name) return players;
      
      const newPlayer = {
        id: `player_${Date.now()}`,
        number: number.trim(),
        name: name.trim(),
        onIce: false,
        isGoalie: false,
        stats: {
          goals: 0,
          assists: 0,
          shots: 0,
          blockedShots: 0,
          zoneEntries: 0,
          plus: 0,
          minus: 0
        }
      };
      
      return [...players, newPlayer];
    };

    it('should add a player with number and name', () => {
      const players = [];
      const result = addPlayer(players, { number: '7', name: 'John Doe' });
      
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe('7');
      expect(result[0].name).toBe('John Doe');
      expect(result[0].onIce).toBe(false);
    });

    it('should initialize player stats to 0', () => {
      const players = [];
      const result = addPlayer(players, { number: '7', name: 'John' });
      
      expect(result[0].stats.goals).toBe(0);
      expect(result[0].stats.assists).toBe(0);
      expect(result[0].stats.plus).toBe(0);
      expect(result[0].stats.minus).toBe(0);
    });

    it('should not add player without number or name', () => {
      const players = [];
      const result = addPlayer(players, { number: '', name: '' });
      
      expect(result).toHaveLength(0);
    });

    it('should trim whitespace', () => {
      const players = [];
      const result = addPlayer(players, { number: '  7  ', name: '  John  ' });
      
      expect(result[0].number).toBe('7');
      expect(result[0].name).toBe('John');
    });
  });

  describe('togglePlayerOnIce', () => {
    const togglePlayerOnIce = (players, playerId) => {
      return players.map(p => 
        p.id === playerId ? { ...p, onIce: !p.onIce } : p
      );
    };

    it('should toggle player from bench to ice', () => {
      const players = [
        { id: 'p1', number: '7', onIce: false }
      ];
      
      const result = togglePlayerOnIce(players, 'p1');
      expect(result[0].onIce).toBe(true);
    });

    it('should toggle player from ice to bench', () => {
      const players = [
        { id: 'p1', number: '7', onIce: true }
      ];
      
      const result = togglePlayerOnIce(players, 'p1');
      expect(result[0].onIce).toBe(false);
    });

    it('should only toggle specified player', () => {
      const players = [
        { id: 'p1', number: '7', onIce: false },
        { id: 'p2', number: '12', onIce: true }
      ];
      
      const result = togglePlayerOnIce(players, 'p1');
      expect(result[0].onIce).toBe(true);
      expect(result[1].onIce).toBe(true);
    });
  });

  describe('toggleMultiplePlayersOnIce', () => {
    const toggleMultiplePlayersOnIce = (players, playerIds, targetState) => {
      return players.map(p => 
        playerIds.includes(p.id) ? { ...p, onIce: targetState } : p
      );
    };

    it('should put multiple players on ice', () => {
      const players = [
        { id: 'p1', number: '1', onIce: false },
        { id: 'p2', number: '2', onIce: false },
        { id: 'p3', number: '3', onIce: false }
      ];
      
      const result = toggleMultiplePlayersOnIce(players, ['p1', 'p2', 'p3'], true);
      
      expect(result[0].onIce).toBe(true);
      expect(result[1].onIce).toBe(true);
      expect(result[2].onIce).toBe(true);
    });

    it('should bench multiple players', () => {
      const players = [
        { id: 'p1', number: '1', onIce: true },
        { id: 'p2', number: '2', onIce: true },
        { id: 'p3', number: '3', onIce: true }
      ];
      
      const result = toggleMultiplePlayersOnIce(players, ['p1', 'p3'], false);
      
      expect(result[0].onIce).toBe(false);
      expect(result[1].onIce).toBe(true);
      expect(result[2].onIce).toBe(false);
    });

    it('should handle empty player ID array', () => {
      const players = [
        { id: 'p1', number: '1', onIce: false }
      ];
      
      const result = toggleMultiplePlayersOnIce(players, [], true);
      expect(result[0].onIce).toBe(false);
    });
  });

  describe('updatePlayerStat', () => {
    const updatePlayerStat = (players, playerId, statName, delta) => {
      return players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              stats: { 
                ...p.stats, 
                [statName]: p.stats[statName] + delta 
              } 
            } 
          : p
      );
    };

    it('should increment player stat', () => {
      const players = [
        { 
          id: 'p1', 
          number: '7', 
          stats: { goals: 0, assists: 0 } 
        }
      ];
      
      const result = updatePlayerStat(players, 'p1', 'goals', 1);
      expect(result[0].stats.goals).toBe(1);
    });

    it('should decrement player stat', () => {
      const players = [
        { 
          id: 'p1', 
          number: '7', 
          stats: { goals: 2, assists: 1 } 
        }
      ];
      
      const result = updatePlayerStat(players, 'p1', 'goals', -1);
      expect(result[0].stats.goals).toBe(1);
    });

    it('should only update specified player', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0 } },
        { id: 'p2', number: '12', stats: { goals: 0 } }
      ];
      
      const result = updatePlayerStat(players, 'p1', 'goals', 1);
      expect(result[0].stats.goals).toBe(1);
      expect(result[1].stats.goals).toBe(0);
    });

    it('should update different stat types', () => {
      const players = [
        { 
          id: 'p1', 
          stats: { goals: 0, assists: 0, shots: 0, plus: 0 } 
        }
      ];
      
      let result = updatePlayerStat(players, 'p1', 'assists', 1);
      expect(result[0].stats.assists).toBe(1);
      
      result = updatePlayerStat(result, 'p1', 'shots', 3);
      expect(result[0].stats.shots).toBe(3);
      
      result = updatePlayerStat(result, 'p1', 'plus', 1);
      expect(result[0].stats.plus).toBe(1);
    });
  });

  describe('getOnIcePlayers', () => {
    const getOnIcePlayers = (players, penalties = []) => {
      // Get players in penalty box
      const playersInPenaltyIds = players
        .filter(p => {
          const playerPenalty = penalties.find(pen => 
            parseInt(pen.playerNumber) === parseInt(p.number) && 
            !pen.served && 
            pen.affectsStrength
          );
          return !!playerPenalty;
        })
        .map(p => p.id);
      
      // Filter out players in penalty
      return players.filter(p => p.onIce && !playersInPenaltyIds.includes(p.id));
    };

    it('should return only players on ice', () => {
      const players = [
        { id: 'p1', number: '1', onIce: true },
        { id: 'p2', number: '2', onIce: false },
        { id: 'p3', number: '3', onIce: true }
      ];
      
      const result = getOnIcePlayers(players);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p3');
    });

    it('should exclude players in penalty box', () => {
      const players = [
        { id: 'p1', number: '1', onIce: true },
        { id: 'p2', number: '2', onIce: true }
      ];
      
      const penalties = [
        { playerNumber: 2, served: false, affectsStrength: true }
      ];
      
      const result = getOnIcePlayers(players, penalties);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('should include players with served penalties', () => {
      const players = [
        { id: 'p1', number: '1', onIce: true },
        { id: 'p2', number: '2', onIce: true }
      ];
      
      const penalties = [
        { playerNumber: 2, served: true, affectsStrength: true }
      ];
      
      const result = getOnIcePlayers(players, penalties);
      expect(result).toHaveLength(2);
    });
  });
});

