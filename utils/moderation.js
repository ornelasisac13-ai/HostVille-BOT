// ===============================
// utils/moderation.js - FUNÇÕES PARA CHECAR PALAVRAS OFENSIVAS
// ===============================

// NOTA: A lista de palavras ofensivas será importada do index.js
// Este arquivo será atualizado depois

function containsOffensiveWord(text, offensiveWords) {
  if (!text || typeof text !== 'string') return false;
  
  const textLower = text.toLowerCase().trim();
  
  for (const offensivePhrase of offensiveWords) {
    if (offensivePhrase.includes(' ') && textLower.includes(offensivePhrase)) {
      return true;
    }
  }
  
  const textNormalized = textLower
    .replace(/[^\w\sà-úÀ-Ú]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = textNormalized.split(' ');
  
  for (const word of words) {
    if (word.length < 3) continue;
    
    if (offensiveWords.includes(word)) {
      return true;
    }
    
    const leetMap = {
      '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', 
      '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
      '@': 'a', '!': 'i', '$': 's', '#': 'h', '&': 'e'
    };
    
    let normalizedWord = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      normalizedWord += leetMap[char] || char;
    }
    
    if (offensiveWords.includes(normalizedWord)) {
      return true;
    }
  }
  
  return false;
}

function findOffensiveWord(text, offensiveWords) {
  if (!text || typeof text !== 'string') return null;
  
  const textLower = text.toLowerCase().trim();
  
  for (const offensivePhrase of offensiveWords) {
    if (offensivePhrase.includes(' ') && textLower.includes(offensivePhrase)) {
      return offensivePhrase;
    }
  }
  
  const textNormalized = textLower
    .replace(/[^\w\sà-úÀ-Ú]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = textNormalized.split(' ');
  
  for (const word of words) {
    if (word.length < 3) continue;
    
    if (offensiveWords.includes(word)) {
      return word;
    }
    
    const leetMap = {
      '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', 
      '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
      '@': 'a', '!': 'i', '$': 's', '#': 'h', '&': 'e'
    };
    
    let normalizedWord = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      normalizedWord += leetMap[char] || char;
    }
    
    if (offensiveWords.includes(normalizedWord)) {
      return word;
    }
  }
  
  return null;
}

module.exports = {
  containsOffensiveWord,
  findOffensiveWord
};
