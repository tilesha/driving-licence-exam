# AGENTS.md — Driving Licence Exam Web App

Instructions for AI coding assistants, contributors and QA engineers working on this repository.

## Product contract

- Build a browser-only, mobile-first **Sri Lanka Driving Licence Practice** site; do not introduce a native app, install prompt, PWA, backend, account system, database, analytics, or external CDN without explicit approval.
- Static hosting target: **GitHub Pages**, including repository subpaths. All asset paths must remain relative, not root-relative.
- Preserve Sinhala content and road signs from the supplied PDF. **Question 153 is incomplete and intentionally excluded.** Do not invent question 153 or questions 173–176.
- Keep all **171 transcribed (not human-proofread)** question records in `data/questions.json`; note that answer correctness relative to official rules has **not** been independently verified.
- Some questions legitimately have no illustration; do not show blank sign placeholders. **Only road signs or diagrams belong in image assets.**
- Display questions and answers using **escaped Unicode Sinhala `question_text` and `choices[].text`**, never PDF screenshot crops. Sinhala OCR transcription remains unproofread and may contain typos; compare against the original PDF before any corrections. Preserve `id`, `correct_option`, and source markings. Do not use the corrupted PDF text layer as authoritative wording.

## Rules that must stay correct

1. Users choose 1–available questions; quick picks are 10, 20, 40.
2. Build random papers without duplicate question IDs within an attempt.
   Randomize the four answer-choice positions for each new paper and persist that order in the active paper. Refresh, resume and in-paper review must not reshuffle choices. Preserve source `choices[].number` and `correct_option`; score by source number, never display position.
3. Previously wrong, skipped and timed-out questions have priority in later papers until they are answered correctly again. Their previous correct-answer credits are retained. When there are too many to fit, prioritize **oldest last-attempt time** for fair rotation.
4. Mark a question Mastered ONLY after it is answered correctly in **three distinct papers** (cumulative, not consecutive). Before that, track `correctCount` as 0, 1 or 2. After prioritized mistakes, allocate space to both `seen`/Learning questions (1–2 correct credits) and never-seen questions so new exams are not simply identical. Only 3/3 mastered questions are excluded until reset.
5. **Configurable time per question**: presets 15s, 30s (default), 60s, 120s or custom 10–300s. Save the user’s preferred limit and store a separate immutable limit in the active paper so old and ongoing exams stay consistent after reload. Start each question clock when first opened and store its timestamp so refresh cannot reset time. On timeout, mark wrong/unanswered and **automatically advance**; after the final timeout, submit and show results. Timeout must not require a Next tap. Answered questions may remain visible for feedback until the user selects Next.
6. Selecting an incorrect answer immediately marks it red and the source-marked correct answer green; answers lock after submission.
7. Navigation away from an unanswered question counts as a skip (incorrect and returns later). Prior answers may be reviewed; no in-attempt duplicates.
8. Store progress, unfinished exams, and recent results only in Safari/Chrome browser `localStorage` (`sl-driving-quiz-v3`), with compatibility migration from v2 and v1. The old one-correct mastered flag must NOT automatically count as 3/3; infer available completed history, otherwise grant a minimum 1/3 credit. Do not add import/export.
9. Works responsively from narrow phones to desktops; preserve normal page scrolling. Pinch zoom is best-effort CSS, not a guarantee on iOS Safari.
10. Do not deploy to GitHub without the user's authorization.

## Layout of the code

- `index.html`: semantics, header, footer, question dialog.
- `css/styles.css`: responsive styling, iPhone safe-area support, touch and contrast.
- `js/quiz-core.mjs`: pure question selection, migration, progress and scoring rules. Keep DOM APIs out of this module.
- `js/app.js`: UI render and event wiring, timer, browser storage, screens.
- `data/questions.json`: extracted question bank (171 records).
- `assets/signs/`: only original road-sign and diagram pictures. There are no PNG wordings in the deployed build.
- `docs/TRANSCRIPTION_REVIEW.csv`: all 855 text records, OCR confidence and source-reference text to guide future manual proofreading.
- `tests/quiz-core.test.mjs`: deterministic logic tests covering three-correct mastery and v2/v1 migration.
- `tests/browser_smoke.py`: isolated Chromium DOM interaction/layout tests (HTTP/file URL navigation blocked by test environment).
- `tools/validate_content.py`: validates 171 IDs, answers, references and image files.
- `docs/`: requirements, architecture, QA, known gaps, deployment.

## Change workflow

1. Read `docs/REQUIREMENTS.md`, `docs/KNOWN_GAPS.md`, and relevant code first.
2. Preserve the source answer reference and question ID when editing `questions.json`.
3. Run `npm test` (Node 18+), `python tools/validate_content.py`, `python tests/browser_smoke.py`, and `python tests/mobile_visibility.py` (if Python Playwright + Chromium available).
4. Smoke test actual site via HTTP or GitHub Pages on iOS Safari (this step cannot be replaced by Chrome emulation).
5. If any test cannot be run, document why and avoid claiming it passed.
6. Update README, QA and gaps documents when behavior changes.

