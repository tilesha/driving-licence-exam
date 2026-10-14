# Regression checks — Version 1.8

Executed against the source that is packaged in this ZIP. The changes in this release are Sinhala text-only; runtime quiz logic, HTML, CSS and images were not modified.

| Verification | Result |
|---|---|
| JavaScript quiz-core tests (`node --test tests/quiz-core.test.mjs`) | PASS — 14 / 14 |
| Question/image validator (`python tools/validate_content.py`) | PASS — 171 questions, 71 linked illustrations, 0 errors |
| Chromium v1.6 interaction/regression (`python tests/browser_v16.py`) | PASS — correct-answer 5-second ring, cancel and refresh, result on final answer, wrong-answer manual next, discard confirmation/Escape and 320/390px overflow |
| 414 × 896 simulated mobile | PASS — 171 / 171 show all four options without scrolling |
| 390 × 844 simulated mobile | PASS — 171 / 171 |
| 375 × 812 simulated mobile | PASS — 171 / 171 |
| 320 × 650 simulated mobile | 157 / 171; 14 unusually long questions require scrolling (expected) |

## Open testing gaps

- No physical iPhone Safari test; Chrome/Chromium simulation is not equal to Safari.
- No live GitHub Pages deployment smoke test.
- Automated Unicode and consistency checks are **not** word-for-word native Sinhala proofreading or official road-rule answer-key verification.
- Source PDF oddity Q135 option 2: `පැ.සැ.` is deliberately kept to match the printed source; source-content review is recommended.
