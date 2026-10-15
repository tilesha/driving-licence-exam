<div align="center">

# Sri Lanka Driving Licence Exam

**A free, mobile-friendly Sinhala driving licence theory practice website.**

Practice Sri Lankan road rules, traffic signs, and theory questions through focused timed papers. The website runs entirely in the browser, saves learning progress locally, and requires no account or installation.

[![HTML, CSS, JavaScript](https://img.shields.io/badge/HTML%20%7C%20CSS%20%7C%20JavaScript-2563EB?style=flat-square)](https://github.com/tilesha/driving-licence-exam)
[![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-16A34A?style=flat-square)](https://tilesha.github.io/driving-licence-exam/)
[![Hosted on GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-1D4ED8?style=flat-square&logo=github)](https://tilesha.github.io/driving-licence-exam/)

## [Launch Practice Exam →](https://tilesha.github.io/driving-licence-exam/)

[View the GitHub repository](https://github.com/tilesha/driving-licence-exam)

</div>

## Overview

This project provides a simple way to practise Sri Lankan driving licence theory questions in Sinhala. Users can study road signs, create timed practice papers, track learning progress, revisit difficult questions, review past results, and resume unfinished papers.

Everything runs directly in a modern browser. There is no registration, app installation, backend service, or cloud database.

## Key Features

| Feature | Description |
|---|---|
| **171 practice questions** | Sinhala Unicode questions with four answer options and relevant road-sign or diagram images. |
| **Flexible practice papers** | Choose 10, 20, 40, or a custom number of available questions. |
| **Custom question timer** | Select 15 seconds, 30 seconds, 1 minute, 2 minutes, or a custom 10–300 second limit. |
| **Smart learning system** | A question becomes Mastered after correct answers in three separate papers. |
| **Priority review** | Incorrect, unanswered, skipped, and timed-out questions return with priority in later papers. |
| **Automatic navigation** | Correct answers use a green 3-second countdown; incorrect answers use a red 5-second countdown. Users can Cancel or press Next manually. Unanswered questions advance when their configured timer expires. |
| **Learning progress** | Track Mastered, Need Review, Learning, Unseen, and distinct Practiced questions. |
| **Resume practice** | Continue an unfinished paper with its saved question order, answers, and timer state. |
| **Results and history** | Review scores, recent attempts, and expandable details for incorrect answers. |
| **Responsive design** | Designed for iPhone Safari, Android browsers, tablets, and desktop browsers. |

## How It Works

1. Open the [practice website](https://tilesha.github.io/driving-licence-exam/).
2. Choose a question count and time limit.
3. Start a randomly generated practice paper.
4. Answer each question and review the immediate feedback.
5. Check the result, review mistakes, and continue learning.

A question becomes **Mastered** after it is answered correctly in three separate papers. Earlier correct credits remain even if the question is answered incorrectly later.

## Technology

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure and accessible dialogs. |
| CSS3 | Responsive, mobile-first presentation and interaction states. |
| JavaScript | Quiz flow, timing, scoring, selection, and learning rules. |
| JSON | Static question-bank data. |
| localStorage | Browser-local progress, preferences, active papers, and history. |
| GitHub Pages | Static website hosting. |

The project has no backend database, user authentication, analytics, or external application framework.

## Run Locally

This is a static HTML, CSS, and JavaScript project. Clone it and start a local HTTP server:

```bash
git clone https://github.com/tilesha/driving-licence-exam.git
cd driving-licence-exam
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

A local HTTP server is required because browsers may block JavaScript modules and JSON loading when `index.html` is opened directly with a `file://` URL.

Run the deterministic quiz tests with:

```bash
npm test
```

Validate the question records and referenced images with:

```bash
npm run audit
```

## Documentation

- [Product requirements](docs/REQUIREMENTS.md)
- [Application architecture](docs/ARCHITECTURE.md)
- [QA and test plan](docs/QA_TEST_PLAN.md)
- [GitHub Pages deployment](docs/DEPLOYMENT.md)
- [Version history](docs/CHANGELOG.md)
- [Known gaps and release constraints](docs/KNOWN_GAPS.md)
- [Sinhala transcription notes](docs/SINHALA_TRANSCRIPTION.md)

## Privacy and Saved Progress

Learning progress is stored only in the current browser using `localStorage`. No account is required, and the website does not submit personal information to a server.

Progress does not automatically synchronize between devices or browsers. Clearing site data, using private browsing, or changing the website origin may remove or separate saved progress.

## Important Disclaimer

This is an independent educational practice website, not an official Sri Lankan government driving licence examination service.

The 171 questions come from the source document supplied to this project. Question 153 was blank in that document and is intentionally excluded. The Sinhala transcriptions still require complete human proofreading, and the marked answer keys have not been independently verified against current official regulations.

Confirm important road rules and legal requirements using authoritative Sri Lankan sources.
