# Approved website requirements

## Scope

A responsive browser-based (not native, not PWA) Sinhala driving licence practice website hosted at GitHub Pages. Data and assets reside in the repository. No authentication, remote database, import/export, offline install prompt or analytics.

## Core flow

1. Home displays total questions, mastered (3/3 correct), available, wrong-for-review, learning (1–2/3 correct) and unseen counts.
2. User chooses 10, 20, 40 or any valid custom count, then starts a randomly built paper.
3. Every paper prioritizes previously wrong questions first, then mixes questions answered correctly only 1–2 times with never-seen questions. If unseen questions exist, reserve up to half of the remaining slots for them. A question is mastered only after 3 correct answers in distinct papers and is then excluded.
4. Current question displays Sinhala Unicode text, four Unicode answer choices and an optional road-sign/diagram image.
   The four answer choices are randomly ordered when each new paper is created. That order is persisted for the life of the paper so navigation, refresh and resume cannot reshuffle a question mid-attempt. Source choice numbers and `correct_option` remain unchanged for scoring and reference integrity.
5. User chooses a 10–300-second limit per question before creating a paper (default 30s; quick picks 15s, 30s, 60s, 120s). The chosen limit is stored with the paper and enforced by a persisted first-opened timestamp. On timeout the question is marked incorrect/unanswered and the UI auto-advances to the next question. Last-question timeout auto-submits the paper and shows results.
6. Wrong selection: chosen answer red, correct answer green, immediate feedback. Right selection: green correct highlight plus current correct-answer progress (1/3, 2/3, 3/3). Submitted answers cannot be changed.
7. Navigation away without answering or timer expiration records incorrect and adds it to future review papers.
8. Footer navigation is forward-only: there is no Previous control and Next remains available. The number menu (including future and completed questions), early submit (confirmation), and exit/resume remain available.
9. End of paper shows percentage, correct/incorrect/mastered totals, with **incorrect-answer review collapsed by default**. The user explicitly expands **Review incorrect answers**, then expands individual questions to see their selected and correct answers, plus images when present. No list of answers may auto-expand on first render. Exam history is saved locally (up to 50 completed papers) and uses the same collapsed review UI. A perfect paper instead displays a short success note.
10. Users can explicitly **Reset all progress** at any time from Home, including with an unfinished attempt (after navigating Home). An accessible warning states it is irreversible; **Cancel** leaves all data intact; only **Yes, reset everything** deletes learning/mastery progress, wrong-answer review queue, previous results, active paper and timer preference and reopens a fresh Home with 171 available questions. Clear legacy app storage keys too, but never unrelated site storage.
11. After all questions have reached three correct answers, the same confirmed reset allows a brand-new learning cycle. Incorrect answers do not reset previously earned correct-answer credits, but cause priority repetition.

## Platform/design

- Compatible intent: iPhone Safari, Android Chrome, tablets, desktop Chrome/Firefox/Edge/Safari.
- Use the v1.9 professional blue visual system: `#2563EB` primary, `#1E40AF` dark blue, `#16A34A` success, `#EF4444` error, `#F8FAFC` background, white cards, and `#E2E8F0` borders. Keep cards compact, rounded and subtly shadowed.
- Responsive layout; iOS safe area; readable Sinhala text; no horizontal overflow. No blank illustration placeholder for text-only questions.
- CSS `touch-action: pan-x pan-y` attempts to reduce unintentional pinch zoom while leaving scrolling enabled; OS accessibility overrides are respected.
- Local storage on current browser only. No synced accounts, export/import or permanent backup.

## Source boundaries

- PDF includes IDs 1–172 with Q153 blank. Web app includes 171 question records.
- IDs 173–176 were not supplied; do not fabricate them.
- Correct answers reflect source blue marked selections; verify against official material before treating scores as authoritative.

## Version 1.3.0 mastery migration

Progress uses `sl-driving-quiz-v3` (`version:3`), storing a capped `correctCount` for each question. v2/v1 states are migrated in the browser without losing saved history/active exams. Previously mastered entries without reliable historical totals are credited with 1/3, **not** 3/3.

## Version 1.4.0 reset confirmation

The home reset button opens a native HTML `<dialog>` with focus initially placed on **Cancel**. Escape and Cancel leave progress untouched. The destructive confirm removes v3/v2/v1 localStorage keys then stores `freshState()` with default 30s, empty progress/history and no active exam. **There is no undo.**

## Version 1.5.0 results design

The Results screen keeps the review section closed on initial display, including when loading an attempt from history. Use native `<details>` / `<summary>` for touch, keyboard, and accessible expand/collapse behavior. Present each incorrect question as another independently collapsible entry. Avoid dumping all answer text into a long results page. Do not change saved learning state when the user opens a review.

### v1.6 interaction changes

- Correct answer: lock, highlight, show a five-second horizontal progress bar with Cancel and Next, and automatically advance unless Cancel is selected. Cancel preserves the current question until manual Next and survives refresh. On the final question, auto-advance shows Results.
- Incorrect answer: show correction without a forced countdown; move forward manually. Timed out unanswered question: automatically advance immediately.
- Discard unfinished paper: in-page confirmation with Cancel as the safe default; keep answered learning credits.
