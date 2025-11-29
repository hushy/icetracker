import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interpretCommandWithLLM } from '../../utils/llmInterpreter';

describe('LLM Interpreter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  const mockSuccessResponse = {
    intent: 'player_on_ice',
    entities: { players: [1, 2, 3] },
    confidence: 0.95,
    action: 'Joueurs 1, 2 et 3 entrent sur la glace'
  };

  it('should interpret French player on ice command', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify(mockSuccessResponse)
          }
        }]
      })
    });

    const result = await interpretCommandWithLLM('joueur 1 2 3 entre', 'fr-FR');
    
    expect(result.success).toBe(true);
    expect(result.intent).toBe('player_on_ice');
    expect(result.entities.players).toEqual([1, 2, 3]);
    expect(result.confidence).toBe(0.95);
  });

  it('should interpret goal command', async () => {
    const goalResponse = {
      intent: 'goal_us',
      entities: { scorer: 7, assists: [12, 3] },
      confidence: 0.98,
      action: 'But pour nous #7 assisté par #12 et #3'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(goalResponse) } }]
      })
    });

    const result = await interpretCommandWithLLM('but pour nous numéro 7 assisté par 12 et 3');
    
    expect(result.success).toBe(true);
    expect(result.intent).toBe('goal_us');
    expect(result.entities.scorer).toBe(7);
    expect(result.entities.assists).toEqual([12, 3]);
  });

  it('should interpret penalty command with duration and reason', async () => {
    const penaltyResponse = {
      intent: 'penalty',
      entities: { player: 5, duration: 2, reason: 'hooking' },
      confidence: 0.92,
      action: '2 minutes pour #5 (hooking)'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(penaltyResponse) } }]
      })
    });

    const result = await interpretCommandWithLLM('2 minutes pour 5 accroché');
    
    expect(result.success).toBe(true);
    expect(result.intent).toBe('penalty');
    expect(result.entities.player).toBe(5);
    expect(result.entities.duration).toBe(2);
  });

  it('should interpret clock control commands', async () => {
    const clockResponse = {
      intent: 'start_clock',
      entities: {},
      confidence: 0.99,
      action: 'Démarrer le chrono'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(clockResponse) } }]
      })
    });

    const result = await interpretCommandWithLLM('démarre le chrono');
    
    expect(result.success).toBe(true);
    expect(result.intent).toBe('start_clock');
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await interpretCommandWithLLM('test command');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('error');
  });

  it('should handle invalid JSON responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'invalid json {{{' } }]
      })
    });

    const result = await interpretCommandWithLLM('test command');
    
    expect(result.success).toBe(false);
  });

  it('should use correct language prompt', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockSuccessResponse) } }]
      })
    });

    await interpretCommandWithLLM('joueur 1 entre', 'fr-FR');
    
    const callArgs = global.fetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    
    expect(body.messages[0].content).toContain('français');
  });

  it('should detect language from transcript', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockSuccessResponse) } }]
      })
    });

    // French transcript with multiple French words
    await interpretCommandWithLLM('joueur numéro un entre sur la glace');
    
    const callArgs = global.fetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    
    expect(body.messages[0].content).toContain('français');
  });
});

