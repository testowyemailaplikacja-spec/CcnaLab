/**
 * Non-invasive authoring export. Does not load into legacy UI automatically.
 * One source card yields flashcard, A/B variants and ABCD from the same options.
 * Stable source IDs are preserved: no re-numbering of historical cards.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateLesson, deriveAB } from './validate-ccna-lesson.mjs';

export function buildLessonPack(lesson) {
  const errors=validateLesson(lesson);
  if(errors.length)throw new Error('Niepoprawny materiał: '+errors.join('; '));
  return {
    schemaVersion:1,
    id:lesson.id,
    sectionId:lesson.sectionId,
    titleEn:lesson.titleEn,
    source:{url:lesson.source.url,title:lesson.source.title},
    expandedNote:lesson.expandedNote,
    objectives:lesson.objectives,
    items:lesson.cards.filter(card=>card.status!=='archived').map(card=>({
      id:card.id,
      objectiveId:card.objectiveId,
      noteBlockId:card.noteBlockId,
      explanation:card.explanation,
      flashcard:{id:card.id,question:card.question,answer:card.options[card.correctIndex]},
      abVariants:[0,1,2].map(index=>deriveAB(card,index)),
      abcd:{id:card.id,question:card.question,options:[...card.options],correctIndex:card.correctIndex}
    })),
    laboratory:JSON.parse(JSON.stringify(lesson.laboratory))
  };
}

async function main(){
 const [sourceFile,outputFile]=process.argv.slice(2);
 if(!sourceFile||!outputFile)throw new Error('Użycie: node scripts/build-ccna-lesson-pack.mjs source.json dist.json');
 const data=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
 const result=buildLessonPack(data);
 if(fs.existsSync(outputFile))throw new Error('Plik wynikowy istnieje; nie nadpisuj bez kontroli: '+outputFile);
 fs.mkdirSync(path.dirname(outputFile),{recursive:true});
 fs.writeFileSync(outputFile,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:'PASS_STRUCTURAL_ONLY',output:outputFile,sectionId:result.sectionId,cards:result.items.length,abVariants:result.items.length*3,lab:result.laboratory.id}));
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await main();
