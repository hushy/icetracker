/**
 * LLM-based Command Interpreter
 * Uses Groq (free, fast) or OpenAI for natural language understanding
 * 
 * This replaces the fuzzy matching approach with AI-powered interpretation
 */
import { getApiKey, hasApiKey } from './encryption';

// System prompt for English commands
const SYSTEM_PROMPT_EN = `You are a hockey game voice command interpreter for ENGLISH commands. Your job is to parse spoken commands and return structured JSON.

VALID INTENTS:
- player_on_ice: Player enters/goes on ice
- player_off_ice: Player exits/comes off ice
- goal_us: Our team scored
- goal_them: Opponent scored
- shot: Player takes a shot
- block: Player blocks a shot/puck
- hit: Player makes a hit/body check
- zone_entry: Player enters offensive zone
- takeaway: Player takes puck away
- giveaway: Player gives puck away/turnover
- penalty: Player receives a penalty
- start_clock: Start/resume the game clock
- pause_clock: Pause/stop the game clock
- set_clock: Set/reset the clock to a specific time

ENTITY EXTRACTION:
- Extract ALL player numbers mentioned (0-99)
- For goals: identify scorer (first player) and assists (2nd and 3rd players)
- For penalties: extract player number, duration (in minutes), and reason/infraction
- For timestamps: extract time in MM:SS format (e.g., "12:34" or "5:30")
- For other stats: identify the player who performed the action

RESPONSE FORMAT (JSON only, no markdown):
{
  "intent": "intent_name",
  "entities": {
    "player": 12,           // for single player actions
    "players": [12, 23],    // for multiple players (on/off ice)
    "scorer": 7,            // for goals
    "assist1": 12,          // optional
    "assist2": 3,           // optional
    "duration": 2,          // for penalties (minutes)
    "reason": "tripping",   // for penalties
    "timestamp": "12:34"    // optional timestamp (MM:SS format)
  },
  "confidence": 0.95,       // 0-1 scale
  "action": "Goal by #7 (A: #12, #3)"  // human readable
}

EXAMPLES:
Input: "player 12 enters ice"
Output: {"intent":"player_on_ice","entities":{"players":[12]},"confidence":0.95,"action":"Put player 12 on ice"}

Input: "goal for us number 7 assisted by 12 and 3"
Output: {"intent":"goal_us","entities":{"scorer":7,"assist1":12,"assist2":3},"confidence":0.98,"action":"Goal by #7 (A: #12, #3)"}

Input: "twenty three blocks the puck"
Output: {"intent":"block","entities":{"player":23},"confidence":0.92,"action":"Block by player #23"}

Input: "shot by fifteen"
Output: {"intent":"shot","entities":{"player":15},"confidence":0.90,"action":"Shot by player #15"}`;

