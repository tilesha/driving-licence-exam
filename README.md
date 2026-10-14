# Sri Lanka Driving Licence Practice — Web App

A mobile-first **browser website** for studying Sinhala Sri Lanka driving licence exam questions. Runs in iPhone Safari, Android browsers, and desktop browsers. No installation, login, server database or paid services are required.

## Quick start

Run a local web server in this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Alternatively, run `npm run serve` if Node/npm is available. Do **not** open `index.html` directly from a `file://` URL: browsers may block `fetch` of `data/questions.json` and ES module imports.

## Deploy to GitHub Pages

1. Create a **public** GitHub repository, e.g. `driving-licence-practice`.
2. Upload the **contents** of this folder (so `index.html` is at the repository root).
3. Open repository **Settings → Pages**.
4. Choose **Deploy from a branch**, then `main` and `/ (root)`.
5. Save; visit `https://<YOUR-USERNAME>.github.io/driving-licence-practice/` once GitHub publishes the Pages URL.

No build step, npm install, tokens or environment variables are necessary. See `docs/DEPLOYMENT.md` for tests/checklist.

## Features

- 171 four-option questions from the provided 26-page source PDF, excluding blank Question 153; Unicode Sinhala question/answer text and optional road-sign images.
- Select 10, 20, 40 or any custom count from 1 to the available question count.
- Select 15s, 30s (default), 1m, 2m, or custom 10–300 seconds per question. The app previews the total question time. The preference saves in localStorage, while each started exam locks in its own limit.
- Random papers, no duplicate questions inside the same paper.
- **3 correct answers in 3 separate papers** are required to master each question (not necessarily consecutive). One or two correct answers count as **Learning** and repeat alongside unseen questions. Wrong/skipped/timed-out questions remain prioritized without erasing earlier correct credits. Mastered questions are withheld until reset.
- Immediate green/red correct/incorrect feedback, and a **configurable 10–300 seconds per question** (default 30s). Presets: 15s, 30s, 1m, 2m; custom seconds supported. Unanswered questions automatically advance on timeout; the final timeout automatically opens results. Wrong, timed-out and not-yet-mastered questions return on future attempts.
- Previous/Next, question-number jump menu, finish paper, and recent history. The compact **Results** page hides incorrect answers by default; open **Review incorrect answers**, then tap an individual question to reveal your answer and the correct answer.
- Automatically store/resume using `localStorage` on the same browser/device. Progress saved by earlier versions is migrated to the 3-correct rule, using available history and otherwise crediting previously mastered questions with at least 1/3. No export/import.
- Responsive portrait, landscape and desktop design; attempt at accidental pinch zoom reduction via CSS.

## Important constraints

- The uploaded PDF numbers questions **1–172**. Question **153 is blank** and intentionally omitted; **173–176 are not present**. Thus the usable question bank contains 171, not 176.
- Source blue-marked answers were extracted for all 171 questions, but **independent official answer verification remains pending**.
- Questions and choices display as **real Unicode Sinhala text**, not screenshots. The PDF text layer was unreliable, so 855 text segments were transcribed with Sinhala OCR and some clear errors corrected from source. **All transcripts require human proofreading** before use as an authoritative exam resource. See `docs/SINHALA_TRANSCRIPTION.md` and `docs/TRANSCRIPTION_REVIEW.csv`.
- Some questions do not contain a road sign or diagram; this is expected.
- An active question's selected time limit is timestamp-based and does not reset after page reload. An unanswered question automatically advances at expiry; if it is the last question, the attempt completes. Leaving an unanswered question through manual navigation marks it wrong. Once answered, the question remains visible for immediate green/red feedback until Next is tapped.
- `localStorage` may be lost after browser data clearing, in private sessions or storage restrictions, and does not sync between devices.

## Verification

```bash
npm test
python tools/validate_content.py
python tests/browser_smoke.py  # optional: needs Python Playwright and Chromium
```

The Chromium browser test uses isolated inline files because this particular test environment blocks navigation to local HTTP and file URLs. A deployed-site smoke test on real iPhone Safari is still required.

## Repository docs

Read [docs/SINHALA_TRANSCRIPTION.md](docs/SINHALA_TRANSCRIPTION.md), [docs/TRANSCRIPTION_REVIEW.csv](docs/TRANSCRIPTION_REVIEW.csv), [AGENTS.md](AGENTS.md), [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/KNOWN_GAPS.md](docs/KNOWN_GAPS.md), [docs/QA_TEST_PLAN.md](docs/QA_TEST_PLAN.md), and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Mobile reading layout revision

Mobile portrait screens use a compact header, a smaller road-sign image, and tighter but readable answer rows. Typical questions aim to display all four options without scrolling at 390–414 CSS pixels of width and 844–896 pixels of height. Extra-long Sinhala text and complex diagrams still require normal vertical scrolling; this is preferable to shrinking text excessively. The navigation footer remains visible.

### Checking mobile usability

`python tests/mobile_visibility.py` checks the question-to-footer fit for all 171 records using the original road-sign assets at four phone viewport sizes. At the initial compact revision, 171/171 fit on Chromium 414×896, 390×844 and 375×812; 157/171 fit on 320×650. This is not a guarantee on real iOS Safari or with enlarged accessibility fonts. Tap any sign/diagram for a larger view.

## Results page (v1.5.0)

After a paper, the summary screen does not dump all the incorrect answers onto the page. It displays the score, correct, incorrect and mastered counts. The **Review incorrect answers** accordion is initially closed. Opening it reveals a list of question numbers; selecting a question reveals the original question, optional sign, the user's answer and the correct answer. History attempts open with the review closed too. Reviewing never changes mastery.

## Version history

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for the 3-correct mastery rule, configurable timer and automatic navigation updates.

## Version 1.6 — Updated exam navigation

- A correct response shows a 5-second circular countdown and then automatically shows the next question. At the last question it opens Results. **Cancel** disables automatic navigation for that question until Next is tapped.
- Incorrect answers wait for manual Next; unanswered question deadline still triggers automatic advance.
- Discarding an unfinished exam shows an in-page dialog with **Keep my paper** and **Yes, discard paper**. It removes only that unfinished paper and keeps previously earned learning progress.


## Version 1.7 — Sinhala text comparison (10 QA passes)

The previous OCR-derived Sinhala text was checked in 10 structured PDF and consistency audit passes. **333 text fields were changed**, covering 171 usable questions (855 text fields), without changing answer keys or quiz behavior. See `docs/QA_TEN_PASS_SUMMARY.md`, `docs/TEXT_CORRECTIONS_v1_7.csv`, and `docs/QA_LOW_CONFIDENCE_FIELDS.csv`.

Text now favors a native Sinhala font stack: Noto Sans Sinhala / Sinhala Sangam MN / Iskoola Pota. No additional fonts are bundled or installed.

Validated: 14/14 unit tests, zero content validator errors, Version 1.6 browser interactions, and mobile Chromium viewports. Still pending: native Sinhala line-by-line proofreading, independently verifying original answer choices, and real Safari on a physical iPhone.


## Version 1.8 — second 10-pass verification

Compared the latest question bank again against the original 26-page PDF. Applied 6 source-checked text corrections, preserved all answer keys and 171 question IDs. Details: `docs/QA_SECOND_TEN_PASS_SUMMARY.md` and `docs/QA_SECOND_PASS_CORRECTIONS.csv`. Independent native Sinhala proofreading and traffic-rule validation remain outstanding.
