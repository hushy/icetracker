import { describe, it, expect } from 'vitest';

describe('Penalty Logic', () => {
  describe('isPenaltyExpired', () => {
    const isPenaltyExpired = (penalty, currentElapsedMs) => {
      if (!penalty || penalty.served) return false;
      const elapsed = currentElapsedMs - penalty.startTimeMs;
      const remaining = penalty.durationMs - elapsed;
      return remaining < -1000; // 1 second buffer to prevent race conditions
    };

    it('should return false for served penalties', () => {
      const penalty = {
        served: true,
        startTimeMs: 0,
        durationMs: 120000
      };
      
      expect(isPenaltyExpired(penalty, 150000)).toBe(false);
    });

    it('should return false for active penalties', () => {
      const penalty = {
        served: false,
        startTimeMs: 60000, // Started at 1:00
        durationMs: 120000  // 2 minute penalty
      };
      
      // Current time: 2:00 (penalty not expired yet)
      expect(isPenaltyExpired(penalty, 120000)).toBe(false);
    });

    it('should return true for expired penalties', () => {
      const penalty = {
        served: false,
        startTimeMs: 60000,  // Started at 1:00
        durationMs: 120000   // 2 minute penalty
      };
      
      // Current time: 4:00 (penalty expired at 3:00)
      expect(isPenaltyExpired(penalty, 240000)).toBe(true);
    });

    it('should use buffer to prevent race conditions', () => {
      const penalty = {
        served: false,
        startTimeMs: 60000,
        durationMs: 120000
      };
      
      // Exactly at expiry (3:00)
      expect(isPenaltyExpired(penalty, 180000)).toBe(false);
      
      // Just after expiry (3:00.5)
      expect(isPenaltyExpired(penalty, 180500)).toBe(false);
      
      // After buffer (3:01.5)
      expect(isPenaltyExpired(penalty, 181500)).toBe(true);
    });

    it('should handle penalties starting at time 0', () => {
      const penalty = {
        served: false,
        startTimeMs: 0,
        durationMs: 120000
      };
      
      // Not expired at 1:30
      expect(isPenaltyExpired(penalty, 90000)).toBe(false);
      
      // Expired at 2:05
      expect(isPenaltyExpired(penalty, 125000)).toBe(true);
    });
  });

  describe('calculatePenaltyRemaining', () => {
    const calculatePenaltyRemaining = (penalty, currentElapsedMs) => {
      const elapsed = currentElapsedMs - penalty.startTimeMs;
      const remaining = Math.max(0, penalty.durationMs - elapsed);
      return Math.ceil(remaining / 1000); // Return in seconds
    };

    it('should calculate remaining time correctly', () => {
      const penalty = {
        startTimeMs: 60000,  // 1:00
        durationMs: 120000   // 2 minutes
      };
      
      // At 1:30 (30 seconds elapsed)
      expect(calculatePenaltyRemaining(penalty, 90000)).toBe(90);
      
      // At 2:00 (60 seconds elapsed)
      expect(calculatePenaltyRemaining(penalty, 120000)).toBe(60);
      
      // At 2:30 (90 seconds elapsed)
      expect(calculatePenaltyRemaining(penalty, 150000)).toBe(30);
    });

    it('should return 0 for expired penalties', () => {
      const penalty = {
        startTimeMs: 60000,
        durationMs: 120000
      };
      
      // At 4:00 (penalty expired at 3:00)
      expect(calculatePenaltyRemaining(penalty, 240000)).toBe(0);
    });

    it('should ceil to prevent showing negative time', () => {
      const penalty = {
        startTimeMs: 60000,
        durationMs: 120000
      };
      
      // Just before expiry
      expect(calculatePenaltyRemaining(penalty, 179500)).toBeGreaterThan(0);
    });
  });

  describe('mapDurationToPenaltyType', () => {
    const mapDurationToPenaltyType = (durationMinutes) => {
      if (durationMinutes === 2) return 'Minor';
      if (durationMinutes === 4) return 'Double Minor';
      if (durationMinutes === 5) return 'Major';
      if (durationMinutes === 10) return 'Misconduct';
      return 'Minor'; // Default
    };

    it('should map 2 minutes to Minor', () => {
      expect(mapDurationToPenaltyType(2)).toBe('Minor');
    });

    it('should map 4 minutes to Double Minor', () => {
      expect(mapDurationToPenaltyType(4)).toBe('Double Minor');
    });

    it('should map 5 minutes to Major', () => {
      expect(mapDurationToPenaltyType(5)).toBe('Major');
    });

    it('should map 10 minutes to Misconduct', () => {
      expect(mapDurationToPenaltyType(10)).toBe('Misconduct');
    });

    it('should default to Minor for unknown durations', () => {
      expect(mapDurationToPenaltyType(1)).toBe('Minor');
      expect(mapDurationToPenaltyType(3)).toBe('Minor');
      expect(mapDurationToPenaltyType(15)).toBe('Minor');
    });
  });

  describe('shouldReleasePenaltyOnGoal', () => {
    const shouldReleasePenaltyOnGoal = (penalty, scoringTeam) => {
      // Release penalty if:
      // 1. Penalty is for the opponent team
      // 2. Penalty is Minor or Double Minor
      // 3. Penalty is not already served
      const penalizedTeam = penalty.team;
      const isOpponentPenalty = 
        (scoringTeam === 'US' && penalizedTeam === 'THEM') ||
        (scoringTeam === 'THEM' && penalizedTeam === 'US');
      
      return isOpponentPenalty && 
             (penalty.type === 'Minor' || penalty.type === 'Double Minor') &&
             !penalty.served;
    };

    it('should release opponent minor penalty on goal', () => {
      const penalty = {
        team: 'THEM',
        type: 'Minor',
        served: false
      };
      
      expect(shouldReleasePenaltyOnGoal(penalty, 'US')).toBe(true);
    });

    it('should not release own team penalty on goal', () => {
      const penalty = {
        team: 'US',
        type: 'Minor',
        served: false
      };
      
      expect(shouldReleasePenaltyOnGoal(penalty, 'US')).toBe(false);
    });

    it('should not release major penalties on goal', () => {
      const penalty = {
        team: 'THEM',
        type: 'Major',
        served: false
      };
      
      expect(shouldReleasePenaltyOnGoal(penalty, 'US')).toBe(false);
    });

    it('should not release already served penalties', () => {
      const penalty = {
        team: 'THEM',
        type: 'Minor',
        served: true
      };
      
      expect(shouldReleasePenaltyOnGoal(penalty, 'US')).toBe(false);
    });

    it('should release double minor penalties on goal', () => {
      const penalty = {
        team: 'THEM',
        type: 'Double Minor',
        served: false
      };
      
      expect(shouldReleasePenaltyOnGoal(penalty, 'US')).toBe(true);
    });
  });
});

