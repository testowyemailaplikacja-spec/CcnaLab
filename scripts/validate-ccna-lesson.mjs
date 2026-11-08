/**
 * CCNAlab lesson authoring gate v1.
 * Only validates proposed structured lesson files; does not touch legacy.html,
 * progress or existing Packet Lab. Semantic/technical truth requires human review.
 * Usage: node scripts/validate-ccna-lesson.mjs path/to/lesson.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const normalizeOption = value => String(value ?? '')
  .normalize('NFKC').toLocaleLowerCase('pl-PL')
  .replace(/(\d),(\d)/g, '$1.$2')
  .replace(/[()[\]{};:!?'"`]|,(?!\d)|\.(?!\d)/g, '')
  .replace(/\s+/g, ' ').trim();

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const rows = value => Array.isArray(value) ? value : [];
const validTime = value => typeof value === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(value);
const timeSecs = value => String(value).split(':').reduce((acc, x) => acc * 60 + Number(x), 0);
const videoRefs = /\b(?:w (?:tym )?(?:filmie|nagraniu|quizie)|na (?:tym )?(?:filmie|nagraniu)|day\s*0?\d+|source:|źródło:|z filmu|pokazany w lekcji)\b/i;

function uniqueIds(items, at, errors) {
  const ids = new Set();
  for (let i = 0; i < items.length; i++) {
    const id = items[i]?.id;
    if (!nonEmpty(id)) errors.push(`${at}[${i}].id: brak ID`);
    else if (ids.has(id)) errors.push(`${at}[${i}].id: duplikat ${id}`);
    ids.add(id);
  }
  return ids;
}

/** Returns errors. Empty array means the structural gate passes, not content correctness. */
export function validateLesson(lesson) {
  const errors = [];
  if (!isRecord(lesson)) return ['root: wymagany obiekt lekcji'];
  if (lesson.schemaVersion !== 1) errors.push('schemaVersion: wymagana wersja 1');
  for (const key of ['id','sectionId','titleEn']) if (!nonEmpty(lesson[key])) errors.push(`${key}: brak wartości`);
  if (!isRecord(lesson.source)) errors.push('source: brak obiektu źródła');
  else {
    if (!nonEmpty(lesson.source.url) || !/^https:\/\//.test(lesson.source.url)) errors.push('source.url: wymagany URL https');
    if (!nonEmpty(lesson.source.title)) errors.push('source.title: wymagany tytuł');
    if (lesson.source.verified !== true) errors.push('source.verified: brak weryfikacji materiału');
    if (lesson.source.rightsReviewed !== true) errors.push('source.rightsReviewed: brak kontroli praw');
  }
  const sb = rows(lesson.sourceNote?.blocks), nb = rows(lesson.expandedNote?.blocks);
  if (!sb.length) errors.push('sourceNote.blocks: wymagana notatka źródłowa');
  if (!nb.length) errors.push('expandedNote.blocks: wymagana notatka rozwinięta');
  const sourceIds = uniqueIds(sb, 'sourceNote.blocks', errors);
  const noteIds = uniqueIds(nb, 'expandedNote.blocks', errors);
  sb.forEach((block,i) => {
    if (!nonEmpty(block?.text)) errors.push(`sourceNote.blocks[${i}].text: puste`);
    if (!validTime(block?.start) || !validTime(block?.end) || timeSecs(block.start) >= timeSecs(block.end)) errors.push(`sourceNote.blocks[${i}]: niepoprawne znaczniki czasu`);
  });
  nb.forEach((block,i) => {
    if (!nonEmpty(block?.headingEn) || !nonEmpty(block?.markdown) || block.markdown.trim().length < 10) errors.push(`expandedNote.blocks[${i}]: za mało treści`);
  });
  const objectives = rows(lesson.objectives);
  if (!objectives.length) errors.push('objectives: brak celów nauki');
  const objIds = uniqueIds(objectives, 'objectives', errors);
  objectives.forEach((o,i) => {
    if (!nonEmpty(o?.statement)) errors.push(`objectives[${i}]: pusty opis`);
    if (!rows(o?.sourceBlockIds).length) errors.push(`objectives[${i}]: brak źródła celu`);
    if (!rows(o?.noteBlockIds).length) errors.push(`objectives[${i}]: brak rozwinięcia celu`);
    for (const id of rows(o?.sourceBlockIds)) if (!sourceIds.has(id)) errors.push(`objectives[${i}]: nieznany blok źródłowy ${id}`);
    for (const id of rows(o?.noteBlockIds)) if (!noteIds.has(id)) errors.push(`objectives[${i}]: nieznany blok notatki ${id}`);
  });
  const objMap = new Map(objectives.map(o => [o.id, o]));
  const cards = rows(lesson.cards);
  if (!cards.length) errors.push('cards: brak kart');
  uniqueIds(cards, 'cards', errors);
  cards.forEach((card,i) => {
    if (!objIds.has(card?.objectiveId)) errors.push(`cards[${i}]: obcy cel wiedzy ${card?.objectiveId}`);
    if (!noteIds.has(card?.noteBlockId)) errors.push(`cards[${i}]: brak powiązanego bloku notatki`);
    if (objMap.has(card?.objectiveId) && !rows(objMap.get(card.objectiveId).noteBlockIds).includes(card.noteBlockId)) errors.push(`cards[${i}]: blok notatki poza celem`);
    if (!nonEmpty(card?.question) || card.question.trim().length < 10) errors.push(`cards[${i}]: zbyt krótkie pytanie`);
    if (videoRefs.test(String(card?.question || ''))) errors.push(`cards[${i}]: pytanie zależne od filmu/metadanych`);
    if (!nonEmpty(card?.explanation) || card.explanation.trim().length < 10) errors.push(`cards[${i}]: brak wyjaśnienia`);
    if (!Array.isArray(card?.options) || card.options.length !== 4) errors.push(`cards[${i}].options: wymagane dokładnie 4 odpowiedzi`);
    else {
      const options = card.options.map(normalizeOption);
      if (options.some(x => !x)) errors.push(`cards[${i}].options: pusta odpowiedź`);
      if (new Set(options).size !== 4) errors.push(`cards[${i}].options: identyczne lub równoważne zapisem warianty`);
      if (!Number.isInteger(card.correctIndex) || card.correctIndex < 0 || card.correctIndex > 3) errors.push(`cards[${i}].correctIndex: niepoprawny indeks`);
    }
  });
  const lab = lesson.laboratory;
  if (!isRecord(lab)) errors.push('laboratory: wymagane jedno dedykowane laboratorium sekcji');
  else {
    for (const key of ['id','titleEn']) if (!nonEmpty(lab[key])) errors.push(`laboratory.${key}: brak wartości`);
    if (!nonEmpty(lab.sourceUrl) || !/^https:\/\//.test(lab.sourceUrl)) errors.push('laboratory.sourceUrl: wymagane źródło');
    if (!Array.isArray(lab.commands)) errors.push('laboratory.commands: wymagana lista rzeczywistych komend (może być pusta)');
    else {
      if (lab.commands.length === 0 && lab.noCli !== true) errors.push('laboratory: dla materiału bez CLI wymagane noCli=true');
      for (let i=0; i<lab.commands.length; i++) {
        const cmd=lab.commands[i]; if (!['device','mode','command','expected'].every(k=>nonEmpty(cmd?.[k]))) errors.push(`laboratory.commands[${i}]: niekompletna komenda`);
      }
    }
    if (rows(lab.steps).length < 2 || rows(lab.steps).some(x=>!nonEmpty(x))) errors.push('laboratory.steps: potrzebne co najmniej dwa kroki');
    if (!rows(lab.positiveChecks).length) errors.push('laboratory.positiveChecks: brak przypadku pozytywnego');
    if (!rows(lab.negativeChecks).length) errors.push('laboratory.negativeChecks: brak przypadku błędnego');
    if (!Object.hasOwn(lab,'packetTracerLink')) errors.push('laboratory.packetTracerLink: wymagany URL lub null (brak dostępnego pliku)');
    else if (lab.packetTracerLink !== null && (!nonEmpty(lab.packetTracerLink) || !/^https:\/\//.test(lab.packetTracerLink))) errors.push('laboratory.packetTracerLink: wymagany https lub null');
  }
  return errors;
}

/** Two-answer mode is a projection of the SAME four-option card; no cross-card distractors. */
export function deriveAB(card, wrongVariant = 0) {
  if (!isRecord(card) || !Array.isArray(card.options) || card.options.length !== 4 || !Number.isInteger(card.correctIndex) || card.correctIndex < 0 || card.correctIndex > 3) throw new Error('Niepoprawna karta ABCD');
  const wrong = card.options.filter((_, i) => i !== card.correctIndex);
  const normalized = card.options.map(normalizeOption);
  if (normalized.some(x=>!x) || new Set(normalized).size !== 4) throw new Error('Niejednoznaczne warianty');
  if (!Number.isInteger(wrongVariant) || wrongVariant < 0 || wrongVariant > 2) throw new Error('Indeks błędnego dystraktora 0..2');
  return { question: card.question, options: [card.options[card.correctIndex], wrong[wrongVariant]], correctIndex: 0, cardId: card.id };
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Użycie: node scripts/validate-ccna-lesson.mjs sciezka/lekcja.json'); process.exitCode=2; return; }
  try {
    const lesson=JSON.parse(fs.readFileSync(file,'utf8'));
    const errors=validateLesson(lesson);
    if (errors.length) { console.error(JSON.stringify({file,status:'FAIL',errors},null,2)); process.exitCode=1; }
    else console.log(JSON.stringify({file,status:'PASS_STRUCTURAL_ONLY',cards:lesson.cards.length,objectives:lesson.objectives.length,lab:lesson.laboratory.id},null,2));
  } catch (e) { console.error(String(e)); process.exitCode=2; }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
