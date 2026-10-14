## v1.10.0 — Slide-to-next countdown

- Replaced the circular correct-answer indicator with a responsive classic iPhone-inspired `slide to next →` bar.
- Restored the correct-answer delay to exactly five seconds with a blue progress fill, GPU-transformed shimmer, visible 5→1 count and accessible Cancel button.
- Reused the persisted absolute deadline and cancellation state so refresh, tab switching and rapid/manual navigation cannot create duplicate transitions.
- Added a reduced-motion presentation without shimmer while retaining readable progress and countdown state.

## v1.9.0 — Modern blue interface

- Reduced the correct-answer circular auto-next countdown from 5 seconds to 3 seconds.
- Returning to a navigation-skipped question no longer reveals the correct answer, and its timer status reads `Skipped`.
- Removed the footer Previous button while retaining Next and question-menu review.
- Added release-version cache busting for CSS, JavaScript modules and question data without changing saved browser progress.
- Randomized answer-choice positions per new paper and persisted each order across navigation, reload and resume while preserving source answer keys.
- Changed the exam-header exit control label to English `Close`.
- Changed the footer timer caption to English `Time` and matched its size to the countdown.
- Reworked the homepage, exam, results, history and dialogs into a consistent mobile-first blue design with compact progress and navigation cards.
- Added custom accessible early-submit and error dialogs, removing the remaining native `alert()` and `confirm()` interactions.
- Smoothed the three-second auto-next ring with interpolated progress and more frequent timer updates (`v1.9.1`).

## v1.8.0 — Second source-based ten-pass QA

- Repeated ten distinct validation categories on v1.7 against the original PDF.
- Corrected 6 source-reviewed Sinhala fields; logged exact before/after with original PDF page references.
- Restored Q135 source abbreviation rather than making unsourced unit normalization.
- Preserved 171 question IDs, choices/answer positions, images, logic and UI.
- Regression tests and remaining QA limits documented in `QA_REGRESSION_V1_8.md`.

## v1.7.0 — 10-pass Sinhala question QA and font cleanup

- Ran ten source-to-build consistency audit categories against 171 questions / 855 Sinhala fields and 26 PDF pages.
- Corrected 333 text fields; full before/after records in `TEXT_CORRECTIONS_v1_7.csv`.
- Preserved all 171 question IDs, 71 diagrams, and all source-marked correct option numbers.
- Adjusted Unicode Sinhala font-family and readable weights; no bundled fonts.
- Re-ran JavaScript tests, content checks, Chromium browser flow and viewport visibility.
- Logged residual risks for human proofreading and correct-answer verification.

## 1.6.0 — 2026-10-14

- Replaced native discard confirmation with styled, accessible in-app dialog; cancel is the safe default, and discard preserves earned progress.
- After a correct answer, show a 5-second circular countdown and automatically advance, or finish on final question.
- Cancel button halts auto-next until manual navigation, with state persisted across reload.
- Wrong answers remain on-screen; question timeouts retain existing automatic advance.
- Added unit/browser regression coverage for discard confirmation and cooldown navigation.

# Changelog

## 1.5.0 — Opt-in answer review on results screen

- Redesigned the results page to show the score, correct / incorrect / mastered statistics, and navigation controls without rendering the long wrong-answer list visually.
- Added a **Review incorrect answers** section that is collapsed by default; it shows only the number of incorrect, skipped, or timed-out questions until the user expands it.
- Each question inside the review section is also collapsed by default; opening it reveals the Sinhala question, optional road-sign image, the user’s chosen answer (or 'Not answered'), and the correct answer.
- Results reopened from exam history use the same collapsed-by-default interaction. A fully correct attempt shows a simple success message instead of an empty review list.
- Reduced duplicated headings and improved phone-sized spacing. Added Chromium regression tests for closed/open state and long 38-mistake results.
- This is a presentation-only change: scoring, timer, random question selection, three-correct mastery, history, reset, and localStorage data structure are unchanged.


## 1.4.0 — Explicit confirmed progress reset

- Added a clearly visible **Reset all progress** control on Home with an accessible confirmation dialog. Warning explains that mastered credits, review queue, history, unfinished exam and timer preference are permanently deleted.
- Cancel / Escape leaves stored data unchanged; Yes, reset everything creates brand-new state with 171 available questions and 30-second default.
- Clear only current plus v1/v2 legacy quiz keys (avoid old progress reappearing). Other browser data is not touched.
- Added Node test and Chromium browser smoke test for cancel/confirm/reload behavior.

## 1.3.0 — Three-correct mastery

- Mastered requires **three correct answers in three different papers**. Prior mistakes do not erase credits; wrong/skipped/timed-out questions stay prioritized.
- Display 1/3 and 2/3 learning progress and 3/3 completion feedback; home page includes a Learning count.
- Include not-yet-mastered correctly answered questions in subsequent randomized papers, mixed with never-seen ones.
- Upgrade saved browser state to v3 with migration from v2/v1; prior old Mastered flags alone do not count as 3/3.
- Add mastery, priority selection and migration regression tests.

## 1.2.0 — User-selectable question timer

- Added timer quick picks (15, 30, 60, 120 seconds) and custom integer value (10–300 seconds), default 30s.
- Total question time updates when question count or selected timer changes.
- Remember timer preference in browser storage. Each paper stores its own fixed duration, including after refresh or resume; legacy saved papers default to 30s.
- Automatic next question and final auto-submit on timeout remain unchanged. Timed-out questions stay in the learning retry queue.
- Added UI, boundary, persistence, and automatic-expiry tests and updated AGENTS.md and deployment docs.


## 1.1.0 — 30-second automatic navigation

- Set each unanswered question timer to **30 seconds** (from 120).
- As soon as a question expires, record a timed-out incorrect attempt and **automatically navigate to the next question**. No extra tap is required.
- At the final question, expiry **automatically submits** the paper and opens results.
- Any timed-out question is prioritized for future papers until answered correctly.
- The expiry check runs at actual timestamp deadline (not a decrementing counter); reload/resume cannot grant a fresh 30 seconds.
- Browser tab visibility / page restoration checks the deadline again after Safari throttling.
- When a user answers before timeout, immediate green/red feedback is shown and the timer shows **Answered** until the user taps Next.
- Updated home screen time totals, tests, and documentation.

## 1.0.0 — Mobile-optimized Sinhala Unicode version

- Responsive GitHub Pages web app with 171 usable Sinhala questions, 71 associated signs/diagrams, question randomization and mistake repetition.

## Outstanding checks

- Real iPhone Safari verification, deployment validation and independent question text/answer-key proofreading remain pending.
