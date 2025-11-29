import Fuse from 'fuse.js';

/**
 * Command Interpreter - Fuzzy matching approach
 * This module can be easily swapped with an LLM-based interpreter later
 * 
 * Architecture:
 * 1. Speech transcript comes in
 * 2. Detect intent (goal, block, ice entry, etc.)
 * 3. Extract entities (player numbers, names)
 * 4. Return structured command object
 */

// Words-to-numbers mapping
const wordToNumber = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
  'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
  'eighteen': '18', 'nineteen': '19', 'twenty': '20',
  'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60',
  'seventy': '70', 'eighty': '80', 'ninety': '90'
};

// Intent patterns with keywords and priorities
const intentPatterns = [
  {
    intent: 'player_on_ice',
    keywords: ['enters ice', 'on ice', 'coming on', 'enters', 'going on', 'get on'],
    priority: 1
  },
  {
    intent: 'player_off_ice',
    keywords: ['off ice', 'coming off', 'exits', 'leaving ice', 'get off'],
    priority: 1
  },
  {
    intent: 'goal_us',
    keywords: ['goal for us', 'goal us', 'we scored', 'our goal', 'goal by'],
    priority: 2
  },
  {
    intent: 'goal_them',
    keywords: ['goal for them', 'goal them', 'they scored', 'their goal', 'opponent goal'],
    priority: 2
  },
  {
    intent: 'shot',
    keywords: ['shot', 'shoots', 'takes a shot'],
    priority: 1
  },
  {
    intent: 'block',
    keywords: ['blocks', 'blocked', 'blocks the puck', 'block'],
    priority: 1
  },
  {
    intent: 'hit',
    keywords: ['hit', 'hits', 'body check'],
    priority: 1
  },
  {
    intent: 'zone_entry',
    keywords: ['zone entry', 'enters zone', 'zone'],
    priority: 1
  },
  {
    intent: 'takeaway',
    keywords: ['takeaway', 'takes away', 'steals'],
    priority: 1
  },
  {
    intent: 'giveaway',
    keywords: ['giveaway', 'gives away', 'turnover'],
    priority: 1
  }
];

/**
 * Convert spoken words to numbers
 * "player three" → "player 3"
 * "twenty three" → "23"
 */
function convertWordsToNumbers(text) {
  let result = text.toLowerCase();
  
  // Replace word numbers with digits
  Object.entries(wordToNumber).forEach(([word, digit]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, digit);
  });
  
  // Handle compound numbers like "twenty three" → "23"
  result = result.replace(/(\d0)\s+(\d)/g, (match, tens, ones) => {
    return String(parseInt(tens) + parseInt(ones));
  });
  
  return result;
}

/**
 * Extract player numbers from text
 * Returns array of numbers found
 */
function extractPlayerNumbers(text) {
  const normalizedText = convertWordsToNumbers(text);
  const numbers = normalizedText.match(/\b\d{1,2}\b/g) || [];
  return numbers.map(n => parseInt(n)).filter(n => n >= 0 && n <= 99);
}

/**
 * Detect intent from transcript using keyword matching
 */
