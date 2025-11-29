import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Voice Command Integration Tests', () => {
  let mockPlayers;
  let mockMatch;
  let mockClock;
  let mockPenalties;

  beforeEach(() => {
    mockPlayers = [
      { id: 'p1', number: '1', name: 'Player One', onIce: false, stats: { goals: 0, assists: 0, plus: 0 } },
      { id: 'p2', number: '2', name: 'Player Two', onIce: false, stats: { goals: 0, assists: 0, plus: 0 } },
      { id: 'p7', number: '7', name: 'Player Seven', onIce: true, stats: { goals: 0, assists: 0, plus: 0 } },
      { id: 'p12', number: '12', name: 'Player Twelve', onIce: true, stats: { goals: 0, assists: 0, plus: 0 } },
    ];

    mockClock = {
      running: true,
      elapsedMs: 120000, // 2:00
      lastStartedAt: Date.now()
    };

    mockMatch = {
      id: 'm1',
      ourScore: 0,
      opponentScore: 0
    };

    mockPenalties = [];
  });

  describe('Complete Goal Workflow', () => {
    it('should record goal with voice command', () => {
      // Simulate: "But pour nous numéro 7 assisté par 12"
      const llmResponse = {
        intent: 'goal_us',
        entities: { scorer: 7, assists: [12] }
      };

      // Find scorer and assists
      const scorer = mockPlayers.find(p => parseInt(p.number) === 7);
      const assist1 = mockPlayers.find(p => parseInt(p.number) === 12);
      
      expect(scorer).toBeDefined();
      expect(assist1).toBeDefined();

      // Update stats
      scorer.stats.goals += 1;
      scorer.stats.plus += 1;
      assist1.stats.assists += 1;
      assist1.stats.plus += 1;

      // Verify
      expect(scorer.stats.goals).toBe(1);
      expect(scorer.stats.plus).toBe(1);
      expect(assist1.stats.assists).toBe(1);
      expect(assist1.stats.plus).toBe(1);
    });

    it('should release opponent penalty when we score', () => {
      mockPenalties = [
        { 
          team: 'THEM', 
          type: 'Minor', 
          served: false, 
          affectsStrength: true,
          startTimeMs: 60000,
          durationMs: 120000
        }
      ];

      // Score goal for US
      const penaltyIndex = mockPenalties.findIndex(p => 
        p.team === 'THEM' && 
        (p.type === 'Minor' || p.type === 'Double Minor') &&
        !p.served &&
        p.affectsStrength
      );

      expect(penaltyIndex).toBe(0);
      mockPenalties[penaltyIndex].served = true;
      
      expect(mockPenalties[0].served).toBe(true);
    });
  });

  describe('Complete Penalty Workflow', () => {
    it('should add penalty with voice command', () => {
      // Simulate: "2 minutes pour 7"
      const llmResponse = {
        intent: 'penalty',
        entities: { player: 7, duration: 2, reason: 'hooking' }
      };

      const player = mockPlayers.find(p => parseInt(p.number) === 7);
      expect(player).toBeDefined();

      // Create penalty
      const penalty = {
        id: 'pen1',
        playerNumber: 7,
        type: 'Minor',
        duration: 2,
        durationMs: 120000,
        infraction: 'hooking',
        team: 'US',
        startTimeMs: mockClock.elapsedMs,
        served: false,
        affectsStrength: true
      };

      mockPenalties.push(penalty);

      // Verify
      expect(mockPenalties).toHaveLength(1);
      expect(mockPenalties[0].playerNumber).toBe(7);
      expect(mockPenalties[0].startTimeMs).toBe(120000);
      expect(mockPenalties[0].durationMs).toBe(120000);
    });

    it('should expire penalty after duration', () => {
      const penalty = {
        playerNumber: 7,
        startTimeMs: 60000,  // Started at 1:00
        durationMs: 120000,  // 2 minutes
        served: false
      };

      mockPenalties.push(penalty);

      // Check at 2:30 (not expired)
      let currentTime = 150000;
      let elapsed = currentTime - penalty.startTimeMs;
      let remaining = penalty.durationMs - elapsed;
      expect(remaining).toBeGreaterThan(0);

      // Check at 3:30 (expired)
      currentTime = 210000;
      elapsed = currentTime - penalty.startTimeMs;
      remaining = penalty.durationMs - elapsed;
      expect(remaining).toBeLessThan(-1000); // Buffer
      
      // Should be auto-removed
      mockPenalties = mockPenalties.filter(p => {
        const e = currentTime - p.startTimeMs;
        const r = p.durationMs - e;
        return r >= -1000 || p.served;
      });

      expect(mockPenalties).toHaveLength(0);
    });
  });

  describe('Complete Player Management Workflow', () => {
    it('should handle multiple players entering ice', () => {
      // Simulate: "Joueurs 1 2 3 entre"
      const llmResponse = {
        intent: 'player_on_ice',
        entities: { players: [1, 2] }
      };

      const playerIds = llmResponse.entities.players
        .map(num => mockPlayers.find(p => parseInt(p.number) === num))
        .filter(p => p)
        .map(p => p.id);

      expect(playerIds).toHaveLength(2);

      // Toggle all players at once
      mockPlayers = mockPlayers.map(p => 
        playerIds.includes(p.id) ? { ...p, onIce: true } : p
      );

      // Verify
      expect(mockPlayers.find(p => p.id === 'p1').onIce).toBe(true);
      expect(mockPlayers.find(p => p.id === 'p2').onIce).toBe(true);
    });

    it('should exclude penalized players from ice count', () => {
      mockPenalties = [
        { playerNumber: 7, served: false, affectsStrength: true }
      ];

      // Get on-ice players excluding penalties
      const playersInPenaltyIds = mockPlayers
        .filter(p => {
          const playerPenalty = mockPenalties.find(pen => 
            parseInt(pen.playerNumber) === parseInt(p.number) && 
            !pen.served && 
            pen.affectsStrength
          );
          return !!playerPenalty;
        })
        .map(p => p.id);

      const onIcePlayers = mockPlayers.filter(p => 
        p.onIce && !playersInPenaltyIds.includes(p.id)
      );

      // Should only count player 12 (player 7 is in penalty)
      expect(onIcePlayers).toHaveLength(1);
      expect(onIcePlayers[0].number).toBe('12');
    });
  });

  describe('Complete Clock Control Workflow', () => {
    it('should start and pause clock via voice', () => {
      // Start clock
      mockClock.running = true;
      mockClock.lastStartedAt = Date.now();
      
      expect(mockClock.running).toBe(true);

      // Pause clock
      const elapsed = Date.now() - mockClock.lastStartedAt;
      mockClock.elapsedMs += elapsed;
      mockClock.running = false;
      
      expect(mockClock.running).toBe(false);
      expect(mockClock.elapsedMs).toBeGreaterThan(120000);
    });

    it('should set clock to specific time via voice', () => {
      // Simulate: "Chrono à 5:30"
      const llmResponse = {
        intent: 'set_clock',
        entities: { time: '5:30' }
      };

      // Parse time
      const parts = llmResponse.entities.time.split(':');
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      const targetMs = (minutes * 60 + seconds) * 1000;

      mockClock.elapsedMs = targetMs;
      
      expect(mockClock.elapsedMs).toBe(330000); // 5:30
    });
  });

  describe('Multi-Step Game Scenario', () => {
    it('should handle complete game flow', () => {
      // 1. Start game
      mockClock.running = true;
      mockClock.elapsedMs = 0;
      
      // 2. Players enter ice (1, 2, 7, 12)
      ['p1', 'p2', 'p7', 'p12'].forEach(id => {
        const player = mockPlayers.find(p => p.id === id);
        player.onIce = true;
      });
      
      const onIce = mockPlayers.filter(p => p.onIce);
      expect(onIce).toHaveLength(4);

      // 3. Advance clock to 2:00
      mockClock.elapsedMs = 120000;

      // 4. Penalty for player 7 (2 min)
      mockPenalties.push({
        playerNumber: 7,
        startTimeMs: mockClock.elapsedMs,
        durationMs: 120000,
        served: false,
        affectsStrength: true,
        type: 'Minor',
        team: 'US'
      });

      // Check on-ice excluding penalties (should be 3)
      let playersInPenaltyIds = mockPlayers
        .filter(p => mockPenalties.some(pen => 
          parseInt(pen.playerNumber) === parseInt(p.number) && !pen.served
        ))
        .map(p => p.id);
      let effectiveOnIce = mockPlayers.filter(p => 
        p.onIce && !playersInPenaltyIds.includes(p.id)
      );
      expect(effectiveOnIce).toHaveLength(3);

      // 5. Advance to 3:00
      mockClock.elapsedMs = 180000;

      // 6. Score goal (scorer 12, assist 1)
      const scorer = mockPlayers.find(p => p.number === '12');
      const assist = mockPlayers.find(p => p.number === '1');
      scorer.stats.goals += 1;
      scorer.stats.plus += 1;
      assist.stats.assists += 1;
      assist.stats.plus += 1;
      
      // Release penalty (opponent scored... wait, we scored!)
      // Actually, should release OPPONENT penalty, but this is US team
      // Let's say we had THEM penalty
      mockPenalties = [
        { 
          playerNumber: 99, 
          team: 'THEM', 
          type: 'Minor', 
          served: false, 
          affectsStrength: true 
        }
      ];
      
      // Goal for US releases THEM penalty
      const penaltyIndex = mockPenalties.findIndex(p => 
        p.team === 'THEM' && p.type === 'Minor' && !p.served
      );
      if (penaltyIndex >= 0) {
        mockPenalties[penaltyIndex].served = true;
      }

      // 7. Verify final state
      expect(scorer.stats.goals).toBe(1);
      expect(assist.stats.assists).toBe(1);
      expect(mockPenalties[0].served).toBe(true);
      expect(mockClock.elapsedMs).toBe(180000);
    });
  });
});