// System prompt for French commands  
const SYSTEM_PROMPT_FR = `Tu es un interpréteur de commandes vocales pour le hockey en FRANÇAIS. Ton travail est d'analyser les commandes parlées et de retourner du JSON structuré.

INTENTS VALIDES:
- player_on_ice: Joueur entre sur la glace
- player_off_ice: Joueur sort de la glace
- goal_us: Notre équipe a marqué
- goal_them: L'adversaire a marqué
- shot: Joueur fait un tir (tir, shot)
- block: Joueur bloque un tir/rondelle
- hit: Joueur fait une mise en échec
- zone_entry: Joueur entre en zone offensive
- takeaway: Joueur intercepte la rondelle
- giveaway: Joueur perd la rondelle/revirement
- penalty: Joueur reçoit une pénalité
- start_clock: Démarre le chrono
- pause_clock: Met en pause le chrono
- set_clock: Règle le chrono à un temps spécifique

EXTRACTION D'ENTITÉS:
- Extraire TOUS les numéros de joueurs mentionnés (0-99)
- Pour les buts: identifier le marqueur (premier joueur) et les assistances (2e et 3e joueurs)
- Pour les pénalités: extraire le numéro du joueur, la durée (en minutes), et la raison/infraction
- Pour les timestamps: extraire le temps en format MM:SS (ex: "12:34" ou "5:30")
- Pour les autres stats: identifier le joueur qui a effectué l'action

FORMAT DE RÉPONSE (JSON seulement, pas de markdown):
{
  "intent": "nom_intent",
  "entities": {
    "player": 12,           // pour actions d'un seul joueur
    "players": [12, 23],    // pour plusieurs joueurs (entrée/sortie glace)
    "scorer": 7,            // pour buts
    "assist1": 12,          // optionnel
    "assist2": 3,           // optionnel
    "duration": 2,          // pour pénalités (minutes)
    "reason": "hooking",    // pour pénalités (en anglais dans le système)
    "timestamp": "12:34"    // timestamp optionnel (format MM:SS)
  },
  "confidence": 0.95,       // échelle 0-1
  "action": "But de #7 (A: #12, #3)"  // lisible par humain en français
}

EXEMPLES:
Input: "joueur 12 entre sur la glace"
Output: {"intent":"player_on_ice","entities":{"players":[12]},"confidence":0.95,"action":"Joueur 12 entre sur la glace"}

Input: "entrée 1 2 3 7" ou "numéro 1 2 3 et 4 rentre"
Output: {"intent":"player_on_ice","entities":{"players":[1,2,3,7]},"confidence":0.95,"action":"Joueurs #1, #2, #3, #7 entrent sur la glace"}

Input: "joueur dix-huit sort de la glace"
Output: {"intent":"player_off_ice","entities":{"players":[18]},"confidence":0.93,"action":"Joueur 18 sort de la glace"}

Input: "but pour nous numéro 7 assisté par 12 et 3"
Output: {"intent":"goal_us","entities":{"scorer":7,"assist1":12,"assist2":3},"confidence":0.98,"action":"But de #7 (A: #12, #3)"}

Input: "tir par quinze" ou "tir 15"
Output: {"intent":"shot","entities":{"player":15},"confidence":0.90,"action":"Tir du joueur #15"}

Input: "vingt trois bloque la rondelle" ou "bloc par 23" ou "23 bloque" ou "tir bloqué par 23"
Output: {"intent":"block","entities":{"player":23},"confidence":0.92,"action":"Bloc du joueur #23"}

Input: "entrée de zone par 7" ou "7 entre en zone" ou "entrée de zone 7" ou "7 entrée de zone"
Output: {"intent":"zone_entry","entities":{"player":7},"confidence":0.90,"action":"Entrée de zone par #7"}

Input: "but pour nous 7 assisté par 12 à 5:30"
Output: {"intent":"goal_us","entities":{"scorer":7,"assist1":12,"timestamp":"5:30"},"confidence":0.95,"action":"But de #7 (A: #12) à 5:30"}

Input: "2 minutes pour 9 à 12:45 pour accrochage"
Output: {"intent":"penalty","entities":{"player":9,"duration":2,"reason":"hooking","timestamp":"12:45"},"confidence":0.94,"action":"Pénalité 2 min pour #9 (accrochage) à 12:45"}

Input: "démarre le chrono" or "start"
Output: {"intent":"start_clock","entities":{},"confidence":0.98,"action":"Démarrage du chrono"}

Input: "arrête le chrono" or "pause"
Output: {"intent":"pause_clock","entities":{},"confidence":0.98,"action":"Arrêt du chrono"}

Input: "remets le chrono à 5:30" or "set clock to 5:30"
Output: {"intent":"set_clock","entities":{"timestamp":"5:30"},"confidence":0.97,"action":"Chrono réglé à 5:30"}

Input: "chrono à douze minutes quarante-cinq"
Output: {"intent":"set_clock","entities":{"timestamp":"12:45"},"confidence":0.95,"action":"Chrono réglé à 12:45"}

Input: "reset clock to 0" or "remets à zéro"
Output: {"intent":"set_clock","entities":{"timestamp":"0:00"},"confidence":0.98,"action":"Chrono réglé à 0:00"}

Input: "tir cadré par 12" ou "shot on target 12"
Output: {"intent":"shot","entities":{"player":12},"confidence":0.93,"action":"Tir par #12"}

Input: "numéro 2 tir cadré"
Output: {"intent":"shot","entities":{"player":2},"confidence":0.92,"action":"Tir par #2"}

RÈGLES:
- Toujours retourner du JSON valide (pas de blocs markdown)
- Accepter les commandes en FRANÇAIS
- Convertir les nombres en mots vers chiffres:
  * un -> 1, deux -> 2, trois -> 3, vingt-trois -> 23, dix-huit -> 18
- IMPORTANT: "entrée" seul + numéros = player_on_ice (joueurs entrent SUR LA GLACE)
- IMPORTANT: "entrée de zone" = zone_entry (joueur entre EN ZONE OFFENSIVE)
- IMPORTANT: "tir cadré" = shot (pas une pénalité!)
- IMPORTANT: "un/une" (one). "1 an" ou "un an" signifie probablement joueur 1, PAS 11
- Si "1 an" ou "un an" dans la transcription, l'interpréter comme joueur numéro 1
- Retourner l'action dans la MÊME langue que l'entrée (français)
- Si pas clair, utiliser un score de confiance plus bas
- Si aucune commande valide trouvée, retourner format d'erreur: {"error":"Commande non comprise","confidence":0}
- Être flexible avec les variations de langage naturel
- Termes hockey français courants:
  * joueur = player
  * but = goal
  * tir = shot
  * tir cadré = shot on target / shot
  * bloc/bloque = block
  * mise en échec = hit
  * entrée de zone = zone entry
  * revirement = turnover/giveaway
  * interception = takeaway
  * glace = ice
  * sur la glace = on ice
  * sort de la glace = off ice
  * entre sur la glace = enters ice
  * rondelle/puck = puck
  * pénalité/punition = penalty
  * chrono/horloge = clock
  * démarre/commence/start = start
  * arrête/pause/stop = pause/stop
  * remets/règle/set/reset = set/reset
  * à zéro = to zero
  
- Infractions de pénalité (retourner en anglais):
  * accrochage = hooking
  * obstruction = interference
  * rudesse = roughing
  * bâton élevé = high-sticking
  * faire trébucher = tripping
  * retenir = holding
  * cinglage = slashing
  * double-échec = cross-checking
  
- Pour les timestamps: convertir le temps parlé en format MM:SS (ex: "cinq heures trente" → "5:30", "douze quarante-cinq" → "12:45")`;

