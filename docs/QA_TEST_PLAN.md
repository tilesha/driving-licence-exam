# QA and release test plan

## Automated tests

- `npm test`: 14 deterministic Node tests for data count, no duplicates, question count limits, three-correct mastery, learning/unseen mix, wrong-answer repetition without credit reset, rotation, skip semantics and v1/v2 storage migration.
- `python tools/validate_content.py`: 171 records; one source-marked answer per question; all referenced image files exist and open with Pillow.
- `python tests/browser_smoke.py`: isolated inlined HTML/CSS/JS under Chromium, with mocked `fetch` and localStorage. Checks UI interaction, instant feedback, single-tap skip, menu jumping, compact collapsed results/individual question expansion/history, retry, resume, configurable 10–300-second timeout auto-advance/final auto-submit, and horizontal overflow at 320/375/390/768/1024/1440px. **It does not test real HTTP ES-module fetch or iOS.**

## Manual acceptance scenarios

| ID | Steps | Expected |
|---|---|---|
| QA-01 | Open GitHub Pages URL on iPhone Safari | Home loads, no errors, 171 questions shown. |
| QA-02 | Create 10/20/40 and custom amount | Number is obeyed; available count caps at remaining non-mastered pool. |
| QA-03 | Complete 40 questions | No duplicate question ID, each with four choices and correct source image. |
| QA-04 | Choose incorrect answer | Chosen red, correct green, answer locked. |
| QA-05 | Choose correct answer | Correct green, progress becomes 1/3 or 2/3 and appears in later papers. Only third correct answer yields Mastered and excludes future selection. |
| QA-06 | Finish paper with 3 wrong answers | Next random paper includes wrong questions, and mixes partial-learning questions with unseen questions to fill remaining slots. |
| QA-07 | Have more wrong questions than selected count | Review selection rotates oldest mistakes fairly across attempts. |
| QA-08 | Select 30s, then let one question run over 30 seconds | Marked timeout/incorrect, automatically advances to the next question, and retained for the next paper. Last question automatically finishes and opens results. |
| QA-09 | Refresh or close browser mid-question, reopen | Resume available and time does not reset. |
| QA-10 | Hit Next while unanswered, then review it from the number menu | No Previous control is rendered; Next marks the question skipped and advances on first click. Reviewing it keeps it incorrect/locked without revealing or highlighting the correct answer, and the timer reads `Skipped`. |
| QA-11 | Use question menu and jump | Current unanswered counted wrong; chosen question visible. |
| QA-12 | Review history | Previous score visible, answers hidden initially; opening Review incorrect answers and a specific question reveals the correct answer. |
| QA-13 | Reset progress | Tapping Reset displays irreversible warning; Cancel keeps data; Confirm clears mastery, retry queue, exam history, unfinished attempt and timer preference, makes 171 questions available again. |
| QA-14 | Load text-only and sign-image questions | Text-only no empty placeholder, sign questions show correct illustration. |
| QA-15 | iPhone pinch gesture | Normal scroll works, accidental pinch mitigated where Safari permits; accessibility zoom behavior respected. |
| QA-16 | Test iPhone SE, recent iPhone, tablet and desktop | All options legible, fixed footer not occluding final answer, no sideways scrolling. |
| QA-17 | Open DevTools console/network on GitHub | No missing image, CSS, module or JSON (404), and no runtime errors. |
| QA-18 | Use reload after reviewing a prior answer | Answer remains locked and learning status remains correct. |
| QA-19 | Select custom 45s, start 2 questions and reload | Timer resumes at the original 45s deadline, timeouts auto-advance, last timeout submits. |
| QA-20 | Change stored timer preference while a paper is active | The active paper keeps its original limit; a new paper uses the updated preference. |
| QA-21 | Select 10s and 300s, then try 9s or 301s | Boundary values accepted; invalid values cannot start a paper. |

## Release gate

Data quality verified against official answer key, real iOS Safari and deployed GitHub Pages smoke tests completed, no unresolved critical issues, and explicit user approval.


| QA-22 | Answer same question correctly across three separate papers | 1/3 then 2/3 Learning; after 3/3 status Mastered and exclude from later papers. |
| QA-23 | Answer correctly twice and wrong on the next attempt | Credits remain 2/3, wrong question prioritized; next correct can complete mastery. |
| QA-24 | Reload saved v2 progress where one answer had been marked Mastered | Do not grant 3/3 automatically; migrate with 1+ correct credits inferred from history and keep exam history/resume. |

| QA-25 | Open Reset warning and tap Cancel or press Escape | All learning credits, wrong queue, exam history, timer preference and active paper remain identical. |
| QA-26 | Reset while an unfinished paper exists, confirm Yes | All quiz state clears, default 30 seconds restored; 171 questions available and 0 mastered. |
| QA-27 | Seed legacy v1 and v2 keys, reset, refresh the page | No stale progress returns; legacy keys removed, unrelated storage preserved. |
| QA-28 | On real iPhone Safari open Reset dialog with keyboard/screen reader | Warning readable, Cancel initially focused, modal not clipped; both buttons easily tappable. |

## Results-page UI acceptance (v1.5.0)

| ID | Scenario | Expected |
|---|---|---|
| QA-R01 | Submit 40-question paper with 38 wrong | Summary shows 2 correct, 38 incorrect, 5%. No answers displayed by default; New paper and Home buttons visible without scrolling on typical mobile size. |
| QA-R02 | Open Review incorrect answers | 38 compact question rows appear, but their answers stay hidden. |
| QA-R03 | Open an individual question | Reveal original Sinhala question, optional sign/diagram, user's selected option or Not answered, correct option. |
| QA-R04 | Collapse the question and section | All expanded answer content becomes hidden again. |
| QA-R05 | Reopen an exam from History | Review section starts collapsed, regardless of its previous open state. |
| QA-R06 | Perfect score | Short congratulations message and no empty expandable review. |
| QA-R07 | Test desktop/mobile and keyboard | Tap/click and Enter/Space on native summary toggles content; no horizontal overflow. |
| QA-R08 | Open / close answer details | No changes to localStorage scoring, mastery, or history. |

## 1.6 regression scenarios

| ID | Action | Expected |
|---|---|---|
| QA-29 | Tap Discard unfinished paper | Styled in-page dialog (no browser-native confirmation). |
| QA-30 | Tap Keep my paper, Escape or outside-dismiss | Active paper and progress unchanged. |
| QA-31 | Confirm Yes, discard paper | Active paper deleted; earned progress/history preserved, home shown. |
| QA-32 | Correct answer, wait 3s | Visible ring counts 3→1, next question displayed automatically; final question finishes. |
| QA-33 | Correct answer, tap Cancel | No auto-advance after 3s; question stays until Next. |
| QA-34 | Correct answer, refresh mid-countdown | Saved remaining delay is respected; Cancelled countdown stays cancelled. |
| QA-35 | Wrong answer | Wrong red/correct green; no 3-second auto-next; manual Next works. |
| QA-36 | Timeout on unanswered question | Existing configured timeout still advances immediately. |
| QA-37 | Open road sign or question menu while auto-next pending | Auto-next cancelled; no unexpected background navigation. |
