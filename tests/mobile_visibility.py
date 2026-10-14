"""Check whether four choices fit above the fixed footer on mobile.
Use the same inline Chromium harness as the existing smoke test; image assets
are loaded as data URLs, so their real aspect ratios are measured.
The goal is a readable layout, not a guarantee for arbitrarily long wording.
"""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright
from browser_smoke import ROOT,DATA,page_with_app,assert_no_overflow

qs={q['id']:q for q in DATA}

def check_size(browser,width,height):
  ctx=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=1)
  p=page_with_app(ctx)
  p.locator('[data-count="custom"]').click();p.locator('#custom-count').fill('1');p.locator('#start').click()
  overflow=[]
  for qid,q in qs.items():
    p.evaluate('''id => {state.active.ids=[id];state.active.index=0;state.active.answers={};state.active.openedAt={};renderExam(false)}''',qid)
    sign=q.get('road_sign_image')
    if sign:
      img=(ROOT/sign).read_bytes()
      encoded='data:image/png;base64,'+base64.b64encode(img).decode()
      p.locator('.road-sign').evaluate('async(img,url)=>{img.src=url;await img.decode()}',encoded)
    result=p.evaluate('''() => ({answerBottom:document.querySelector('.answer:last-child').getBoundingClientRect().bottom,footerTop:document.querySelector('.exam-footer').getBoundingClientRect().top})''')
    if result['answerBottom']>result['footerTop']-8:
      overflow.append({'id':qid,'overflowPx':round(result['answerBottom']-(result['footerTop']-8))})
  # Question 1: all four answers should fit at standard iPhone XR viewport.
  if width>=375 and height>=812:
    assert 1 not in [x['id'] for x in overflow],f'Question 1 should fit at {width}x{height}'
  assert_no_overflow(p,f'{width}x{height} random question audit')
  if width==414:
    p.evaluate('''() => {state.active.ids=[1];state.active.index=0;state.active.answers={};state.active.openedAt={};renderExam(false)}''')
    encoded='data:image/png;base64,'+base64.b64encode((ROOT/qs[1]['road_sign_image']).read_bytes()).decode()
    p.locator('.road-sign').evaluate('async(img,url)=>{img.src=url;await img.decode()}',encoded)
    p.screenshot(path=str(ROOT.parent/'Driving_Exam_Text_Previews'/'compact_mobile_414.png'))
    p.locator('#sign-trigger').click()
    assert p.locator('#sign-dialog').evaluate('d=>d.open') is True
    p.locator('#close-sign').click()
    assert p.locator('#sign-dialog').evaluate('d=>d.open') is False
  print(f'{width}x{height}: {len(qs)-len(overflow)}/{len(qs)} questions show all four options in the viewport; {len(overflow)} require scrolling.')
  print('  scrolling questions:',','.join(str(item['id']) for item in overflow[:35]) or 'none')
  ctx.close()

if __name__=='__main__':
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for size in [(414,896),(390,844),(375,812),(320,650)]:check_size(browser,*size)
  browser.close()
