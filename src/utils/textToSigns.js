let islDictionary = null;

// Fallback letter map for A-Z
const LETTER_MAP = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(char => {
  LETTER_MAP[char] = `/letters/${char}.jpg`;
});

export const loadDictionary = async () => {
  if (islDictionary) return islDictionary;
  try {
    const response = await fetch('/ISL_Gifs.json');
    const data = await response.json();
    // Sort by longest search phrase first for greedy matching
    islDictionary = data.sort((a, b) => {
      const maxLenA = Math.max(...(a.searchKeys || [a.word]).map(k => k.length));
      const maxLenB = Math.max(...(b.searchKeys || [b.word]).map(k => k.length));
      return maxLenB - maxLenA;
    });
    return islDictionary;
  } catch (error) {
    console.error("Failed to load ISL glossary", error);
    return [];
  }
};

/**
 * Translates input text into a sequence of ISL visual sign cards.
 * If a full phrase or word GIF is available, it uses the whole sign.
 * If a word is not in the dictionary, it automatically fingerspells the word letter-by-letter.
 */
export const translateTextToSigns = async (text) => {
  if (!text || !text.trim()) return [];

  const dict = await loadDictionary();

  // Normalize: lower case, expand basic contractions, remove punctuation
  let normalized = text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const results = [];
  let remaining = normalized;

  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (!remaining) break;

    let matched = false;

    // 1. Try to find a phrase or whole-word match in dictionary (excluding single letters initially)
    if (dict && dict.length > 0) {
      for (const entry of dict) {
        // Skip single-letter dictionary entries in phrase match pass to allow better word checks
        if (entry.word.length === 1 && !entry.gif) continue;

        const searchKeys = entry.searchKeys || [entry.word.toLowerCase()];
        for (const key of searchKeys) {
          const lowerKey = key.toLowerCase().trim();
          if (!lowerKey) continue;

          // Check if remaining string starts with this phrase/word at word boundary
          if (
            remaining === lowerKey ||
            remaining.startsWith(lowerKey + ' ')
          ) {
            const visualSrc = entry.gif || entry.image;
            if (visualSrc) {
              results.push({
                type: entry.gif ? 'phrase' : 'word',
                value: visualSrc,
                label: entry.word,
                original: entry.word,
                isFingerspelled: false,
                wordGroup: entry.word
              });
              remaining = remaining.substring(lowerKey.length).trim();
              matched = true;
              break;
            }
          }
        }
        if (matched) break;
      }
    }

    // 2. If no whole-phrase or word match, take the next single word and fingerspell it
    if (!matched) {
      const spaceIdx = remaining.indexOf(' ');
      const currentWord = spaceIdx === -1 ? remaining : remaining.substring(0, spaceIdx);
      remaining = spaceIdx === -1 ? '' : remaining.substring(spaceIdx + 1).trim();

      if (currentWord) {
        // Fingerspell each character of the word
        for (let i = 0; i < currentWord.length; i++) {
          const char = currentWord[i];
          const letterImg = LETTER_MAP[char];

          if (letterImg) {
            results.push({
              type: 'letter',
              value: letterImg,
              label: char.toUpperCase(),
              original: currentWord,
              isFingerspelled: true,
              wordGroup: currentWord,
              letterIndex: i,
              letterTotal: currentWord.length
            });
          }
        }
      }
    }
  }

  return results;
};
