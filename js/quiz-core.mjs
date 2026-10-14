/** Pure, browser-independent question-selection and learning-progress rules. */
export const STORAGE_KEY = 'sl-driving-quiz-v3';
export const LEGACY_STORAGE_KEY = 'sl-driving-quiz-v2';
export const OLDEST_STORAGE_KEY = 'sl-driving-quiz-v1';
export const MASTERY_CORRECT_REQUIRED = 3;
export const QUESTION_SECONDS = 30; // Default for new and legacy papers.
export const MIN_QUESTION_SECONDS = 10;
export const MAX_QUESTION_SECONDS = 300;
export const getQuestionSeconds = active => Number.isInteger(active?.questionSeconds) && active.questionSeconds >= MIN_QUESTION_SECONDS && active.questionSeconds <= MAX_QUESTION_SECONDS ? active.questionSeconds : QUESTION_SECONDS;
export const MAX_HISTORY = 50;

export function freshState(){return {version:3,settings:{questionSeconds:QUESTION_SECONDS},progress:{},history:[],active:null};}
/** Reset only this application's localStorage entries, not the browser's other data.
 * Legacy entries must also be removed to prevent previously learned questions
 * being restored on a later reload/migration. Called only after confirmation.
 */
export function resetAllStoredProgress(storage){
 const fresh=freshState();
 for(const key of [STORAGE_KEY,LEGACY_STORAGE_KEY,OLDEST_STORAGE_KEY])storage.removeItem(key);
 storage.setItem(STORAGE_KEY,JSON.stringify(fresh));
 return fresh;
}
export function shuffle(items,random=Math.random){
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function ensureChoiceOrders(state,questions,random=Math.random){
 if(!state.active)return null;
 const byId=new Map(questions.map(q=>[q.id,q]));
 const existing=state.active.choiceOrders&&typeof state.active.choiceOrders==='object'?state.active.choiceOrders:{};
 const choiceOrders={};
 for(const id of state.active.ids){
  const numbers=(byId.get(id)?.choices||[]).map(choice=>choice.number);
  const saved=existing[id];
  const valid=Array.isArray(saved)&&saved.length===numbers.length&&new Set(saved).size===numbers.length&&saved.every(number=>numbers.includes(number));
  choiceOrders[id]=valid?[...saved]:shuffle(numbers,random);
 }
 state.active.choiceOrders=choiceOrders;
 return choiceOrders;
}
const correctCountOf = entry => Math.max(0,Math.min(MASTERY_CORRECT_REQUIRED,Math.trunc(Number(entry?.correctCount)||0)));

// V2 only had a mastered flag. Infer past successes from saved result history
// (and an unfinished paper), never grant three credits from a single old success.
function historicalCorrectCounts(input,valid){
 const counts=new Map();
 function capture(row){
  const id=Number(row?.id);
  if(row?.correct===true&&valid.has(id))counts.set(id,(counts.get(id)||0)+1);
 }
 for(const result of (Array.isArray(input?.history)?input.history:[])){
  for(const row of (Array.isArray(result?.results)?result.results:[]))capture(row);
 }
 if(input?.active?.answers){
  for(const [id,answer] of Object.entries(input.active.answers))capture({id,correct:answer?.correct});
 }
 return counts;
}
export function normalizeState(input,questions){
 const valid=new Set(questions.map(q=>q.id));const data=freshState();
 if(input&&[2,3].includes(input.version)){
  const historical=input.version===2?historicalCorrectCounts(input,valid):new Map();
  data.settings.questionSeconds=getQuestionSeconds({questionSeconds:input.settings?.questionSeconds});
  for(const [id,entry] of Object.entries(input.progress||{})){
   if(!valid.has(Number(id))||!entry||!['wrong','mastered','seen'].includes(entry.status))continue;
   const correctCount=input.version===3 ? correctCountOf(entry)
    :Math.max(Math.min(MASTERY_CORRECT_REQUIRED,historical.get(Number(id))||0),entry.status==='mastered'?1:0);
   const status=correctCount>=MASTERY_CORRECT_REQUIRED?'mastered'
     :entry.status==='wrong'?'wrong':'seen';
   data.progress[id]={status,correctCount,attempts:Math.max(0,Number(entry.attempts)||0),lastAttemptAt:Number(entry.lastAttemptAt)||0};
  }
  data.history=(Array.isArray(input.history)?input.history:[]).filter(h=>h&&Number.isInteger(h.count)).slice(0,MAX_HISTORY);
  if(input.active&&Array.isArray(input.active.ids)&&input.active.ids.length&&input.active.ids.every(id=>valid.has(id))&&new Set(input.active.ids).size===input.active.ids.length&&Number.isInteger(input.active.index)&&input.active.index>=0&&input.active.index<input.active.ids.length){
   data.active={...input.active,questionSeconds:getQuestionSeconds(input.active),answers:input.active.answers||{},openedAt:input.active.openedAt||{}};
  }
 }else if(input&&input.version===1){
  const seen=new Set(input.seen||[]),wrong=new Set(input.wrong||[]),mastered=new Set(input.mastered||[]);
  for(const id of valid){
   if(mastered.has(id)||wrong.has(id)||seen.has(id)){
    data.progress[id]={status:wrong.has(id)?'wrong':'seen',correctCount:mastered.has(id)?1:0,attempts:1,lastAttemptAt:0};
   }
  }
  data.history=Array.isArray(input.history)?input.history.slice(0,MAX_HISTORY):[];
  if(input.active&&Array.isArray(input.active.ids)&&input.active.ids.every(id=>valid.has(id)))data.active={...input.active,questionSeconds:getQuestionSeconds(input.active),answers:input.active.answers||{},openedAt:input.active.openedAt||{}};
 }
 return data;
}
export function counts(state,questions){
 const c={total:questions.length,mastered:0,wrong:0,unseen:0,seen:0,learning:0,available:0};
 for(const q of questions){
  const entry=state.progress[q.id],status=entry?.status;
  if(status==='mastered')c.mastered++;
  else if(status==='wrong')c.wrong++;
  else if(status==='seen')c.seen++;
  else c.unseen++;
  if(status!=='mastered'&&correctCountOf(entry)>0)c.learning++;
 }
 c.available=c.total-c.mastered;return c;
}
export function selectQuestions(state,questions,count,random=Math.random){
 const total=counts(state,questions).available;
 if(!Number.isInteger(count)||count<1||count>total)throw new Error(`Choose between 1 and ${total} questions.`);
 // Always prioritize wrong/skipped/timed-out questions. Rotate oldest first.
 const wrong=shuffle(questions.filter(q=>state.progress[q.id]?.status==='wrong'),random)
  .sort((a,b)=>(state.progress[a.id]?.lastAttemptAt||0)-(state.progress[b.id]?.lastAttemptAt||0));
 const selected=wrong.slice(0,count);
 const slots=count-selected.length;
 if(slots>0){
  const learning=shuffle(questions.filter(q=>state.progress[q.id]?.status==='seen'),random)
   .sort((a,b)=>(state.progress[a.id]?.lastAttemptAt||0)-(state.progress[b.id]?.lastAttemptAt||0));
  const unseen=shuffle(questions.filter(q=>!state.progress[q.id]),random);
  // Keep papers fresh while still repeating successful-but-not-mastered questions.
  // When unseen questions exist, reserve up to half the remaining slots for them.
  const reservedNew=Math.min(unseen.length,Math.ceil(slots/2));
  selected.push(...learning.slice(0,slots-reservedNew));
  selected.push(...unseen.slice(0,count-selected.length));
  if(selected.length<count){
   const picked=new Set(selected.map(q=>q.id));
   selected.push(...learning.filter(q=>!picked.has(q.id)).slice(0,count-selected.length));
  }
 }
 return shuffle(selected.map(q=>q.id),random);
}
export function recordAnswer(state,id,choice,correctOption,reason='answer',timestamp=Date.now()){
 if(!state.active)throw new Error('There is no active paper.');
 if(state.active.answers[id])return false;
 const correct=choice===correctOption;
 state.active.answers[id]={choice,correct,reason,at:timestamp};
 const previous=state.progress[id];
 const correctCount=Math.min(MASTERY_CORRECT_REQUIRED,correctCountOf(previous)+(correct?1:0));
 state.progress[id]={status:correctCount>=MASTERY_CORRECT_REQUIRED?'mastered':correct?'seen':'wrong',
  correctCount,attempts:(previous?.attempts||0)+1,lastAttemptAt:timestamp};
 return true;
}
export function startPaper(state,questions,count,random=Math.random,now=Date.now(),questionSeconds=QUESTION_SECONDS){
 if(!Number.isInteger(questionSeconds)||questionSeconds<MIN_QUESTION_SECONDS||questionSeconds>MAX_QUESTION_SECONDS)throw new Error(`Choose between ${MIN_QUESTION_SECONDS} and ${MAX_QUESTION_SECONDS} seconds per question.`);
 if(state.active)throw new Error('Finish or discard your current paper first.');
 state.active={ids:selectQuestions(state,questions,count,random),index:0,answers:{},openedAt:{},startedAt:now,questionSeconds,choiceOrders:{}};
 ensureChoiceOrders(state,questions,random);
 return state.active;
}
export function summarize(state,now=Date.now()){
 if(!state.active)throw new Error('No active paper.');
 const a=state.active;const correct=a.ids.filter(id=>a.answers[id]?.correct).length;
 const result={id:now,at:now,count:a.ids.length,correct,incorrect:a.ids.length-correct,questionSeconds:getQuestionSeconds(a),
  results:a.ids.map(id=>({id,...(a.answers[id]||{choice:null,correct:false,reason:'not-answered'})}))};
 state.history.unshift(result);state.history=state.history.slice(0,MAX_HISTORY);state.active=null;
 return result;
}
