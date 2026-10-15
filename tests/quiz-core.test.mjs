import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshState,resetAllStoredProgress,STORAGE_KEY,LEGACY_STORAGE_KEY,OLDEST_STORAGE_KEY,normalizeState,counts,selectQuestions,startPaper,recordAnswer,summarize,QUESTION_SECONDS,MIN_QUESTION_SECONDS,MAX_QUESTION_SECONDS,getQuestionSeconds,MASTERY_CORRECT_REQUIRED,ensureChoiceOrders } from '../js/quiz-core.mjs';
const data=JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url),'utf8'));
const questions=data.slice(0,12);
const seeded=()=>0.271828;
test('Question bank excludes Q153 and contains 171 complete records',()=>{
 assert.equal(data.length,171);
 assert.equal(data.some(q=>q.id===153),false);
 assert.equal(new Set(data.map(q=>q.id)).size,171);
 assert.ok(data.every(q=>q.choices.length===4&&q.correct_option>=1&&q.correct_option<=4));
});
test('Default and configurable time limits are bounded from 10 to 300 seconds',()=>{
 assert.equal(QUESTION_SECONDS,30);assert.equal(MIN_QUESTION_SECONDS,10);assert.equal(MAX_QUESTION_SECONDS,300);
 const s=freshState();assert.equal(s.settings.questionSeconds,30);
 for(const n of [10,15,30,45,60,120,300]){
  startPaper(s,questions,2,seeded,1000,n);
  assert.equal(getQuestionSeconds(s.active),n);
  const r=summarize(s,1500);assert.equal(r.questionSeconds,n);
 }
 assert.throws(()=>startPaper(s,questions,1,seeded,1000,9),/between 10 and 300/);
 assert.throws(()=>startPaper(s,questions,1,seeded,1000,301),/between 10 and 300/);
 assert.throws(()=>startPaper(s,questions,1,seeded,1000,24.5),/between 10 and 300/);
});
test('Preferences persist, in-progress timers do not change, and legacy timers default to 30s',()=>{
 const s=freshState();s.settings.questionSeconds=45;
 startPaper(s,questions,2,seeded,1000,45);
 s.settings.questionSeconds=120;
 const loaded=normalizeState(JSON.parse(JSON.stringify(s)),questions);
 assert.equal(loaded.settings.questionSeconds,120);
 assert.equal(getQuestionSeconds(loaded.active),45);
 delete loaded.active.questionSeconds;
 const migrated=normalizeState(loaded,questions);
 assert.equal(getQuestionSeconds(migrated.active),30);
 assert.equal(getQuestionSeconds(migrated.history[0]),30);
 const invalid=normalizeState({...s,settings:{questionSeconds:501},active:{...s.active,questionSeconds:0}},questions);
 assert.equal(invalid.settings.questionSeconds,30);
 assert.equal(getQuestionSeconds(invalid.active),30);
});
test('Selects requested unique random questions',()=>{
 const s=freshState(),ids=selectQuestions(s,questions,10,seeded);
 assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);
});

