"""Validate Sinhala Unicode question bank and remaining road-sign images.
Usage: python tools/validate_content.py
"""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
QUESTIONS=json.loads((ROOT/'data/questions.json').read_text(encoding='utf-8'))
errors=[];warnings=[];image_refs=set();sign_count=0
ids=[q['id'] for q in QUESTIONS]
if len(ids)!=171:errors.append(f'Expected 171 records; found {len(ids)}')
if len(set(ids))!=len(ids):errors.append('Duplicate question IDs')
if 153 in ids:errors.append('Incomplete source question 153 must be excluded')
for q in QUESTIONS:
 id=q['id'];correct=q.get('correct_option');opts=q.get('choices',[])
 if correct not in (1,2,3,4):errors.append(f'Q{id}: invalid correct option {correct}')
 if [o.get('number') for o in opts]!=[1,2,3,4]:errors.append(f'Q{id}: options not sequential 1–4')
 marked=[o['number'] for o in opts if o.get('marked_correct_by_pdf')]
 if marked!=[correct]:errors.append(f'Q{id}: source highlight disagrees with answer key: {marked} vs {correct}')
 if q.get('road_sign_image'):sign_count+=1
 if not isinstance(q.get('question_text'),str) or not q['question_text'].strip():errors.append(f'Q{id}: missing Unicode question text')
 for opt in opts:
  if not isinstance(opt.get('text'),str) or not opt['text'].strip():errors.append(f"Q{id} option {opt.get('number')}: missing Unicode text")
 for path in [q.get('road_sign_image')]:
  if not path:continue
  f=ROOT/path
  if not f.is_file():errors.append(f'Q{id}: missing {path}');continue
  image_refs.add(f)
  try:
   with Image.open(f) as im:im.verify()
  except Exception as ex:errors.append(f'Q{id}: invalid image {path}: {ex}')
print(f'Questions: {len(QUESTIONS)} | Associated signs/diagrams: {sign_count} | Unique images referenced: {len(image_refs)}')
print(f'Warnings: {len(warnings)} | Errors: {len(errors)}')
for w in warnings:print('WARN',w)
for e in errors:print('ERROR',e)
if errors:raise SystemExit(1)