## Security and privacy

- No user tracking, remote submission, passwords or personally identifiable records.
- Escape dynamic text before inserting into HTML; avoid unsafe external HTML.
- Do not request unnecessary browser permissions or disable native accessibility controls to force anti-zoom.
- Browser storage is not a durable backup and does not sync devices.

## Mobile layout acceptance criteria

- Prioritize showing all four answer choices without scrolling on iPhone-sized portrait screens (375–414 CSS px, ordinary text sizing).
- Keep Sinhala option text legible and selectable. Do not truncate, collapse, abbreviate, or hide content just to save vertical space.
- Road signs/diagrams can be tapped to enlarge inside an accessible, closable dialog. Do not depend on browser pinch zoom.
- Preserve the fixed navigation footer with enough bottom padding to scroll all options into view on shorter screens.
- Run `python tests/mobile_visibility.py` alongside other tests after any layout change.

## Version 1.9 blue UI

- Keep the modern blue visual system consistent across Home, exam, results, history and dialogs. The homepage prioritizes Start Practice, three compact learning statistics, progress, conditional resume, settings, history and reset.
- Use custom accessible `<dialog>` elements for discard, reset, early submission and user-facing error messages; do not introduce native `alert()` or `confirm()` calls.
- Preserve the user-approved three-second correct-answer auto-next and forward-only footer with no Previous control, even if an older design brief mentions five seconds or Previous navigation.

## Results-screen UX rule (v1.5.0)

- By default, the user must see a **compact** result summary: score, correct / incorrect / mastered and exam actions, not a long rendered list of answers.
- Keep the **Review incorrect answers** disclosure closed on every new result render, including history results.
- Once opened, show a list of individually closed question disclosures; only show an answer when that specific question is expanded. Include user's answer and correct answer and retain optional original road-sign image.
- Use accessible native `<details>/<summary>` with keyboard and touchscreen support. Do not record a new answer or change learning progress when expanding review content.
- Exercise automated browser tests covering a paper with 38 incorrect answers, manual expansion and collapse, history, perfect-score screen and mobile viewport overflow.

## v1.6 — Unfinished paper and answer auto-advance

- **Never use native `window.confirm()` for the unfinished-paper discard action.** Use the dedicated accessible `#discard-dialog` with safe-default focus on **Keep my paper**. Cancel/Escape must preserve the whole active exam and learning progress; explicit confirmation discards only the active paper, not accumulated learning/history.
- **Correct answer only:** immediately lock/highlight the answer and start a **3-second circular auto-next timer** in the fixed footer. The original configurable question deadline stops mattering after answering. At expiry, go to the next question, or complete the exam if it was the last question.
- **Cancel auto-next:** user stays on the same answered question indefinitely until tapping Next (or another manual navigation action). Cancellation is persisted on the active paper to survive refresh; do not restart the auto-next countdown after reload.
- Wrong answers display feedback indefinitely until manual Next; unanswered question timeouts still auto-advance according to the user-configured question duration.
- The footer has no Previous control. Manual Next/question-menu navigation cancels pending auto-next; opening the road sign viewer or question menu also cancels to prevent surprise navigation.
- Store the pending deadline (`active.autoAdvance`) in the existing localStorage state; do not create a new browser storage key, reset unrelated data, or use stale `setTimeout` callbacks.


## Sinhala data quality rules (v1.7)

- `data/questions.json` is the single source for real Sinhala Unicode question text and choices. Keep road signs/diagrams as image assets only.
- Source: 26-page PDF, original IDs 1-172 except intentionally omitted 153. Do not invent 173-176.
- Any text edit must be verified against the PDF's printed wording. Do not silently change the option key based on general traffic knowledge.
- Review `docs/TEXT_CORRECTIONS_v1_7.csv`, `docs/QA_LOW_CONFIDENCE_FIELDS.csv`, and `docs/QA_TEN_PASS_SUMMARY.md` before modifying question text.
- Use NFC Unicode; keep Sinhala letters, diacritics, punctuation and A/B/C labels intact. Prefer `Noto Sans Sinhala` / `Sinhala Sangam MN` font stack, without distributing font binaries.
- Rerun `npm test`, `python tools/validate_content.py`, and Chromium mobile browser QA after text or CSS modifications.
- **Do not claim every question has been manually proofread**: automated comparison may miss plausible but incorrect OCR words. All 855 fields still warrant human sign-off and the supplied PDF's answers need separate legal/content verification.


## Version 1.8 second ten-pass PDF comparison

- Before editing text, review `docs/QA_SECOND_TEN_PASS_SUMMARY.md`, `docs/QA_SECOND_PASS_CORRECTIONS.csv`, and `docs/QA_LOW_CONFIDENCE_FIELDS.csv`.
- Do not replace source text values merely because a different answer/abbreviation seems more logical. In particular, Q135 option 2 uses `පැ.සැ.` in the actual PDF and must be marked for human/content review, not silently rewritten.
- Keep answers/IDs/learning logic untouched while proofreading; use the PDF page renders for visual comparisons. 59 source-OCR confidence flags remain and full human proofreading is still pending.