test('Answer choices shuffle once per paper and retain their saved order',()=>{
 const s=freshState();startPaper(s,questions,4,seeded,1000);
 for(const id of s.active.ids){
  const expected=questions.find(q=>q.id===id).choices.map(choice=>choice.number).sort();
  assert.deepEqual([...s.active.choiceOrders[id]].sort(),expected);
 }
 const saved=JSON.parse(JSON.stringify(s.active.choiceOrders));
 ensureChoiceOrders(s,questions,()=>0.999);
 assert.deepEqual(s.active.choiceOrders,saved);
 const old={...s,active:{...s.active,choiceOrders:undefined}};
 ensureChoiceOrders(old,questions,()=>0);
 assert.equal(Object.keys(old.active.choiceOrders).length,old.active.ids.length);
});
test('Three separate correct papers are required for mastery',()=>{
 const s=freshState();assert.equal(MASTERY_CORRECT_REQUIRED,3);
 let id,correct;
 for(let number=1;number<=3;number++){
  startPaper(s,questions,questions.length,seeded,1000*number);
  if(!id){id=s.active.ids[0];correct=questions.find(q=>q.id===id).correct_option;}
  assert.ok(s.active.ids.includes(id));
  recordAnswer(s,id,correct,correct,'answer',1000*number+100);
  const entry=s.progress[id];
  assert.equal(entry.correctCount,number);
  assert.equal(entry.status,number===3?'mastered':'seen');
  summarize(s,1000*number+300);
 }
 assert.equal(counts(s,questions).mastered,1);
 assert.equal(selectQuestions(s,questions,questions.length-1,seeded).includes(id),false);
});
test('Wrong answers stay prioritized, do not reset correct credits, and mastery clears queue',()=>{
 const s=freshState();const id=questions[0].id,correct=questions[0].correct_option;
 startPaper(s,questions,questions.length,seeded,1000);
 recordAnswer(s,id,correct,correct,'answer',1100);summarize(s,1300);
 assert.equal(s.progress[id].correctCount,1);
 startPaper(s,questions,questions.length,seeded,2000);
 recordAnswer(s,id,correct===1?2:1,correct,'answer',2100);summarize(s,2200);
 assert.equal(s.progress[id].status,'wrong');assert.equal(s.progress[id].correctCount,1);
 startPaper(s,questions,2,seeded,3000);assert.ok(s.active.ids.includes(id));
 recordAnswer(s,id,correct,correct,'answer',3100);summarize(s,3200);
 assert.equal(s.progress[id].status,'seen');assert.equal(s.progress[id].correctCount,2);
 startPaper(s,questions,questions.length,seeded,4000);assert.ok(s.active.ids.includes(id));
 recordAnswer(s,id,correct,correct,'answer',4100);summarize(s,4200);
 assert.equal(s.progress[id].status,'mastered');assert.equal(s.progress[id].correctCount,3);
 assert.equal(counts(s,questions).wrong,0);
});
test('Learning papers mix previously correct questions with never-seen questions',()=>{
 const s=freshState();
 for(let i=0;i<6;i++)s.progress[questions[i].id]={status:'seen',attempts:1,correctCount:1,lastAttemptAt:100+i};
 const batch=selectQuestions(s,questions,8,seeded);
 assert.equal(batch.length,8);assert.equal(new Set(batch).size,8);
 const seen=batch.filter(id=>id<=questions[5].id).length;
 assert.ok(seen>0&&seen<8,`Expected learning+unseen mix, got ${seen}/8`);
});
test('Homepage counts practiced questions once and keeps status categories exclusive',()=>{
 const s=freshState();
 s.progress[questions[0].id]={status:'mastered',attempts:3,correctCount:3,lastAttemptAt:100};
 s.progress[questions[1].id]={status:'wrong',attempts:2,correctCount:1,lastAttemptAt:200};
 s.progress[questions[2].id]={status:'seen',attempts:1,correctCount:1,lastAttemptAt:300};
 const c=counts(s,questions);
 assert.equal(c.practiced,3);
 assert.equal(c.mastered+c.wrong+c.seen+c.unseen,c.total);
 assert.equal(c.unseen,questions.length-3);
});
test('Review queue rotates oldest mistakes when it exceeds requested count',()=>{
 const s=freshState();for(let i=0;i<5;i++)s.progress[questions[i].id]={status:'wrong',attempts:1,lastAttemptAt:100+i};
 const batch=selectQuestions(s,questions,3,seeded);assert.deepEqual(new Set(batch),new Set(questions.slice(0,3).map(q=>q.id)));
 // After practice, more recent attempts should make older unreviewed mistakes highest priority.
 for(const id of batch)s.progress[id].lastAttemptAt=999;
 const next=selectQuestions(s,questions,2,seeded);assert.deepEqual(new Set(next),new Set(questions.slice(3,5).map(q=>q.id)));
});
test('Incomplete answers are counted wrong at submission by caller',()=>{
 const s=freshState();startPaper(s,questions,2,seeded,100);
 for(const id of s.active.ids)recordAnswer(s,id,null,questions.find(q=>q.id===id).correct_option,'skipped',150);
 const result=summarize(s,200);assert.equal(result.correct,0);assert.equal(result.incorrect,2);
 assert.equal(counts(s,questions).wrong,2);
});
test('V2 storage migration preserves history and converts old mastery to correct credits',()=>{
 const id=questions[0].id,other=questions[1].id;
 const v2={version:2,settings:{questionSeconds:45},progress:{
   [id]:{status:'mastered',attempts:2,lastAttemptAt:123},
   [other]:{status:'mastered',attempts:1,lastAttemptAt:124},9999:{status:'mastered',attempts:1}
  },history:[{count:2,results:[{id,correct:true},{id:other,correct:false}]}],active:null};
 const s=normalizeState(v2,questions);assert.equal(s.version,3);
 assert.equal(Object.keys(s.progress).length,2);
 assert.equal(s.progress[id].status,'seen');assert.equal(s.progress[id].correctCount,1);
 assert.equal(s.progress[other].status,'seen');assert.equal(s.progress[other].correctCount,1);
 assert.equal(s.settings.questionSeconds,45);
 const repeat=normalizeState({...v2,history:[{count:1,results:[{id,correct:true}]},{count:1,results:[{id,correct:true}]},{count:1,results:[{id,correct:true}]}]},questions);
 assert.equal(repeat.progress[id].status,'mastered');assert.equal(repeat.progress[id].correctCount,3);
});
test('V1 legacy old mastered entries start at one correct credit rather than three',()=>{
 const v1={version:1,mastered:[questions[0].id,9999],wrong:[questions[1].id],seen:[questions[0].id,questions[1].id],history:[]};
 const s=normalizeState(v1,questions);assert.equal(s.version,3);assert.equal(Object.keys(s.progress).length,2);
 assert.equal(s.progress[questions[0].id].status,'seen');assert.equal(s.progress[questions[0].id].correctCount,1);
});
test('V3 state round trips without changing correct credits or timer',()=>{
 const s=freshState(),id=questions[0].id;
 s.progress[id]={status:'seen',correctCount:2,attempts:3,lastAttemptAt:300};
 s.settings.questionSeconds=120;
 const migrated=normalizeState(JSON.parse(JSON.stringify(s)),questions);
 assert.deepEqual(migrated.progress[id],s.progress[id]);assert.equal(migrated.settings.questionSeconds,120);
});
test('Question count cannot exceed available unmastered pool',()=>{
 const s=freshState();for(let i=0;i<11;i++)s.progress[questions[i].id]={status:'mastered',correctCount:3,attempts:3,lastAttemptAt:0};
 assert.throws(()=>selectQuestions(s,questions,2,seeded),/between 1 and 1/);
 assert.equal(selectQuestions(s,questions,1,seeded).length,1);
});

test('Reset clears every legacy and current quiz key while preserving unrelated browser data',()=>{
 const kv=new Map([[STORAGE_KEY,JSON.stringify({version:3,progress:{1:{status:'mastered',correctCount:3}},history:[{count:1}],active:{ids:[1]}})],
 [LEGACY_STORAGE_KEY,'old-v2-data'],[OLDEST_STORAGE_KEY,'old-v1-data'],['unrelated-web-app','leave-me-alone']]);
 const mock={removeItem:key=>kv.delete(key),setItem:(key,value)=>kv.set(key,value),getItem:key=>kv.get(key)||null};
 const after=resetAllStoredProgress(mock);
 assert.deepEqual(after,freshState());
 assert.deepEqual(JSON.parse(kv.get(STORAGE_KEY)),freshState());
 assert.equal(kv.has(LEGACY_STORAGE_KEY),false);
 assert.equal(kv.has(OLDEST_STORAGE_KEY),false);
 assert.equal(kv.get('unrelated-web-app'),'leave-me-alone');
 assert.equal(counts(after,data).available,171);
 assert.equal(after.settings.questionSeconds,30);
 assert.equal(after.active,null);
 assert.equal(after.history.length,0);
});
