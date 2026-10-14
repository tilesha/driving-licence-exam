# Sinhala text transcription and proofreading

## What changed

The earlier web app displayed 171 question headings and 684 answer choices as cropped PNG images from the PDF. This build renders **real Sinhala Unicode text** directly in the HTML UI, from `data/questions.json`.

Road signs and diagrams are still images (`assets/signs/`). Questions without illustrations remain entirely text-based. The resulting website ZIP is smaller and text wraps naturally on iPhone Safari and desktop browsers.

## Source and method

The provided PDF (26 pages) contains a corrupted Unicode text mapping for many Sinhala letters, even though the page appears correct when rendered. For that reason, the new text was recovered from the PDF-rendered text crops through Sinhala OCR. Both single-line and layout-aware recognition were compared and the layout-aware extraction was favored for multi-line choices. A small set of obviously incorrect recognitions was corrected by consulting the provided PDF.

There are **171 questions and 684 options (855 text snippets)**. An OCR confidence is recorded for each row in `TRANSCRIPTION_REVIEW.csv`; **confidence is only a triage aid, not a proof of exact transcription**.

## Essential quality warning

**The Sinhala transcription has not been manually proofread line by line.** It may include omitted letters, mixed-up Sinhala syllables, incorrect punctuation or confusingly similar words. Do not claim that each question is an exact official transcription until a Sinhala reader checks all 855 snippets against the source PDF. Likewise, the PDF's blue highlighted answers have not been independently verified against driving law.

## Editing any question

Edit `data/questions.json` directly:

```json
{
  "id": 1,
  "source_page": 1,
  "question_text": "මෙම මාර්ග සංඥාවෙන් දැක්වෙන්නේ",
  "road_sign_image": "assets/signs/q001.png",
  "correct_option": 3,
  "choices": [
    {"number": 1, "text": "ඉරට්ටේ දිනවල වාහන ඇතුල්වීම තහනම්", "marked_correct_by_pdf": false}
  ]
}
```

The example shows only one option for brevity; actual records must contain exactly four. Keep original question IDs, source page and answer flags unchanged unless a verified source correction requires an update.

Recheck the corresponding source PDF page, correct the question/choice text, and run the validator and tests. If you correct a row, record the correction and review status in `TRANSCRIPTION_REVIEW.csv` so it is auditable.


## Version 1.7: Ten-pass source comparison and readability review

The source PDF and previous OCR output were compared across 10 systematic audit categories. **333 of the 855 real-text fields were corrected** across the question bank, including OCR letter swaps, malformed Unicode word sequences, source diagram labels (A/B/C/T/Y), `Hazard Lamps`, and punctuation. The 171 source IDs, 71 images, and marked answer positions remain unchanged.

- `QA_TEN_PASS_SUMMARY.md` and `QA_TEN_PASS_RESULTS.csv`: audit method, coverage, counts, and limitations.
- `TEXT_CORRECTIONS_v1_7.csv`: complete field-level before/after differences.
- `QA_LOW_CONFIDENCE_FIELDS.csv`: 59 fields scored under 85 in the *original* OCR extraction; source-informed corrections do not prove those are perfect.
- `QA_REMAINING_TEXT_FLAGS.csv`: deterministic artifact checks; an empty file is **not** proof that all Sinhala words are correct.

The UI uses a native font stack starting with **Noto Sans Sinhala**, then **Sinhala Sangam MN** on supported Apple devices, with **Iskoola Pota** as another fallback. No additional font files or app installation is required; final appearance can vary by browser/device.

**Human proofreading of all 855 snippets and independent verification of the blue-marked answer key remain open release checks.** The 10 passes mean *10 different automated consistency tests*, not ten separate native Sinhala human proofreadings. Changes were sourced from the PDF's printed wording or clear OCR recovery rather than rewritten to reflect external traffic-rule information.
