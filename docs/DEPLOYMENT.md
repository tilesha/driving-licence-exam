# GitHub Pages deployment guide

## Before publishing

1. Confirm correct code in the root of the archive (`index.html`, `css/`, `js/`, `data/`, `assets/`, `.nojekyll`).
2. Run `npm test` and `python tools/validate_content.py`.
3. Do not publish any secrets or credentials (none are required by this project).
4. Note the official-answer-key and iOS test gaps in `KNOWN_GAPS.md`.

## Publish

1. Create a public GitHub repository (example: `driving-licence-practice`).
2. In the repository root, upload all contents of the provided ZIP, **not a single folder containing those contents**.
3. Commit to the `main` branch.
4. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
5. Select Branch `main` and Folder `/ (root)`, then Save.
6. Open `https://YOUR-USERNAME.github.io/driving-licence-practice/` after publishing finishes.

## Smoke checks

- Confirm no broken pictures and 171 on the Home screen.
- Create a 3-question custom attempt. Make one answer wrong, one right, leave one unanswered and press Next; result should be 1/3.
- Start another paper; wrong questions should appear and the correct one should not.
- Refresh the site mid-paper and verify resume and remaining time.
- On Home tap Reset all progress, verify the warning; Cancel preserves progress and Confirm clears all exam state, then refresh to ensure data stays cleared.
- Repeat on real iPhone Safari at normal and landscape orientation.

## Changes to source questions

Update `data/questions.json` and image files together, rerun `python tools/validate_content.py`, and commit/deploy the changed files. Keep original PDF numbering stable and don't manufacture absent source answers.

## Notes

- GitHub Pages serves static files; no need for PHP, Node server, secret keys or cloud database.
- If a repository path is renamed, asset links are relative and should keep working.
- localStorage is scoped to the website origin and may not transfer if the domain/origin changes.
