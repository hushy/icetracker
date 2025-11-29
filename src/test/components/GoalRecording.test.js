import { describe, it, expect } from 'vitest';

describe('Goal Recording Logic', () => {
  describe('recordGoal', () => {
    const recordGoal = (players, onIcePlayers, scorerNum, assist1Num, assist2Num) => {
      const scorer = players.find(p => parseInt(p.number) === parseInt(scorerNum));
      const assist1 = assist1Num ? players.find(p => parseInt(p.number) === parseInt(assist1Num)) : null;
      const assist2 = assist2Num ? players.find(p => parseInt(p.number) === parseInt(assist2Num)) : null;
      
      if (!scorer) return { success: false, error: 'Scorer not found' };
      
      // Update stats
      let updatedPlayers = players.map(p => {
        if (p.id === scorer.id) {
          return { 
            ...p, 
            stats: { ...p.stats, goals: p.stats.goals + 1, plus: p.stats.plus + 1 } 
          };
        }
        if (assist1 && p.id === assist1.id) {
          return { 
            ...p, 
            stats: { ...p.stats, assists: p.stats.assists + 1, plus: p.stats.plus + 1 } 
          };
        }
        if (assist2 && p.id === assist2.id) {
          return { 
            ...p, 
            stats: { ...p.stats, assists: p.stats.assists + 1, plus: p.stats.plus + 1 } 
          };
        }
        // Update plus for other on-ice players
        if (onIcePlayers.find(oip => oip.id === p.id)) {
          return { 
            ...p, 
            stats: { ...p.stats, plus: p.stats.plus + 1 } 
          };
        }
        return p;
      });
      
      return { success: true, players: updatedPlayers };
    };

    it('should record a goal for scorer', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, plus: 0 } }
      ];
      const onIcePlayers = [players[0]];
      
      const result = recordGoal(players, onIcePlayers, 7, null, null);
      
      expect(result.success).toBe(true);
      expect(result.players[0].stats.goals).toBe(1);
      expect(result.players[0].stats.plus).toBe(1);
    });

    it('should record assists', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p2', number: '12', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p3', number: '3', stats: { goals: 0, assists: 0, plus: 0 } }
      ];
      const onIcePlayers = players;
      
      const result = recordGoal(players, onIcePlayers, 7, 12, 3);
      
      expect(result.success).toBe(true);
      expect(result.players[0].stats.goals).toBe(1);
      expect(result.players[1].stats.assists).toBe(1);
      expect(result.players[2].stats.assists).toBe(1);
    });

    it('should update plus for scorer, assists, and on-ice players', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p2', number: '12', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p3', number: '3', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p4', number: '4', stats: { goals: 0, assists: 0, plus: 0 } }
      ];
      const onIcePlayers = players.slice(0, 3); // First 3 on ice
      
      const result = recordGoal(players, onIcePlayers, 7, 12, null);
      
      expect(result.players[0].stats.plus).toBe(1); // Scorer
      expect(result.players[1].stats.plus).toBe(1); // Assist
      expect(result.players[2].stats.plus).toBe(1); // Other on-ice
      expect(result.players[3].stats.plus).toBe(0); // Not on ice
    });

    it('should handle goal with one assist', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, assists: 0, plus: 0 } },
        { id: 'p2', number: '12', stats: { goals: 0, assists: 0, plus: 0 } }
      ];
      const onIcePlayers = players;
      
      const result = recordGoal(players, onIcePlayers, 7, 12, null);
      
      expect(result.success).toBe(true);
      expect(result.players[0].stats.goals).toBe(1);
      expect(result.players[1].stats.assists).toBe(1);
    });

    it('should handle unassisted goal', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, assists: 0, plus: 0 } }
      ];
      const onIcePlayers = players;
      
      const result = recordGoal(players, onIcePlayers, 7, null, null);
      
      expect(result.success).toBe(true);
      expect(result.players[0].stats.goals).toBe(1);
      expect(result.players[0].stats.assists).toBe(0);
    });

    it('should return error if scorer not found', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0 } }
      ];
      const onIcePlayers = players;
      
      const result = recordGoal(players, onIcePlayers, 99, null, null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Scorer not found');
    });

    it('should handle string and number player numbers', () => {
      const players = [
        { id: 'p1', number: '7', stats: { goals: 0, plus: 0 } }
      ];
      const onIcePlayers = players;
      
      // Test with number
      let result = recordGoal(players, onIcePlayers, 7, null, null);
      expect(result.success).toBe(true);
      
      // Test with string
      result = recordGoal(result.players, onIcePlayers, '7', null, null);
      expect(result.success).toBe(true);
      expect(result.players[0].stats.goals).toBe(2);
    });
  });

  describe('releasePenaltyOnGoal', () => {
    const releasePenaltyOnGoal = (penalties, scoringTeam) => {
      // Find first minor penalty for the opponent team
      const opponentTeam = scoringTeam === 'US' ? 'THEM' : 'US';
      
      const penaltyIndex = penalties.findIndex(p => 
        p.team === opponentTeam && 
        (p.type === 'Minor' || p.type === 'Double Minor') &&
        !p.served &&
        p.affectsStrength
      );
      
      if (penaltyIndex === -1) return penalties;
      
      return penalties.map((p, idx) => 
        idx === penaltyIndex ? { ...p, served: true } : p
      );
    };

    it('should release opponent minor penalty when we score', () => {
      const penalties = [
        { team: 'THEM', type: 'Minor', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(true);
    });

    it('should not release our own penalty when we score', () => {
      const penalties = [
        { team: 'US', type: 'Minor', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(false);
    });

    it('should release our penalty when they score', () => {
      const penalties = [
        { team: 'US', type: 'Minor', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'THEM');
      
      expect(result[0].served).toBe(true);
    });

    it('should not release major penalties', () => {
      const penalties = [
        { team: 'THEM', type: 'Major', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(false);
    });

    it('should release first penalty when multiple exist', () => {
      const penalties = [
        { id: 1, team: 'THEM', type: 'Minor', served: false, affectsStrength: true },
        { id: 2, team: 'THEM', type: 'Minor', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(true);
      expect(result[1].served).toBe(false);
    });

    it('should release double minor penalties', () => {
      const penalties = [
        { team: 'THEM', type: 'Double Minor', served: false, affectsStrength: true }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(true);
    });

    it('should not release non-strength-affecting penalties', () => {
      const penalties = [
        { team: 'THEM', type: 'Minor', served: false, affectsStrength: false }
      ];
      
      const result = releasePenaltyOnGoal(penalties, 'US');
      
      expect(result[0].served).toBe(false);
    });
  });
});

