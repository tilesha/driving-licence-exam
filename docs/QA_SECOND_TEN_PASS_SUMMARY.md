# Second 10-pass PDF-to-website audit (v1.8)

**Input:** 26-page user PDF + website v1.7. PDF SHA256 `dee9f21066c9c3128a7fa9e4558c8bfb45ca576e85e079a97e79c58858865631`.

This is a **second run of ten distinct technical audit categories**, not ten independent fluent-Sinhala human proofreaders. Page renders were also visually checked for the entries changed in this version. Every applicable programmatic pass covered all 171 questions / 855 text fields.

| # | Validation | Checked | Passed | Failed | Warnings |
|---|---|---:|---:|---:|---:|
| 1 | PDF page and source numbering | 172 | 172 | 0 | 0 |
| 2 | Question ID and source page mapping | 171 | 171 | 0 | 0 |
| 3 | 855 Sinhala Unicode text fields | 855 | 855 | 0 | 0 |
| 4 | Four ordered unique choices per question | 171 | 171 | 0 | 0 |
| 5 | PDF-marked key/option order unchanged | 171 | 171 | 0 | 0 |
| 6 | Numbers retained from PDF (all fields) | 855 | 855 | 0 | 0 |
| 7 | Road-sign and diagram image integrity | 71 | 71 | 0 | 0 |
| 8 | Residual known OCR corruption patterns | 855 | 855 | 0 | 0 |
| 9 | OCR confidence triage inventory | 855 | 855 | 0 | 59 |
| 10 | GitHub Pages static build requirements | 12 | 12 | 0 | 0 |

## Source-checked changes

There were **6 targeted field corrections**. See `QA_SECOND_PASS_CORRECTIONS.csv` for original text, updated text, PDF page and rationale.

Notably, Q135 option 2 in the PDF prints `පැ.සැ.` rather than `පැ.කි.මී.`. The earlier conversion was not justified by the original and is restored here; the possibly incorrect *source abbreviation* is flagged rather than silently rewritten.

Q153 is blank in the PDF and is intentionally skipped. Q173–Q176 do not appear. Total = 171 usable questions.

## Remaining limitations (not passes or tests)

- **59 snippets** had low OCR confidence in the first extraction. Confidence alone cannot certify or reject a transcription. Human Sinhala proofreading across all **855 fields** has **not** been completed; additional natural-looking errors may remain.
- The answers match the **PDF blue underlines**. Whether those answers are objectively correct under current Sri Lankan traffic rules has **not** been independently verified.
- Real iPhone Safari, live GitHub Pages deployment, and enlarged accessibility text remain untested.
- Simulated Chromium automated tests are separate from the ten passes and are recorded in `QA_REGRESSION_V1_8.md`.
