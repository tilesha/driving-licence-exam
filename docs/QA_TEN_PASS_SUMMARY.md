# Ten-pass PDF-to-website Sinhala text audit

Every applicable pass traverses all **171 questions** or their **855 text fields**, comparing to the original 26-page PDF mapping and the previous text build.

| Pass | Audit | Checked | Passed | Warnings |
|---|---|---:|---:|---:|
| 1 | Source question numbering | 171 | 171 | 0 |
| 2 | All question and answer text fields | 855 | 855 | 0 |
| 3 | Original PDF page and ID mapping | 171 | 171 | 0 |
| 4 | Sinhala Unicode normalization and codepoints | 855 | 855 | 0 |
| 5 | OCR versus source-guided corrected transcript | 855 | 855 | 0 |
| 6 | Remaining suspicious OCR artifacts | 855 | 855 | 0 |
| 7 | Answer positions and choice distinctness | 171 | 171 | 0 |
| 8 | Road sign and diagram image integrity | 71 | 71 | 0 |
| 9 | Two OCR recognition strategies and low-confidence triage | 855 | 855 | 59 |
| 10 | Site bundle and Sinhala font fallback | 9 | 9 | 0 |

**Meaning of 10 passes:** 10 distinct systematic validation categories, not 10 independent human Sinhala proofreaders and not 10 separate optical recognitions.

**Corrected:** 333 of 855 text segments changed, across 155 questions. See `TEXT_CORRECTIONS_v1_7.csv`.

**Remaining automated flags:** 0 potential character artifacts. Source OCR had 59 originally low-confidence snippets (<85). See `QA_REMAINING_TEXT_FLAGS.csv`.

**Cannot guarantee:** word-for-word correctness of every original Sinhala PDF item, nor the correctness of answers marked in blue. A native Sinhala human reviewer should compare all 855 fields against the original PDF before presenting it as authoritative.
