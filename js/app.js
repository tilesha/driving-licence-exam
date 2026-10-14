'use strict';
import { STORAGE_KEY, LEGACY_STORAGE_KEY, OLDEST_STORAGE_KEY, MASTERY_CORRECT_REQUIRED, QUESTION_SECONDS, MIN_QUESTION_SECONDS, MAX_QUESTION_SECONDS, getQuestionSeconds, freshState, resetAllStoredProgress, normalizeState, counts, startPaper, recordAnswer, summarize } from './quiz-core.mjs?v=1.8.1';

// Static GitHub Pages app: no network beyond loading bundled files, no accounts/analytics.
const $ = s => document.querySelector(s);
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let questions=[], byId=new Map(), state=freshState(), view='home', selectedCount=40, selectedSeconds=QUESTION_SECONDS, storageAvailable=true;
let historyView=null;
const AUTO_NEXT_DELAY_MS=3000; // Correct answer: show feedback for three seconds, then advance.
const formatTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const durationLabel = seconds => seconds<60?`${seconds} seconds`:seconds%60===0?`${seconds/60} minute${seconds===60?'':'s'}`:`${seconds} seconds`;
const questionOf = id => byId.get(id);
const current = () => state.active ? questionOf(state.active.ids[state.active.index]) : null;
const hasAnswer = id => Boolean(state.active?.answers?.[id]);

