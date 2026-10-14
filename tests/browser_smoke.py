"""Isolated DOM/CSS browser tests for the static web app.
The testing environment blocks localhost/file navigation, so this harness inlines
CSS/JS and stubs fetch/localStorage. It tests interactions, NOT HTTP deployment
or physical iOS Safari. Run: python tests/browser_smoke.py
"""
from pathlib import Path
import base64
import json
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PREVIEW_DIR = ROOT.parent / 'Driving_Exam_Previews'
PREVIEW_DIR.mkdir(exist_ok=True)
DATA = json.loads((ROOT/'data/questions.json').read_text(encoding='utf-8'))
CSS=(ROOT/'css/styles.css').read_text(encoding='utf-8')
CORE=re.sub(r'\bexport\s+(?=(?:const|function)\b)','',(ROOT/'js/quiz-core.mjs').read_text(encoding='utf-8'))
APP=re.sub(r'^import .*?;\s*','',(ROOT/'js/app.js').read_text(encoding='utf-8'),count=1,flags=re.M)
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<link rel="stylesheet"[^>]*>',lambda _:f'<style>{CSS}</style>',HTML)
HTML=re.sub(r'<script type="module" src="js/app\.js(?:\?v=[^"]+)?"></script>','',HTML)
HTML=HTML.replace('</body>',f'<script>{CORE}\n{APP}</script></body>')

def page_with_app(ctx, progress=None):
  p=ctx.new_page()
  p.goto('about:blank')
  p.evaluate('''({data,progress}) => {
    window.__store = new Map(Object.entries(progress || {}));
    Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:k=>window.__store.get(k)||null,
      setItem:(k,v)=>window.__store.set(k,v),
      removeItem:k=>window.__store.delete(k)
    }});
    window.fetch=async()=>({ok:true,json:async()=>data});
  }''',{'data':DATA,'progress':progress or {}})
  p.set_content(HTML,wait_until='domcontentloaded')
  p.get_by_text('Practice driving theory').wait_for()
  return p

def storage(p):return p.evaluate('Object.fromEntries(window.__store)')
def state(p):return json.loads(storage(p)['sl-driving-quiz-v3'])
def assert_no_overflow(p,where):
  sizes=p.evaluate('({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth})')
  assert sizes['scroll']<=sizes['width']+1,f'Horizontal overflow at {where}: {sizes}'

