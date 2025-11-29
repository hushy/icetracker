import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test clock logic functions
describe('Clock Logic', () => {
  describe('formatTime', () => {
    const formatTime = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    it('should format 0 milliseconds', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format seconds only', () => {
      expect(formatTime(30000)).toBe('0:30');
      expect(formatTime(59000)).toBe('0:59');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(60000)).toBe('1:00');
      expect(formatTime(90000)).toBe('1:30');
      expect(formatTime(600000)).toBe('10:00');
    });

    it('should pad seconds with zero', () => {
      expect(formatTime(65000)).toBe('1:05');
      expect(formatTime(125000)).toBe('2:05');
    });

    it('should handle large times', () => {
      expect(formatTime(3600000)).toBe('60:00'); // 1 hour
      expect(formatTime(3661000)).toBe('61:01'); // 1 hour 1 min 1 sec
    });
  });

  describe('parseTimeToMs', () => {
    const parseTimeToMs = (timeStr) => {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return (minutes * 60 + seconds) * 1000;
      }
      return 0;
    };

    it('should parse minutes:seconds format', () => {
      expect(parseTimeToMs('0:00')).toBe(0);
      expect(parseTimeToMs('1:00')).toBe(60000);
      expect(parseTimeToMs('5:30')).toBe(330000);
      expect(parseTimeToMs('10:45')).toBe(645000);
    });

    it('should handle invalid format', () => {
      expect(parseTimeToMs('invalid')).toBe(0);
      expect(parseTimeToMs('')).toBe(0);
      expect(parseTimeToMs('1')).toBe(0);
    });

    it('should handle malformed times', () => {
      expect(parseTimeToMs('1:abc')).toBe(60000); // NaN becomes 0
      expect(parseTimeToMs('abc:30')).toBe(30000);
    });
  });

  describe('calculateCurrentElapsedMs', () => {
    const calculateCurrentElapsedMs = (clock) => {
      if (!clock) return 0;
      return clock.running 
        ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
        : clock.elapsedMs;
    };

    it('should return 0 for undefined clock', () => {
      expect(calculateCurrentElapsedMs(undefined)).toBe(0);
    });

    it('should return elapsedMs when paused', () => {
      const clock = {
        running: false,
        elapsedMs: 120000,
        lastStartedAt: Date.now() - 10000
      };
      
      expect(calculateCurrentElapsedMs(clock)).toBe(120000);
    });

    it('should calculate elapsed time when running', () => {
      const now = Date.now();
      const clock = {
        running: true,
        elapsedMs: 60000, // 1 minute
        lastStartedAt: now - 30000 // Started 30 seconds ago
      };
      
      const result = calculateCurrentElapsedMs(clock);
      // Should be approximately 90000ms (1:30)
      expect(result).toBeGreaterThanOrEqual(89000);
      expect(result).toBeLessThanOrEqual(91000);
    });
  });

  describe('isCountdownExpired', () => {
    const isCountdownExpired = (clock, targetMs = 1200000) => {
      if (!clock) return false;
      const currentElapsed = clock.running 
        ? clock.elapsedMs + (Date.now() - clock.lastStartedAt)
        : clock.elapsedMs;
      return currentElapsed >= targetMs;
    };

    it('should return false for undefined clock', () => {
      expect(isCountdownExpired(undefined, 1200000)).toBe(false);
    });

    it('should detect when countdown is not expired', () => {
      const clock = {
        running: false,
        elapsedMs: 600000, // 10 minutes
        lastStartedAt: Date.now()
      };
      
      expect(isCountdownExpired(clock, 1200000)).toBe(false);
    });

    it('should detect when countdown is expired', () => {
      const clock = {
        running: false,
        elapsedMs: 1200000, // 20 minutes
        lastStartedAt: Date.now()
      };
      
      expect(isCountdownExpired(clock, 1200000)).toBe(true);
    });

    it('should work with running clock', () => {
      const clock = {
        running: true,
        elapsedMs: 1190000, // 19:50
        lastStartedAt: Date.now() - 15000 // Running for 15s
      };
      
      // Should be expired (19:50 + 0:15 = 20:05)
      expect(isCountdownExpired(clock, 1200000)).toBe(true);
    });
  });
});