function detectIntent(text) {
  const lowerText = text.toLowerCase();
  
  let bestMatch = null;
  let bestScore = 0;

  for (const pattern of intentPatterns) {
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword)) {
        const score = keyword.length * pattern.priority;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = pattern.intent;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Find player by number or name from available players
 */
function findPlayer(identifier, players) {
  if (!players || players.length === 0) return null;
  
  // Try exact number match first
  if (typeof identifier === 'number' || !isNaN(identifier)) {
    const num = parseInt(identifier);
    const exactMatch = players.find(p => p.number === num);
    if (exactMatch) return exactMatch;
  }
  
  // Try fuzzy name search
  if (typeof identifier === 'string') {
    const fuse = new Fuse(players, {
      keys: ['name', 'number'],
      threshold: 0.4,
      includeScore: true
    });
    
    const results = fuse.search(identifier);
    if (results.length > 0 && results[0].score < 0.4) {
      return results[0].item;
    }
  }
  
  return null;
}

/**
 * Main interpreter function
 * 
 * @param {string} transcript - Raw speech transcript
 * @param {Object} context - App context (players, current match, etc.)
 * @returns {Object} - { intent, entities, confidence, action }
 * 
 * This function signature makes it easy to swap with an LLM call:
 * async function interpretWithLLM(transcript, context) {
 *   const response = await openai.chat.completions.create({...});
 *   return parseResponse(response);
 * }
 */
export function interpretCommand(transcript, context = {}) {
  if (!transcript || transcript.trim().length === 0) {
    return {
      success: false,
      error: 'Empty transcript',
      rawTranscript: transcript
    };
  }

  const normalizedTranscript = convertWordsToNumbers(transcript);
  const intent = detectIntent(normalizedTranscript);
  
  if (!intent) {
    return {
      success: false,
      error: 'Could not understand command',
      rawTranscript: transcript,
      normalizedTranscript
    };
  }

  // Extract entities based on intent
  const playerNumbers = extractPlayerNumbers(normalizedTranscript);
  const entities = {};
  
  switch (intent) {
    case 'player_on_ice':
    case 'player_off_ice':
      if (playerNumbers.length > 0) {
        entities.players = playerNumbers;
      } else {
        return {
          success: false,
          error: 'No player number found',
          intent,
          rawTranscript: transcript
        };
      }
      break;
      
    case 'goal_us':
    case 'goal_them':
      entities.scorer = playerNumbers[0] || null;
      entities.assist1 = playerNumbers[1] || null;
      entities.assist2 = playerNumbers[2] || null;
      
      if (!entities.scorer) {
        return {
          success: false,
          error: 'No scorer number found',
          intent,
          rawTranscript: transcript
        };
      }
      break;
      
    case 'shot':
    case 'block':
    case 'hit':
    case 'zone_entry':
    case 'takeaway':
    case 'giveaway':
      if (playerNumbers.length > 0) {
        entities.player = playerNumbers[0];
      } else {
        return {
          success: false,
          error: 'No player number found',
          intent,
          rawTranscript: transcript
        };
      }
      break;
  }

  // Calculate confidence score (simple version)
  let confidence = 0.7; // Base confidence
  if (playerNumbers.length > 0) confidence += 0.2;
  if (intent.includes('goal') && playerNumbers.length >= 2) confidence += 0.1;

  return {
    success: true,
    intent,
    entities,
    confidence: Math.min(confidence, 1.0),
    rawTranscript: transcript,
    normalizedTranscript,
    action: buildActionDescription(intent, entities)
  };
}

/**
 * Build human-readable action description
 */
function buildActionDescription(intent, entities) {
  switch (intent) {
    case 'player_on_ice':
      return `Put player(s) ${entities.players.join(', ')} on ice`;
    case 'player_off_ice':
      return `Take player(s) ${entities.players.join(', ')} off ice`;
    case 'goal_us':
      return `Goal by #${entities.scorer}${entities.assist1 ? ` (A: #${entities.assist1}${entities.assist2 ? `, #${entities.assist2}` : ''})` : ''}`;
    case 'goal_them':
      return `Opponent goal`;
    case 'shot':
      return `Shot by player #${entities.player}`;
    case 'block':
      return `Block by player #${entities.player}`;
    case 'hit':
      return `Hit by player #${entities.player}`;
    case 'zone_entry':
      return `Zone entry by player #${entities.player}`;
    case 'takeaway':
      return `Takeaway by player #${entities.player}`;
    case 'giveaway':
      return `Giveaway by player #${entities.player}`;
    default:
      return `Unknown action: ${intent}`;
  }
}

/**
 * Future: Replace with LLM-based interpreter
 * 
 * export async function interpretCommandWithLLM(transcript, context) {
 *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${API_KEY}`,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       model: 'gpt-4',
 *       messages: [{
 *         role: 'system',
 *         content: `You are a hockey voice command interpreter. Parse commands and return JSON with intent and entities.`
 *       }, {
 *         role: 'user',
 *         content: transcript
 *       }]
 *     })
 *   });
 *   return response.json();
 * }
 */