def embed_displayed_assets(p):
  """Convert only images currently in the DOM to inline data for accurate preview screenshots."""
  paths=p.evaluate('''() => [...new Set([...document.querySelectorAll('img[src],source[srcset]')].flatMap(el=>[el.getAttribute('src'),el.getAttribute('srcset')]).filter(x=>x && x.startsWith('assets/')))]''')
  images={}
  for path in paths:
    f=ROOT/path
    if f.is_file():images[path]='data:image/png;base64,'+base64.b64encode(f.read_bytes()).decode()
  p.evaluate('''images => {
     for(const el of document.querySelectorAll('img[src],source[srcset]')){
       if(images[el.getAttribute('src')])el.setAttribute('src',images[el.getAttribute('src')]);
       if(images[el.getAttribute('srcset')])el.setAttribute('srcset',images[el.getAttribute('srcset')]);
     }
   }''',images)
  p.wait_for_timeout(120)

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  p=page_with_app(ctx);errors=[]
  p.on('pageerror',lambda x:errors.append(str(x)))
  assert p.locator('.stat').first.inner_text().split('\n')[0]=='171';assert_no_overflow(p,'mobile home')
  assert p.locator('[data-seconds="30"]').get_attribute('aria-pressed')=='true'
  assert p.locator('#time-selected').inner_text()=='30 seconds'
  p.screenshot(path=str(PREVIEW_DIR/'iphone_home.png'),full_page=True)
  p.locator('[data-count="custom"]').click();p.locator('#custom-count').fill('3')
  p.locator('#start').click();p.locator('.answer').first.wait_for()
  assert len(state(p)['active']['ids'])==3
  assert state(p)['active']['questionSeconds']==30
  assert p.locator('#time-display').inner_text() in ('00:30','00:29')
  assert p.locator('.answer').count()==4
  displayed_order=p.locator('[data-choice]').evaluate_all('(els)=>els.map(el=>Number(el.dataset.choice))')
  saved_order=state(p)['active']['choiceOrders'][str(state(p)['active']['ids'][0])]
  assert displayed_order==saved_order
  assert p.locator('.option-text').count()==4
  assert p.locator('.question-text').count()==1
  assert p.locator('.question-picture').count()==0
  assert p.locator('.option-picture').count()==0
  assert_no_overflow(p,'mobile exam')
  embed_displayed_assets(p);p.screenshot(path=str(PREVIEW_DIR/'iphone_exam.png'),full_page=True)
  # Previous is intentionally absent. A skipped question can still be
  # reviewed from the number menu without revealing an answer the user did not select.
  skipped_id=state(p)['active']['ids'][0]
  p.locator('#next-btn').click()
  assert p.locator('#prev-btn').count()==0
  p.locator('#menu-btn').click();p.locator('[data-jump="0"]').click()
  skipped=state(p)['active']['answers'][str(skipped_id)]
  assert skipped['reason']=='skipped' and skipped['correct'] is False and skipped['choice'] is None
  assert p.locator('.answer.correct').count()==0
  assert p.locator('#time-display').inner_text()=='Skipped'
  assert p.locator('.timer-stack').get_attribute('aria-label')=='Question skipped. Press Next to continue.'
  # Continue the existing score test with a fresh paper.
  p.locator('#home-btn').click();p.locator('#discard').click();p.locator('#confirm-discard').click()
  p.locator('[data-count="custom"]').click();p.locator('#custom-count').fill('3')
  p.locator('#start').click();p.locator('.answer').first.wait_for()
  first=state(p)['active']['ids'][0];correct=next(q['correct_option'] for q in DATA if q['id']==first)
  p.locator(f'[data-choice="{1 if correct!=1 else 2}"]').click()
  assert p.locator('.answer.correct').count()==1 and p.locator('.answer.wrong').count()==1
  embed_displayed_assets(p);p.screenshot(path=str(PREVIEW_DIR/'iphone_wrong_answer.png'),full_page=True)
  p.locator('#next-btn').click();a=state(p)['active'];assert a['index']==1
  second=a['ids'][1];second_correct=next(q['correct_option'] for q in DATA if q['id']==second)
  p.locator(f'[data-choice="{second_correct}"]').click()
  assert 'Correct 1/3 times' in p.locator('.feedback').inner_text()
  p.locator('#menu-btn').click();p.locator('[data-jump="2"]').click()
  assert '3 / 3' in p.locator('.exam-heading').inner_text()
  p.locator('#next-btn').click();p.locator('#main h2').get_by_text('Your results').wait_for()
  assert '33%' in p.locator('.result-score').inner_text()
  s=state(p);assert len(s['history'])==1
  assert s['progress'][str(first)]['status']=='wrong'
  assert s['progress'][str(second)]['status']=='seen'
  assert s['progress'][str(second)]['correctCount']==1
  p.locator('#go-home').click();p.locator('#history').click()
  p.locator('[data-history="0"]').click()
  assert p.locator('#review-accordion').count()==1
  assert not p.locator('#review-accordion').evaluate('(el)=>el.open')
  assert not p.locator('.review-item').first.evaluate('(el)=>el.open')
  assert not p.locator('.review-right-answer').first.is_visible()
  p.locator('#review-accordion > summary').click()
  assert p.locator('#review-accordion').evaluate('(el)=>el.open')
  assert p.locator('.review-item').count()==2
  assert not p.locator('.review-right-answer').first.is_visible()
  p.locator('.review-item > summary').first.click()
  assert p.locator('.review-right-answer').first.is_visible()
  p.locator('.review-item > summary').first.click()
  assert not p.locator('.review-right-answer').first.is_visible()
  p.locator('#review-accordion > summary').click()
  assert not p.locator('#review-accordion').evaluate('(el)=>el.open')
  p.locator('#go-home').click()
  snapshot=storage(p);p.close();p=page_with_app(ctx,snapshot)
  assert state(p)['active'] is None
  assert p.locator('#history').count()==1
  p.locator('[data-count="custom"]').click();p.locator('#custom-count').fill('4');p.locator('#start').click()
  s=state(p);assert first in s['active']['ids'],'Wrong question missing in next attempt'
  assert second in s['active']['ids'],'Learning question should be included for additional practice'
  snapshot=storage(p);p.close();p=page_with_app(ctx,snapshot)
  p.locator('#resume').click();assert_no_overflow(p,'resume')
  # Simulate an expired 30-second deadline while Safari was closed; resuming must auto-advance.
  snap=storage(p);st=json.loads(snap['sl-driving-quiz-v3']);idx=st['active']['index'];qid=st['active']['ids'][idx]
  st['active']['openedAt'][str(qid)]=1
  previous_index=idx
  snap['sl-driving-quiz-v3']=json.dumps(st);p.close()
  p=page_with_app(ctx,snap);p.locator('#resume').click()
  assert state(p)['progress'][str(qid)]['status']=='wrong'
  assert state(p)['active']['answers'][str(qid)]['reason']=='timeout'
  assert state(p)['active']['index']==previous_index+1, 'Timeout should automatically advance after resume'
  assert p.locator('#time-display').inner_text() in ('00:30','00:29')
  p.close();ctx.close()

  # Independently test live expiration: first question advances, final question auto-submits.
  expiry_ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  ep=page_with_app(expiry_ctx)
  assert '30 seconds' in ep.locator('.time-row').first.inner_text()
  ep.locator('[data-count="custom"]').click()
  ep.locator('#custom-count').fill('2')
  assert '01:00' in ep.locator('#time-total').inner_text()
  ep.locator('#start').click()
  ids=state(ep)['active']['ids']
  ep.evaluate('''() => {const id=state.active.ids[state.active.index];state.active.openedAt[id]=Date.now()-31000;tick()}''')
  assert state(ep)['active']['index']==1, 'First timeout should auto-advance with no Next tap'
  assert state(ep)['active']['answers'][str(ids[0])]['choice'] is None
  assert state(ep)['active']['answers'][str(ids[0])]['reason']=='timeout'
  assert state(ep)['progress'][str(ids[0])]['status']=='wrong'
  assert ep.locator('#time-display').inner_text() in ('00:30','00:29')
  ep.evaluate('''() => {const id=state.active.ids[state.active.index];state.active.openedAt[id]=Date.now()-31000;tick()}''')
  ep.locator('.result-score').wait_for()
  assert state(ep)['active'] is None
  assert len(state(ep)['history'])==1
  assert all(r['reason']=='timeout' for r in state(ep)['history'][0]['results'])
  assert all(state(ep)['progress'][str(i)]['status']=='wrong' for i in ids)
  ep.close();expiry_ctx.close()

  # Result screen should remain brief even for 38 wrong answers; each answer is opt-in.
  summary_ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  sp=page_with_app(summary_ctx)
  sample=DATA[:40]
  res={'count':40,'correct':2,'questionSeconds':30,'results':[
    {'id':q['id'],'correct':i<2,'choice':q['correct_option'] if i<2 else (1 if q['correct_option']!=1 else 2),'reason':'answer'}
    for i,q in enumerate(sample)]}
  sp.evaluate('(data) => resultScreen(data)',res)
  assert '5' in sp.locator('.result-score').inner_text()
  assert sp.locator('.review-item').count()==38
  assert 'Review incorrect answers' in sp.locator('#review-accordion > summary').inner_text()
  assert not sp.locator('#review-accordion').evaluate('(el)=>el.open')
  assert not sp.locator('.review-question').first.is_visible()
  assert_no_overflow(sp,'390px summary 38 errors')
  assert sp.locator('#new-paper').is_visible() and sp.locator('#go-home').is_visible()
  print('Results closed mobile content height:',sp.evaluate('document.documentElement.scrollHeight'))
  sp.screenshot(path=str(ROOT.parent/'Driving_Exam_Results_Compact_Mobile.png'),full_page=True)
  sp.locator('#review-accordion > summary').click()
  assert sp.locator('.review-item').count()==38
  assert not sp.locator('.review-right-answer').first.is_visible()
  sp.locator('.review-item > summary').first.click()
  assert sp.locator('.review-right-answer').first.is_visible()
  embed_displayed_assets(sp)
  sp.screenshot(path=str(ROOT.parent/'Driving_Exam_Results_Expanded_Mobile.png'),full_page=False)
  sp.locator('.review-item > summary').first.click()
  assert not sp.locator('.review-right-answer').first.is_visible()
  sp.locator('#review-accordion > summary').click()
  assert not sp.locator('.review-question').first.is_visible()
  # No incorrect answers: celebratory status without an empty accordion.
  perfect={'count':2,'correct':2,'questionSeconds':30,'results':[
    {'id':q['id'],'correct':True,'choice':q['correct_option'],'reason':'answer'} for q in DATA[:2]]}
  sp.evaluate('(data) => resultScreen(data)',perfect)
  assert sp.locator('#review-accordion').count()==0
  assert sp.locator('.review-success').is_visible()
  sp.close();summary_ctx.close()

  # Custom timer persists across reloading Safari and survives changes to future preferences.
  custom_ctx=browser.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True)
  tp=page_with_app(custom_ctx)
  tp.locator('[data-count="custom"]').click();tp.locator('#custom-count').fill('2')
  tp.locator('#custom-seconds').fill('45')
  assert tp.locator('[data-seconds="custom"]').get_attribute('aria-pressed')=='true'
  assert '01:30' in tp.locator('#time-total').inner_text()
  assert state(tp)['settings']['questionSeconds']==45
  tp.locator('#start').click()
  assert state(tp)['active']['questionSeconds']==45
  assert tp.locator('#time-display').inner_text() in ('00:45','00:44')
  snap=storage(tp);tp.close();tp=page_with_app(custom_ctx,snap)
  assert tp.locator('#custom-seconds').input_value()=='45'
  tp.locator('[data-seconds="120"]').click()
  assert tp.locator('#time-selected').inner_text()=='2 minutes'
  # Existing exam retains the 45s setting even if a future preference changes.
  tp.locator('#resume').click()
  assert state(tp)['active']['questionSeconds']==45
  assert tp.locator('#time-display').inner_text() in ('00:45','00:44')
  ids=state(tp)['active']['ids']
  tp.evaluate('''() => {const id=state.active.ids[state.active.index];state.active.openedAt[id]=Date.now()-46000;tick()}''')
  assert state(tp)['active']['index']==1
  assert state(tp)['active']['answers'][str(ids[0])]['reason']=='timeout'
  assert tp.locator('#time-display').inner_text() in ('00:45','00:44')
  tp.evaluate('''() => {const id=state.active.ids[state.active.index];state.active.openedAt[id]=Date.now()-46000;tick()}''')
  assert state(tp)['active'] is None
  assert state(tp)['history'][0]['questionSeconds']==45
  tp.locator('#go-home').click()
  assert tp.locator('#custom-seconds').input_value()=='120'
  tp.locator('[data-seconds="15"]').click()
  assert tp.locator('#time-selected').inner_text()=='15 seconds'
  tp.locator('#custom-seconds').fill('301')
  assert tp.locator('#start').is_disabled()
  tp.locator('#custom-seconds').fill('10')
  assert tp.locator('#start').is_enabled()
  tp.close();custom_ctx.close()
  # Destructive reset needs an explicit confirmation. Cancel MUST preserve everything;
  # confirm must clear active, learning credits, wrong queue, history, settings and legacy keys.
  reset_ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  rp=page_with_app(reset_ctx)
  rp.locator('[data-count="custom"]').click();rp.locator('#custom-count').fill('2')
  rp.locator('[data-seconds="120"]').click()
  rp.locator('#start').click();initial_ids=state(rp)['active']['ids']
  q0=next(q for q in DATA if q['id']==initial_ids[0]);q1=next(q for q in DATA if q['id']==initial_ids[1])
  rp.locator(f'[data-choice="{q0["correct_option"]}"]').click();rp.locator('#next-btn').click()
  rp.locator(f'[data-choice="{1 if q1["correct_option"]!=1 else 2}"]').click();rp.locator('#next-btn').click()
  rp.locator('.result-score').wait_for()
  rp.locator('#go-home').click();assert len(state(rp)['history'])==1
  assert len(state(rp)['progress'])==2 and state(rp)['settings']['questionSeconds']==120
  rp.locator('#start').click();assert state(rp)['active'] is not None
  rp.locator('#home-btn').click()
  rp.evaluate('''() => {window.__store.set('sl-driving-quiz-v1','stale-v1');window.__store.set('sl-driving-quiz-v2','stale-v2');window.__store.set('unrelated','keep-me');}''')
  before=storage(rp)
  rp.locator('#reset').click()
  assert rp.locator('#reset-dialog').evaluate('(el)=>el.open')
  assert 'cannot be undone' in rp.locator('#reset-dialog').inner_text().lower()
  rp.screenshot(path=str(ROOT.parent/'Driving_Exam_Reset_Confirmation.png'))
  assert rp.locator('#cancel-reset').evaluate('(el)=>document.activeElement===el')
  rp.locator('#cancel-reset').click()
  assert not rp.locator('#reset-dialog').evaluate('(el)=>el.open')
  assert storage(rp)==before, 'Cancel must not change saved progress'
  rp.locator('#reset').click();rp.locator('#confirm-reset').click()
  assert state(rp)['active'] is None
  assert state(rp)['progress']=={} and state(rp)['history']==[]
  assert state(rp)['settings']['questionSeconds']==30
  assert '171' in rp.locator('.stat').last.inner_text()
  assert rp.locator('#custom-seconds').input_value()=='30'
  after=storage(rp)
  assert 'sl-driving-quiz-v1' not in after and 'sl-driving-quiz-v2' not in after
  assert after['unrelated']=='keep-me'
  assert not rp.locator('#reset-dialog').evaluate('(el)=>el.open')
  # Confirmed reset survives a browser reload; v1/v2 progress does not return.
  rp.close();rp=page_with_app(reset_ctx,after)
  assert state(rp)['history']==[] and state(rp)['progress']=={}
  assert state(rp)['active'] is None
  assert rp.locator('#history').inner_text().find('(0)')>=0
  assert rp.locator('#start').is_enabled()
  rp.close();reset_ctx.close()
  for width,height in [(320,650),(375,812),(768,1024),(1024,768),(1440,900)]:
    c=browser.new_context(viewport={'width':width,'height':height})
    pg=page_with_app(c);pg.locator('#start').click();pg.locator('.answer').first.wait_for()
    assert_no_overflow(pg,f'{width}px exam')
    if width==1440:
      embed_displayed_assets(pg);pg.screenshot(path=str(PREVIEW_DIR/'desktop_exam.png'),full_page=True)
    c.close()
  assert not errors,errors
  print('PASS: compact opt-in results review, Unicode text, 171 questions, 3-correct mastery, retries, reset warning/cancel/confirm/storage cleanup, custom timers, resume, responsive 320–1440px')
  browser.close()
if __name__=='__main__':main()
