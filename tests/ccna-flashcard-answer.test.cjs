// CCNA-specific regression: a correct English answer must not receive its own translation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
const begin = source.indexOf('    const CCNA_FLASHCARD_TERMS = [');
const end = source.indexOf('    function reviewStats(', begin);
assert.ok(begin >= 0 && end > begin, 'CCNA flashcard translation helper is present');
const createFormatter = new Function('getLatinSection', source.slice(begin, end) + '\nreturn bilingualFlashcardAnswer;');
const format = createFormatter(() => ({entries: [
  {translation: 'światłowód wielomodowy', english: 'multimode fiber (MMF)'},
  {translation: 'światłowód jednomodowy', english: 'single-mode fiber (SMF)'}
]}));

test('CCNA flashcards avoid parenthetical repetition for already-English technical terms', () => {
  assert.equal(format('Multimode fiber (MMF).'), 'Multimode fiber (MMF).');
  assert.equal(format('Single-mode fiber (SMF).'), 'Single-mode fiber (SMF).');
  assert.equal(format('MAC address table'), 'MAC address table');
  assert.equal(format('Copper Straight-Through Cable.'), 'Copper Straight-Through Cable.');
});

test('CCNA flashcards retain useful translations and avoid appending them twice', () => {
  assert.equal(format('światłowód wielomodowy'), 'światłowód wielomodowy (multimode fiber (MMF))');
  assert.equal(format('światłowód wielomodowy (multimode fiber (MMF))'), 'światłowód wielomodowy (multimode fiber (MMF))');
  assert.equal(format('światłowód jednomodowy'), 'światłowód jednomodowy (single-mode fiber (SMF))');
  assert.equal(format('automatyczna negocjacja.'), 'automatyczna negocjacja (autonegotiation).');
});
