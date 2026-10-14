# Known gaps / release constraints

Status at repository packaging. The codebase is functionally built but not yet deployed to a user-controlled GitHub repository.

| Priority | Gap | Evidence / next action |
|---|---|---|
| HIGH | Only 171 usable questions, not 176 | Source PDF labels 1–172; Q153 is blank; 173–176 are absent. Q153 deliberately excluded by user decision. Supply missing source material for 176. |
| HIGH | Answer correctness not independently verified | Each of 171 options was captured from the PDF's blue-marked answer, but the PDF is not an official current-law key. Manually validate with authoritative Sri Lankan driving materials. |
| HIGH | Real iPhone Safari E2E not tested | Automated test executes Chromium DOM/CSS logic in isolation. Open the deployed GitHub Pages URL on actual iPhone, check screen/timers/pinch behavior. |
| HIGH | v1.9 blue redesign browser geometry not revalidated locally | Python Playwright and an interactive browser were unavailable in the redesign environment. Re-run `tests/browser_smoke.py` and `tests/mobile_visibility.py` before treating the earlier viewport-fit figures as current. |
| HIGH | Sinhala OCR transcripts not fully proofread | All 171 questions and 684 options are editable Unicode text, not screenshots. Automatic OCR and a few visual corrections were used; high-confidence OCR can still misread characters or numbers. Manually review `docs/TRANSCRIPTION_REVIEW.csv` against the supplied PDF before relying on exact wording. |
| MEDIUM | Pinch zoom prevention is best-effort | CSS `touch-action: pan-x pan-y` is used. iOS may still allow zoom, especially accessibility zoom. Do not use brittle JavaScript to block OS functionality. |
| MEDIUM | Storage is device/browser-bound | localStorage can disappear if site data is cleared, private mode or quota policy; no accounts or backup because user explicitly declined import/export. |
| MEDIUM | Full HTTP / GitHub deployment not verified | Test environment blocks direct localhost/file browser navigation. Test module/assets loaded from GitHub Pages after upload and check Network/Console for 404s. |
| RESOLVED | Original PDF number embedded in question image | Question wording is now displayed as text; only random-paper position appears on the exam screen. |
| RESOLVED | Large question/answer screenshot bank | Removed all text screenshot files from the deployable build; kept only 71 sign and diagram assets. |

### Items intentionally not included

User accounts, cloud sync, admin panel, offline/PWA installation, export/import, external database, payment or native iOS application. These are out of scope by design, not unfinished features.

### Mobile viewport fit — current compact Unicode build

The figures below are a pre-v1.9 baseline and must be re-measured for the blue redesign; they are retained only for comparison and are not a pass claim for the new CSS.

The earlier mobile UI made road signs about 340px tall and used oversized option padding, causing answer #3/#4 to appear below the footer. The compact mobile UI reduces this spacing and uses a smaller image with an accessible tap-to-enlarge dialog. Browser-harness geometry with real question text/images reports:

| Chromium viewport | Full four-answer visibility |
|---|---|
| 414×896 (iPhone XR-like) | 171 / 171 |
| 390×844 | 171 / 171 |
| 375×812 | 171 / 171 |
| 320×650 | 157 / 171; 14 require natural scrolling |

This is simulated Chromium, not Safari. Device font differences, larger accessibility text settings, browser chrome, landscape, and zoom can increase vertical height; scrolling remains deliberately enabled. Do not hide long answers or shrink Sinhala text below readability thresholds merely to force a no-scroll claim. Run `python tests/mobile_visibility.py` to repeat the audit.

- Configurable timers were tested under simulated Chromium; verify the 10–300-second selector, UI sizes and background/foreground expiration on actual iOS Safari.

## 1.3.0 mastery behavior

A learning question requires **three correct answers on three distinct papers** before its status becomes Mastered. Previous saved v2/v1 correct-answer totals were not always recorded in full. The v3 migration infers the count from saved history (up to 50 papers), crediting old Mastered entries with at least one success. Consequently, some older practice successes no longer present in stored history cannot be recovered; those questions may require additional correct attempts. This preserves history without incorrectly granting 3/3.

## 1.4.0 reset behavior

Reset confirmation, Cancel, persistent reset/reload and legacy-key cleanup were tested in isolated Chromium. **Real iPhone Safari confirmation-dialog usability and GitHub Pages hosting checks remain pending.** Reset intentionally deletes progress permanently from this browser only; there is no recovery, cloud sync or export/import.

- The correct-answer five-second slide animation and discard confirmation need live iPhone Safari validation, including shimmer performance, background/foreground behavior and narrow-footer layout.


### Following the 10-pass Sinhala text audit (v1.7)

- **333 field-level text corrections** have been applied from the uploaded PDF and cross-question terminology checks, including restored diagram letters.
- No detected missing strings or corrupted road-sign files remain. **Human line-by-line proofreading of all 855 fields is still not complete**; natural-looking OCR substitutions may escape automated rules.
- The original OCR assigned less than 85% confidence to 59 snippets. These are listed in `QA_LOW_CONFIDENCE_FIELDS.csv` for prioritized human review; confidence is not a definitive accuracy score.
- The original PDF answer keys were preserved, not checked against updated driving rules.
- CSS uses installed Sinhala fonts rather than bundling a font; iPhone Safari display should still be checked on a physical device.


### Second ten-pass audit v1.8

Automated validations and targeted visual PDF corrections are not full native Sinhala proofreading. OCR confidence flags remain; Q135 option 2 includes a possibly erroneous **source** abbreviation `පැ.සැ.` and should be checked by a fluent reviewer. Correct-answer blue markings still need independent rules verification.