function save(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}
 catch(e){storageAvailable=false;console.warn('Progress cannot be saved:',e.message);}
}
function loadSaved(){
 try{const saved=localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||localStorage.getItem(OLDEST_STORAGE_KEY);return saved?JSON.parse(saved):null;}
 catch(e){storageAvailable=false;return null;}
}
function header(title,exam=false){
 $('#page-title').textContent=title;
 $('#home-btn').hidden=!exam;
 $('#menu-btn').hidden=!exam;
 $('#exam-footer').hidden=!exam;
 $('#main').classList.toggle('is-exam',exam);
}
const stat=(n,label,extra='')=>`<div class="stat ${extra}"><strong>${n}</strong><small>${label}</small></div>`;
const countAvailable=()=>counts(state,questions).available;
function home(){
 view='home';historyView=null;header('Driving Exam');
 const c=counts(state,questions);const active=state.active;
 selectedCount=Math.min(Math.max(1,selectedCount),Math.max(1,c.available));
 selectedSeconds=getQuestionSeconds({questionSeconds:state.settings?.questionSeconds});
 $('#main').innerHTML=`<div class="home-hero"><p class="eyebrow">SRI LANKA • DRIVING LICENCE</p><h2>Practice driving theory</h2>
 <p class="lead">Choose your question count. Master a question by answering correctly 3 times across separate papers. Mistakes repeat, and new questions are mixed in.</p></div>
 <div class="stats">${stat(c.total,'Questions')}${stat(c.mastered,'Mastered','green')}${stat(c.available,'Available','red')}</div>
 <div class="insight-line"><span>🔁 <strong>${c.wrong}</strong> need review</span><span>📘 <strong>${c.learning}</strong> learning (1–2/3)</span><span>✦ <strong>${c.unseen}</strong> never seen</span></div>
 ${active?`<section class="card"><h3>Continue your paper</h3><p class="muted">Question ${active.index+1} of ${active.ids.length}. Saved on this device.</p>
 <button id="resume" class="button-primary" type="button">Resume exam →</button>
 <button id="discard" class="button-secondary block-action" type="button">Discard unfinished paper</button></section>`:''}
 <section class="card"><h3>Create random paper</h3>
 ${c.available?`<label for="custom-count"><strong>How many questions?</strong> <span class="muted tiny">(1–${c.available} available)</span></label>
 <div class="count-picks">${[10,20,40].map(n=>`<button type="button" data-count="${n}" ${n>c.available?'disabled':''} class="${selectedCount===n?'active':''}">${n}</button>`).join('')}<button type="button" data-count="custom" class="${![10,20,40].includes(selectedCount)?'active':''}">Custom</button></div>
 <input id="custom-count" class="count-input" type="number" inputmode="numeric" min="1" max="${c.available}" value="${selectedCount}" aria-label="Number of questions">
 <div class="field-heading"><label for="custom-seconds"><strong>Time per question</strong></label><span class="muted tiny">(${MIN_QUESTION_SECONDS}–${MAX_QUESTION_SECONDS} seconds)</span></div>
 <div class="time-picks">${[15,30,60,120].map(n=>`<button type="button" data-seconds="${n}" aria-pressed="${selectedSeconds===n}" class="${selectedSeconds===n?'active':''}">${n<60?n+'s':n/60+'m'}</button>`).join('')}<button type="button" data-seconds="custom" aria-pressed="${![15,30,60,120].includes(selectedSeconds)}" class="${![15,30,60,120].includes(selectedSeconds)?'active':''}">Custom</button></div>
 <div class="seconds-field"><input id="custom-seconds" class="count-input" type="number" inputmode="numeric" min="${MIN_QUESTION_SECONDS}" max="${MAX_QUESTION_SECONDS}" step="1" value="${selectedSeconds}" aria-label="Seconds per question"><span class="muted">seconds per question</span></div>
 <div class="row time-row"><span class="muted">Selected time</span><strong id="time-selected">${durationLabel(selectedSeconds)}</strong></div>
 <div class="row time-row"><span class="muted">Total question time</span><strong id="time-total">${formatTime(selectedCount*selectedSeconds)} (mm:ss)</strong></div>
 <button id="start" class="button-primary" type="button" ${active?'disabled':''}>Start random paper →</button>`:
 `<p class="lead">You have mastered every question in the available bank.</p><button id="reset-cycle" class="button-secondary block-action" type="button">Reset progress and start again</button>`}</section>
 <div class="home-actions"><button id="history" type="button" class="button-secondary">📊 Exam history (${state.history.length})</button>
 <button id="reset" type="button" class="button-reset">↺ Reset all progress</button></div>
 <div class="notice"><strong>Timer:</strong> Choose ${MIN_QUESTION_SECONDS}–${MAX_QUESTION_SECONDS} seconds for each question before starting. The time limit stays fixed for that paper. When time runs out, it is marked unanswered and the exam moves automatically to the next question (or results after the last). After a correct answer, a 3-second countdown automatically advances unless you tap Cancel. Wrong answers stay until you tap Next. <strong>Learning rules:</strong> A question is <strong>Mastered after 3 correct answers on separate papers</strong> (not necessarily consecutive). Until then it repeats alongside new questions. Wrong, skipped and timed-out questions are prioritized next time; mistakes do not erase earlier correct answers. Mastered questions are excluded. Question 153 is absent from the original PDF and deliberately skipped.<p class="notice-foot">${storageAvailable?'Progress is saved in this browser using localStorage. Clearing Safari website data may erase it.':'⚠️ Browser storage is unavailable; progress may not survive a reload.'}</p></div>`;
 $('#resume')?.addEventListener('click',()=>renderExam(true));
 $('#discard')?.addEventListener('click',()=>{if(state.active){$('#discard-dialog').showModal();$('#cancel-discard').focus();}});
 $('#reset')?.addEventListener('click', resetProgress);
 $('#reset-cycle')?.addEventListener('click', resetProgress);
 $('#history')?.addEventListener('click',historyScreen);
 document.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.count==='custom'){$('#custom-count').focus();return;}
  selectedCount=Math.min(Number(b.dataset.count),c.available);$('#custom-count').value=selectedCount;countChanged();
 }));
 $('#custom-count')?.addEventListener('input',()=>{let entered=Number($('#custom-count').value);selectedCount=Math.max(1,Math.min(c.available,Number.isFinite(entered)?Math.trunc(entered):1));countChanged();});
 $('#custom-count')?.addEventListener('blur',()=>{$('#custom-count').value=selectedCount;});
 document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.seconds==='custom'){$('#custom-seconds').focus();$('#custom-seconds').select();return;}
  selectedSeconds=Number(b.dataset.seconds);$('#custom-seconds').value=selectedSeconds;secondsChanged();
 }));
 $('#custom-seconds')?.addEventListener('input',()=>{
  const entered=Number($('#custom-seconds').value);
  if(!Number.isInteger(entered)||entered<MIN_QUESTION_SECONDS||entered>MAX_QUESTION_SECONDS){$('#start').disabled=true;return;}
  selectedSeconds=entered;secondsChanged();
 });
 $('#custom-seconds')?.addEventListener('blur',()=>{$('#custom-seconds').value=selectedSeconds;$('#start').disabled=Boolean(state.active);});
 $('#start')?.addEventListener('click',()=>{
  if(!c.available||state.active)return;
  try{startPaper(state,questions,selectedCount,Math.random,Date.now(),selectedSeconds);save();renderExam(true);}
  catch(error){alert(error.message);}
 });
}
function countChanged(){
 document.querySelectorAll('[data-count]').forEach(b=>b.classList.toggle('active',b.dataset.count===String(selectedCount)||b.dataset.count==='custom'&&![10,20,40].includes(selectedCount)));
 updateTimeEstimate();
}
function updateTimeEstimate(){
 if($('#time-total'))$('#time-total').textContent=`${formatTime(selectedCount*selectedSeconds)} (mm:ss)`;
}
function secondsChanged(){
 document.querySelectorAll('[data-seconds]').forEach(b=>{
  const active=b.dataset.seconds===String(selectedSeconds)||b.dataset.seconds==='custom'&&![15,30,60,120].includes(selectedSeconds);
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
 });
 state.settings={...state.settings,questionSeconds:selectedSeconds};save();
 $('#time-selected').textContent=durationLabel(selectedSeconds);
 $('#start').disabled=Boolean(state.active);
 updateTimeEstimate();
}
function resetProgress(){
 // Do not modify state or browser storage until the user explicitly confirms.
 const dialog=$('#reset-dialog');
 if(!dialog.open){dialog.showModal();$('#cancel-reset').focus();}
}
function confirmResetProgress(){
 const dialog=$('#reset-dialog');
 if(!dialog.open)return;
 try{
  state=resetAllStoredProgress(localStorage);
  storageAvailable=true;
 }catch(e){
  storageAvailable=false;
  console.error('Unable to clear saved progress:',e);
  alert('Unable to clear browser progress. Please check Safari website storage and try again.');
  return;
 }
 selectedCount=40;
 selectedSeconds=QUESTION_SECONDS;
 dialog.close();
 if($('#question-dialog').open)$('#question-dialog').close();
 if($('#sign-dialog').open)$('#sign-dialog').close();
 home();
}
function confirmDiscardPaper(){
 const dialog=$('#discard-dialog');
 if(!dialog.open)return;
 // Do not erase answered questions or learning credits, only the unfinished paper.
 if(state.active){state.active=null;save();}
 dialog.close();home();
}
function cancelAutoNext(){
 const a=state.active,q=current();
 if(!a||!q||!a.autoAdvance||a.autoAdvance.questionId!==q.id)return;
 a.autoAdvance.cancelled=true;
 save();tick();
}
function clearAutoNext(){
 if(state.active?.autoAdvance){delete state.active.autoAdvance;save();}
}
function activeAutoNext(){
 const a=state.active,q=current(),pending=a?.autoAdvance;
 if(!q||!hasAnswer(q.id)||!a.answers[q.id]?.correct||!pending||pending.questionId!==q.id||pending.cancelled)return null;
 return pending;
}
function stampCurrent(){
 const a=state.active,q=current();if(!a||!q||hasAnswer(q.id))return;
 if(!Number.isFinite(a.openedAt[q.id])){a.openedAt[q.id]=Date.now();save();}
}
function remainingSeconds(){
 if(!state.active)return 0;
 const q=current();if(!q||hasAnswer(q.id))return 0;
 return Math.max(0,getQuestionSeconds(state.active)-Math.floor((Date.now()-state.active.openedAt[q.id])/1000));
}
// A timeout must never leave the expired question on-screen awaiting a second tap.
// Record it as incorrect, then immediately advance (or submit on the last question).
function expireCurrent(){
 const a=state.active,q=current();
 if(!a||!q||hasAnswer(q.id))return;
 recordAnswer(state,q.id,null,q.correct_option,'timeout');
 if($('#question-dialog').open)$('#question-dialog').close();
 if($('#sign-dialog').open)$('#sign-dialog').close();
 if(a.index<a.ids.length-1){
  a.index++;save();renderExam(true);
 }else{
  finish(); // Automatically show results after the final question times out.
 }
}
function answer(choice){
 if(!state.active)return;
 const q=current();if(!q||hasAnswer(q.id))return;
 // Check the actual deadline, not just the timer label, to avoid late-click races.
 if(remainingSeconds()<=0){expireCurrent();return;}
 recordAnswer(state,q.id,choice,q.correct_option,'answer');
 // Only a CORRECT submitted answer starts the auto-next countdown.
 // Wrong answers remain displayed until the user manually selects Next.
 if(state.active.answers[q.id]?.correct){
  state.active.autoAdvance={questionId:q.id,deadline:Date.now()+AUTO_NEXT_DELAY_MS,cancelled:false};
 }else{delete state.active.autoAdvance;}
 save();renderExam(false);
}
function optionHtml(q,o,record=null,interactive=true){
 // A navigation skip is not user input. Keep the question locked as an
 // incorrect attempt without revealing an answer the user did not choose.
 // Wrong submitted answers and timeouts still reveal the correction.
 const revealCorrect=record&&record.reason!=='skipped';
 const correct=revealCorrect&&o.number===q.correct_option;
 const wrong=record&&record.choice===o.number&&!record.correct;
 const label=record&&correct?'Correct answer':record&&wrong?'Your incorrect answer':`Option ${o.number}`;
 return `<${interactive?'button':'div'} ${interactive?'type="button"':''} class="answer ${correct?'correct':''} ${wrong?'wrong':''}" ${interactive?`data-choice="${o.number}" ${record?'disabled':''}`:''} aria-label="${escapeHtml(label)}">
 <span class="circle" aria-hidden="true">${correct?'✓':wrong?'×':''}</span>
 <span class="option-text" lang="si">${escapeHtml(o.text)}</span>
 </${interactive?'button':'div'}>`;
}
function renderExam(scroll=false){
 const a=state.active;if(!a){home();return;}
 view='exam';stampCurrent();
 const q=current();if(!q){state.active=null;save();home();return;}
 if(!hasAnswer(q.id)&&remainingSeconds()===0){expireCurrent();return;}
 const record=a.answers[q.id];header(`Paper ${String(state.history.length+1).padStart(2,'0')}`,true);
 $('#main').innerHTML=`<div class="exam-meta"><h2 class="exam-heading">ප්‍රශ්නය # ${a.index+1} / ${a.ids.length}</h2><span class="meta-label">Question ${a.index+1}</span></div>
 <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${a.ids.length}" aria-valuenow="${Object.keys(a.answers).length}"><div style="width:${Object.keys(a.answers).length/a.ids.length*100}%"></div></div>
 <section class="question-block">
 <h2 class="question-text" lang="si">${escapeHtml(q.question_text)}</h2>
 <div class="question-layout ${q.road_sign_image?'has-sign':'text-only'}">
 ${q.road_sign_image?`<button type="button" class="question-visual sign-trigger" id="sign-trigger" aria-label="View road sign or diagram larger"><img class="road-sign ${q.id>=139?'diagram':''}" src="${escapeHtml(q.road_sign_image)}" alt="Road sign or diagram for question ${q.id}" loading="eager"></button>`:''}
 <div class="answer-panel"><div class="answers">${q.choices.map(o=>optionHtml(q,o,record)).join('')}</div>
 ${record?`<div class="feedback ${record.correct?'':'wrong'}" role="status">${record.correct?'✓ නිවැරදි පිළිතුර!':record.reason==='timeout'?'⌛ කාලය අවසන් — නිවැරදි පිළිතුර කොළ පැහැයෙන්':record.reason==='skipped'?'↪ Skipped — no answer submitted':'✕ වැරදි පිළිතුර — නිවැරදි පිළිතුර කොළ පැහැයෙන්'}<small>${record.correct?(state.progress[q.id]?.status==='mastered'?`Mastered! Correct ${MASTERY_CORRECT_REQUIRED}/${MASTERY_CORRECT_REQUIRED} times.`:`Correct ${state.progress[q.id]?.correctCount||1}/${MASTERY_CORRECT_REQUIRED} times. This question will return in future papers.`):`This question will return for practice. Correct so far: ${state.progress[q.id]?.correctCount||0}/${MASTERY_CORRECT_REQUIRED}.`}</small></div>`:''}
 </div></div></section>`;
 document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>answer(Number(b.dataset.choice))));
 const signTrigger=$('#sign-trigger');
 if(signTrigger) signTrigger.addEventListener('click',()=>{
   $('#sign-dialog-image').src=signTrigger.querySelector('img').src;
   $('#sign-dialog-image').alt=signTrigger.querySelector('img').alt;
   cancelAutoNext(); // Opening the image must not allow a background auto-jump.
   $('#sign-dialog').showModal();
 });
 $('#next-btn').disabled=false;
 $('#next-btn').setAttribute('aria-label',a.index===a.ids.length-1?'Submit paper':'Next question');
 $('#next-btn').title=a.index===a.ids.length-1?'Finish paper':'Next question';
 tick();if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function markSkipped(){
 const q=current();if(q&&!hasAnswer(q.id)){recordAnswer(state,q.id,null,q.correct_option,'skipped');save();}
}
function navigateTo(index){
 if(!state.active)return;
 const a=state.active;if(index<0||index>=a.ids.length)return;
 if(index!==a.index){markSkipped();clearAutoNext();}
 a.index=index;save();renderExam(true);
}
function next(){
 if(!state.active)return;
 const a=state.active;markSkipped();clearAutoNext();
 if(a.index<a.ids.length-1){a.index++;save();renderExam(true);}else finish();
}
function finish(force=false){
 if(!state.active)return;
 const a=state.active;
 if(force&&!confirm('Submit this paper now? All unanswered questions will be counted as incorrect.'))return;
 clearAutoNext();
 for(const id of a.ids){
  if(!a.answers[id])recordAnswer(state,id,null,questionOf(id).correct_option,'skipped');
 }
 const result=summarize(state);save();resultScreen(result);
}
function tick(){
 if(view!=='exam'||!state.active)return;
 const a=state.active,q=current();if(!q)return;
 const record=a.answers[q.id];
 const auto=activeAutoNext();
 if(auto&&Date.now()>=auto.deadline){next();return;}
 if(!record&&remainingSeconds()===0){expireCurrent();return;}
 const cancelled=Boolean(record?.correct&&a.autoAdvance?.questionId===q.id&&a.autoAdvance.cancelled);
 const showAuto=Boolean(auto);
 $('#auto-next-ui').hidden=!showAuto;
 $('#timer-caption').hidden=showAuto;
 $('#time-display').hidden=showAuto;
 if(showAuto){
  const remaining=Math.max(0,auto.deadline-Date.now());
  const seconds=Math.max(1,Math.ceil(remaining/1000));
  $('#auto-next-count').textContent=String(seconds);
  $('#auto-next-seconds').textContent=`${seconds}s`;
  $('#auto-next-ring').style.setProperty('--progress',`${remaining/AUTO_NEXT_DELAY_MS*100}%`);
  $('.timer-stack').setAttribute('aria-label',`Next question in ${seconds} seconds. Press Cancel to stay here.`);
 }else{
  const completedLabel=record?.reason==='skipped'?'Skipped':record?.reason==='timeout'?'Time expired':'Answered';
  $('#time-display').textContent=cancelled?'Auto-next off':record?completedLabel:formatTime(remainingSeconds());
  $('#time-display').classList.toggle('urgent',!record&&remainingSeconds()<=20);
  const completedAria=record?.reason==='skipped'?'Question skipped. Press Next to continue.':record?.reason==='timeout'?'Question time expired. Press Next to continue.':'Question answered. Press Next to continue.';
  $('.timer-stack').setAttribute('aria-label',cancelled?'Auto-next cancelled. Press Next to continue.':record?completedAria:'Time remaining for current question');
 }
}
function questionMenu(){
 if(!state.active)return;
 cancelAutoNext(); // Do not change questions behind the menu while reviewing navigation.
 const a=state.active;
 $('#question-grid').innerHTML=a.ids.map((id,i)=>{
  const record=a.answers[id];const cls=record?(record.correct?'done':'bad'):'';
  return `<button type="button" data-jump="${i}" class="${cls} ${i===a.index?'current':''}" ${i===a.index?'aria-current="step"':''} aria-label="Question ${i+1}, ${record?(record.correct?'correct':'incorrect'):'not answered'}">${i+1}</button>`;
 }).join('');
 $('#question-dialog').showModal();
 document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{$('#question-dialog').close();navigateTo(Number(b.dataset.jump));}));
}
function historyScreen(){
 view='history';historyView=null;header('Exam History');
 $('#main').innerHTML=`<p class="eyebrow">YOUR LEARNING</p><h2>Exam history</h2><p class="muted">Only this browser stores your results.</p>
 ${state.history.length?`<div class="history-list">${state.history.map((h,i)=>`<button class="history-item" type="button" data-history="${i}"><span><strong>Attempt ${state.history.length-i}</strong><small>${new Date(h.at||h.time).toLocaleString()} · ${durationLabel(getQuestionSeconds(h))}/question</small></span><span class="history-score">${h.correct}/${h.count} (${Math.round(100*h.correct/h.count)}%)</span></button>`).join('')}</div>`:'<div class="card">No completed attempts yet.</div>'}
 <button id="back-home" class="button-primary">Back to home</button>`;
 $('#back-home').onclick=home;
 document.querySelectorAll('[data-history]').forEach(b=>b.addEventListener('click',()=>resultScreen(state.history[Number(b.dataset.history)],true)));
}
function resultScreen(result,fromHistory=false){
 if(!result){home();return;}
 view='result';historyView=fromHistory;header('Results');
 const rows=result.results||[];
 const misses=rows.filter(r=>!r.correct);
 const incorrectCount=result.count-result.correct;
 // Collapsed by default: do not overwhelm the results page with 38+ answers.
 // Both levels use native <details>/<summary> for keyboard, touch, and Safari support.
 const reviewSection=misses.length ? `<details id="review-accordion" class="review-accordion">
  <summary class="review-main-summary">
   <span class="review-summary-icon" aria-hidden="true">↻</span>
   <span class="review-main-label"><strong>Review incorrect answers</strong><small>Open only when you want to study your mistakes</small></span>
   <span class="review-count">${misses.length}</span><span class="review-chevron" aria-hidden="true"></span>
  </summary>
  <div class="review-inner"><p class="review-helper">Tap a question to see your answer and the correct answer.</p>
  ${misses.map(r=>{
   const q=questionOf(r.id);
   if(!q)return '';
   const correctChoice=q.choices.find(o=>o.number===q.correct_option);
   const userChoice=q.choices.find(o=>o.number===r.choice);
   const timedOut=r.reason==='timeout',skipped=r.reason==='skipped'||r.reason==='not-answered';
   const outcome=timedOut?'Time expired':skipped?'Not answered':'Incorrect';
   const personalAnswer=userChoice
    ? `<div class="review-my-answer"><strong>Your answer (${r.choice})</strong><p lang="si">${escapeHtml(userChoice.text)}</p></div>`
    : '<div class="review-my-answer"><strong>Your answer</strong><p>Not answered</p></div>';
   return `<details class="review-item" data-review-question="${q.id}">
     <summary class="review-item-summary"><span class="review-item-heading"><strong>Question ${q.id}</strong><small>${outcome}</small></span><span class="review-chevron" aria-hidden="true"></span></summary>
     <div class="review-item-content"><p class="review-question" lang="si">${escapeHtml(q.question_text)}</p>
      ${q.road_sign_image?`<img class="review-sign" src="${escapeHtml(q.road_sign_image)}" alt="Road sign or diagram for question ${q.id}" loading="lazy">`:''}
      ${personalAnswer}
      <div class="review-right-answer"><strong>Correct answer (${q.correct_option})</strong><p lang="si">${escapeHtml(correctChoice?.text||'Answer unavailable')}</p></div>
     </div>
    </details>`;
  }).join('')}
  </div>
 </details>` : `<section class="review-success" role="status"><strong>Great work — all questions correct!</strong><p>No incorrect answers to review in this paper.</p></section>`;
 $('#main').innerHTML=`<section class="result-overview" aria-label="Exam score">
  <p class="eyebrow">${fromHistory?'PREVIOUS ATTEMPT':'PRACTICE COMPLETE'}</p>
  <h2>Your results</h2>
  <div class="result-score">${Math.round(100*result.correct/result.count)}<span>%</span></div>
  <p class="muted result-subtitle">${result.correct} of ${result.count} correct · ${durationLabel(getQuestionSeconds(result))} per question</p>
  <div class="stats result-stats">${stat(result.correct,'Correct','green')}${stat(incorrectCount,'Incorrect','red')}${stat(counts(state,questions).mastered,'Mastered')}</div>
 </section>
 <section class="result-review-section" aria-label="Review answers">
  ${reviewSection}
 </section>
 <div class="result-actions"><button id="new-paper" class="button-primary" type="button">${fromHistory?'Back to history':'Create next random paper'} →</button>
 <button id="go-home" class="button-secondary block-action" type="button">Home</button></div>`;
 $('#new-paper').onclick=()=>fromHistory?historyScreen():home();
 $('#go-home').onclick=home;
}
$('#cancel-discard').addEventListener('click',()=>$('#discard-dialog').close());
$('#confirm-discard').addEventListener('click',confirmDiscardPaper);
$('#cancel-auto-next').addEventListener('click',cancelAutoNext);
$('#cancel-reset').addEventListener('click',()=>$('#reset-dialog').close());
$('#confirm-reset').addEventListener('click',confirmResetProgress);
$('#close-sign').addEventListener('click',()=>$('#sign-dialog').close());
$('#home-btn').addEventListener('click',home);
$('#menu-btn').addEventListener('click',questionMenu);
$('#close-dialog').addEventListener('click',()=>$('#question-dialog').close());
$('#finish-early').addEventListener('click',()=>{$('#question-dialog').close();finish(true);});
$('#next-btn').addEventListener('click',next);
window.setInterval(tick,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
window.addEventListener('pageshow',tick);

(async()=>{
 try{
  const response=await fetch('data/questions.json?v=1.8.1');if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const all=await response.json();
  questions=all.filter(q=>q.id!==153&&q.correct_option>=1&&q.correct_option<=4&&q.choices?.length===4&&q.question_text?.trim()&&q.choices.every(o=>o.text?.trim()));
  byId=new Map(questions.map(q=>[q.id,q]));
  if(questions.length!==171)throw new Error(`Expected 171 usable questions, found ${questions.length}.`);
  state=normalizeState(loadSaved(),questions);save();home();
 }catch(e){
  header('Error');$('#main').innerHTML=`<h2>Unable to load the questions</h2><p class="notice warning">Use a web server or GitHub Pages, not a file:// URL. Check data/questions.json is uploaded alongside the website.</p><p>${escapeHtml(e.message)}</p>`;
  console.error(e);
 }
})();
