"""Browser QA for custom discard modal and 3s correct-answer auto-next."""
from pathlib import Path
import importlib.util
import json

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('legacy_smoke',ROOT/'tests/browser_smoke.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
from playwright.sync_api import sync_playwright

OUT=ROOT.parent/'Driving_Exam_v1_6_Previews'
OUT.mkdir(exist_ok=True)

def start(p,num=2):
 p.locator('[data-count="custom"]').click()
 p.locator('#custom-count').fill(str(num))
 p.locator('#start').click()
 p.locator('.answer').first.wait_for()

def correct(p):
 s=m.state(p); qid=s['active']['ids'][s['active']['index']]
 answer=next(q['correct_option'] for q in m.DATA if q['id']==qid)
 p.locator(f'[data-choice="{answer}"]').click()
 return qid,answer

def wrong(p):
 s=m.state(p); qid=s['active']['ids'][s['active']['index']]
 ans=next(q['correct_option'] for q in m.DATA if q['id']==qid)
 selected=2 if ans==1 else 1
 p.locator(f'[data-choice="{selected}"]').click()
 return qid

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 p=m.page_with_app(ctx);errors=[]
 p.on('pageerror',lambda exc:errors.append(str(exc)))
 start(p,2)
 first,ans=correct(p)
 assert p.locator('.answer.correct').count()==1
 assert p.locator('#auto-next-ui').is_visible(), 'Correct answer must display three-second circular UI'
 assert p.locator('#auto-next-count').inner_text()=='3'
 m.assert_no_overflow(p,'390px auto-next footer')
 m.embed_displayed_assets(p)
 p.screenshot(path=str(OUT/'iphone_correct_countdown.png'))
 p.locator('#cancel-auto-next').click()
 assert not p.locator('#auto-next-ui').is_visible(), 'Cancelled ring must disappear'
 assert 'Auto-next off' in p.locator('#time-display').inner_text()
 assert m.state(p)['active']['autoAdvance']['cancelled']
 p.evaluate('''() => {state.active.autoAdvance.deadline=Date.now()-10000;tick();}''')
 assert m.state(p)['active']['index']==0, 'Cancel must prevent auto-navigation'
 snapshot=m.storage(p);p.close()
 p=m.page_with_app(ctx,snapshot);p.locator('#resume').click()
 assert m.state(p)['active']['index']==0, 'Cancelled answer must remain current after refresh'
 assert not p.locator('#auto-next-ui').is_visible()
 p.locator('#next-btn').click()
 assert m.state(p)['active']['index']==1
 wrongid=wrong(p)
 assert not p.locator('#auto-next-ui').is_visible(), 'Wrong answer must not start auto-next'
 p.wait_for_timeout(900)
 assert m.state(p)['active']['index']==1
 p.locator('#next-btn').click()
 assert p.locator('.result-score').is_visible()
 assert len(m.state(p)['history'])==1
 p.close()

 # Auto-advance first correctly-answered question; automatically submit final correct answer.
 ap=m.page_with_app(ctx);start(ap,2)
 correct(ap)
 ap.evaluate('''() => {state.active.autoAdvance.deadline=Date.now()-50;tick();}''')
 assert m.state(ap)['active']['index']==1
 correct(ap)
 ap.evaluate('''() => {state.active.autoAdvance.deadline=Date.now()-50;tick();}''')
 assert ap.locator('.result-score').is_visible()
 assert m.state(ap)['active'] is None
 assert m.state(ap)['history'][0]['correct']==2
 ap.close()

 # Discard: Cancel and Escape keep active paper, confirm clears only active paper.
 dp=m.page_with_app(ctx);start(dp,3)
 wrongid=wrong(dp)
 dp.locator('#home-btn').click()
 before=m.state(dp)
 dp.locator('#discard').click()
 assert dp.locator('#discard-dialog').is_visible()
 assert dp.locator('#discard-dialog-heading').inner_text()=='Discard this paper?'
 assert dp.locator('#cancel-discard').evaluate('(e)=>e===document.activeElement')
 dp.screenshot(path=str(OUT/'discard_confirmation_desktop_or_mobile.png'))
 dp.locator('#cancel-discard').click()
 assert not dp.locator('#discard-dialog').is_visible()
 assert m.state(dp)==before, 'Cancel must not change storage state'
 dp.locator('#discard').click();dp.keyboard.press('Escape')
 assert not dp.locator('#discard-dialog').is_visible()
 assert m.state(dp)==before, 'Escape must not change storage state'
 dp.locator('#discard').click();dp.locator('#confirm-discard').click()
 after=m.state(dp)
 assert after['active'] is None
 assert after['progress']==before['progress'], 'Earned learning credits must survive discard'
 assert after['history']==before['history']
 assert dp.locator('#discard').count()==0
 dp.locator('#start').click();assert m.state(dp)['active'] is not None
 dp.close()

 # Opening road sign magnification / menu cancels automatic movement.
 mp=m.page_with_app(ctx);start(mp,20)
 # Force a question with a road sign as the first entry (asset is present in source bank).
 mp.evaluate('''() => {
 const signId=questions.find(q=>q.road_sign_image).id;
 state.active.ids[0]=signId;
 state.active.ids=[...new Set(state.active.ids)];
 state.active.index=0;
 state.active.openedAt[signId]=Date.now();
 save();renderExam(true);
 }''')
 correct(mp)
 assert mp.locator('#sign-trigger').count()==1
 mp.locator('#sign-trigger').click()
 assert mp.locator('#sign-dialog').is_visible()
 assert m.state(mp)['active']['autoAdvance']['cancelled']
 mp.locator('#close-sign').click()
 mp.locator('#menu-btn').click()
 assert mp.locator('#question-dialog').is_visible()
 mp.locator('#close-dialog').click()
 assert not mp.locator('#auto-next-ui').is_visible()
 mp.close()

 # Very narrow small-screen footer must not overflow horizontally.
 small=browser.new_context(viewport={'width':320,'height':650},is_mobile=True,has_touch=True)
 sp=m.page_with_app(small);start(sp,2);correct(sp)
 m.assert_no_overflow(sp,'320px auto-next footer')
 assert sp.locator('#cancel-auto-next').is_visible()
 sp.close();small.close()
 assert not errors,errors
 ctx.close();browser.close()
print('PASS v1.6 browser: correct ring, cancel, reload, last result, wrong manual, discard + Escape, sign/menu cancel, 320px + 390px overflow')
