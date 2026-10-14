# Architecture

```text
index.html + css/styles.css
             |
          js/app.js  -----> localStorage (sl-driving-quiz-v3)
             |
      js/quiz-core.mjs (pure logic)
             |
       data/questions.json -----> Unicode question_text and choices[].text
                           ----> assets/signs/ (optional)
```

## Deployment

Static files are served by GitHub Pages; browser uses relative URL `data/questions.json`. The page imports `js/app.js` as an ES module, and this imports `js/quiz-core.mjs`. No backend API, third-party dependencies or external domain calls are used.

Deployable CSS, JavaScript modules and question data use a shared release query parameter (for example, `?v=1.8.1`) to bypass stale mobile-browser asset caches after a release. Updating this parameter does not affect the stable `sl-driving-quiz-v3` localStorage key, so saved progress and unfinished papers remain available.

## Question JSON contract

Each record: `id` (original PDF number), `source_page`, `question_text` (Unicode Sinhala), optional `road_sign_image`, `correct_option` (1–4), four `choices` each with `number`, `text` (Unicode Sinhala), `marked_correct_by_pdf`, and `transcription_status`. A separate CSV in `docs/` records OCR quality and the unreliable PDF text layer for manual review.

## Persistent state contract

`sl-driving-quiz-v3` stores `{version:3, progress:{[id]:{status,correctCount,attempts,lastAttemptAt}}, history:[], active:null|{ids,index,answers,openedAt,startedAt,questionSeconds}}`.

- `progress.status`: `wrong` (retry priority), `seen` (incomplete learning, generally 1–2 correct successes), `mastered` (3/3 correct; exclude). `correctCount` is capped at 3; wrong/skipped/timeout does not erase prior correct credits.
- `active.answers[id]`: `{choice,correct,reason,at}` where `reason` is `answer`, `timeout` or `skipped`.
- `active.openedAt[id]`: timestamp from first opening; each question gets the duration stored as `active.questionSeconds` (10–300 seconds; 30-second fallback for old saved sessions). The expiry handler records `reason: 'timeout'` and moves to the next question, or finishes on the last question.
- `history` stores up to 50 results, with original question IDs and selected answers.
- Prior v1 and v2 localStorage formats are migrated to v3. Old mastered status gets at least one correct credit; if saved history supports multiple correct completions it contributes those as separate successes. Existing unfinished papers and timer choices remain intact.

## Selection algorithm

Sort all wrong questions by their oldest `lastAttemptAt` with a random tie-break; prioritize those. With remaining slots, mix `seen` learning questions and randomized never-seen questions (reserve up to half the remaining space for new questions while unseen exist). Rotate older learning questions first. Shuffle the final paper. Exclude 3/3-mastered IDs. Never select an ID twice in the same paper.

## Privacy and limitations

Everything stays on device except the normal static file requests to GitHub Pages. No sync/backups. `localStorage` is origin-specific and may be cleared. The built website has only sign/diagram images; question and option wording is Unicode text. Human proofreading of OCR transcriptions remains essential.

## Configurable timer

- `state.settings.questionSeconds`: saved choice for creating the next exam (default 30); never overwrites an active exam.
- `state.active.questionSeconds`: selected duration at exam creation, validated as an integer in the range 10–300.
- Countdown derives from this locked duration minus elapsed wall-clock time since `openedAt[id]`, so refreshing does not grant extra time.
- History results store `questionSeconds` for later display; older results use the 30s legacy fallback.

## Reset implementation

`js/app.js` only calls `resetAllStoredProgress(localStorage)` from the confirmation click handler. The function in `js/quiz-core.mjs` deletes precisely `sl-driving-quiz-v3`, `sl-driving-quiz-v2`, `sl-driving-quiz-v1` and writes a new empty v3 state. Other localStorage keys remain unaffected. Confirm also resets the in-memory selected question count to 40 and default timer to 30 seconds and renders Home. Clicking Cancel / pressing Escape does not update app state.

## Auto-next UI and discard state (v1.6)

The UI stores `active.autoAdvance = {questionId, deadline, cancelled}` using the same existing `sl-driving-quiz-v3` localStorage state. It is set only after a **correct** submitted answer. `tick()` checks the absolute wall-clock `deadline` and advances once. The `Cancel` action persists `cancelled=true` and stops automation until manual Next. Navigation away clears stale auto-next state. Opening the sign viewer or question menu cancels the pending transition. No separate timers, accounts, or storage keys are used.

The `#discard-dialog` is a native HTML `<dialog>` styled inside the web app, with the safe option initially focused. Cancel leaves state and storage untouched; confirmation deletes only `state.active`. Answered progress and history remain stored.
