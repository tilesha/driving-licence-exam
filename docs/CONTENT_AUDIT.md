# Question bank and image audit — Unicode text build

- Source: user's 26-page Sinhala driving licence examination PDF.
- Original numbering: Q1–Q172; **Q153 is blank and excluded**; Q173–Q176 are absent.
- Deployed bank: **171 questions and 684 answer choices**, with one PDF-marked answer for each.
- All **855 question/answer wording fields** are now Unicode Sinhala text in `data/questions.json`.
- The only images in the deployed build are **71 road signs or diagrams**; text-only questions do not need or display a sign image.
- The PDF text extraction contained corrupted Sinhala, so Sinhala OCR was applied to the source-derived text crops and 18 obvious transcription issues were manually corrected with reference to the PDF. The website does not show image crops for written text.
- **OCR is not equivalent to human proofreading.** Even high OCR confidence can miss Sinhala characters; all 855 fields should be checked against the source before release as authoritative wording.
- `docs/TRANSCRIPTION_REVIEW.csv` lists each snippet with source page, transcript, quality score, and the original imperfect PDF text extraction for later checking.
- Answer correctness is sourced only from the PDF blue-highlight markings, not independently verified with an official reference.

## Recheck after edits

```bash
python tools/validate_content.py
npm test
python tests/browser_smoke.py
```