/**
 * Detect language from transcript
 */
function detectLanguage(transcript) {
  const lowerText = transcript.toLowerCase();
  
  // French indicators
  const frenchWords = ['joueur', 'but', 'glace', 'tir', 'numéro', 'entre', 'sort', 'chrono', 
                       'démarre', 'arrête', 'remets', 'pénalité', 'punition', 'pour', 'assisté',
                       'cadré', 'interception', 'revirement', 'mise'];
  
  // English indicators
  const englishWords = ['player', 'goal', 'ice', 'shot', 'number', 'enters', 'exits', 
                        'clock', 'start', 'pause', 'penalty', 'assisted', 'block'];
  
  let frenchScore = 0;
  let englishScore = 0;
  
  frenchWords.forEach(word => {
    if (lowerText.includes(word)) frenchScore++;
  });
  
  englishWords.forEach(word => {
    if (lowerText.includes(word)) englishScore++;
  });
  
  console.log('[LLM] Language detection - FR:', frenchScore, 'EN:', englishScore);
  
  // Default to French if tied or no clear winner
  return frenchScore >= englishScore ? 'fr' : 'en';
}

/**
 * Call Groq API for command interpretation
 */
async function interpretWithGroq(transcript, apiKey, language = 'fr') {
  const systemPrompt = language === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  console.log('[LLM] Using', language.toUpperCase(), 'prompt');
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Fast and accurate
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.1, // Low temperature for consistent structured output
      max_tokens: 500,
      response_format: { type: "json_object" } // Ensure JSON output
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call OpenAI API for command interpretation
 */
async function interpretWithOpenAI(transcript, apiKey, language = 'fr') {
  const systemPrompt = language === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  console.log('[LLM] Using', language.toUpperCase(), 'prompt');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Cheapest, still very good
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Main LLM interpreter function
 * Drop-in replacement for the fuzzy matcher
 * 
 * @param {string} transcript - Raw speech transcript
 * @param {Object} context - App context (optional, for future use)
 * @returns {Promise<Object>} - { success, intent, entities, confidence, action }
 */
export async function interpretCommandWithLLM(transcript, context = {}) {
  console.log('[LLM] Interpreting:', transcript);
  
  if (!transcript || transcript.trim().length === 0) {
    console.log('[LLM] Empty transcript');
    return {
      success: false,
      error: 'Empty transcript',
      rawTranscript: transcript
    };
  }

  try {
    // Get configuration
    const provider = import.meta.env.VITE_LLM_PROVIDER || 'groq';
    const groqKey = getApiKey(); // Get decrypted key from memory
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('[LLM] Provider:', provider, 'Has Key:', provider === 'groq' ? !!groqKey : !!openaiKey);

    // Check for API key
    if (provider === 'groq' && !groqKey) {
      return {
        success: false,
        error: 'API key not unlocked. Please enter password to continue.',
        needsPassword: true, // Flag to show password prompt
        rawTranscript: transcript
      };
    }

    if (provider === 'openai' && !openaiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env file.',
        rawTranscript: transcript
      };
    }

    // Detect language
    const language = detectLanguage(transcript);
    
    // Call appropriate API
    let responseText;
    const startTime = Date.now();
    
    console.log('[LLM] Calling', provider, 'API...');
    
    if (provider === 'openai') {
      responseText = await interpretWithOpenAI(transcript, openaiKey, language);
    } else {
      responseText = await interpretWithGroq(transcript, groqKey, language);
    }
    
    const latency = Date.now() - startTime;
    console.log('[LLM] Response received in', latency, 'ms');
    console.log('[LLM] Raw response:', responseText);

    // Parse JSON response
    const parsed = JSON.parse(responseText);
    console.log('[LLM] Parsed:', parsed);

    // Check for error response from LLM
    if (parsed.error) {
      return {
        success: false,
        error: parsed.error,
        confidence: parsed.confidence || 0,
        rawTranscript: transcript,
        llmProvider: provider,
        latency
      };
    }

    // Success
    return {
      success: true,
      intent: parsed.intent,
      entities: parsed.entities || {},
      confidence: parsed.confidence || 0.8,
      action: parsed.action || 'Action recognized',
      rawTranscript: transcript,
      llmProvider: provider,
      latency
    };

  } catch (error) {
    console.error('LLM interpretation error:', error);
    return {
      success: false,
      error: `LLM error: ${error.message}`,
      rawTranscript: transcript
    };
  }
}

/**
 * Test function to verify LLM is working
 */
export async function testLLMConnection() {
  const testCommand = "player 12 enters ice";
  const result = await interpretCommandWithLLM(testCommand);
  return result;
}

