# Mohammed Muayad — Dark Signal Portfolio

AI Engineering · Data Analytics

**Obsidian Signature — Final Precision Pass Candidate, 11 November 2026. Built on the user-approved Signature Review 01; not deployed.**

## Local preview

Open `START_PREVIEW_WINDOWS.bat` one directory above `site/`, or use VS Code Live Server to open `site/index.html` (for example `http://127.0.0.1:5500/site/index.html`).

Alternatively, run this from inside `site/`:

```bash
python -m http.server 8000
```

Visit `http://127.0.0.1:8000/index.html`. Use HTTP, not `file://`, because internal page navigation uses `fetch`.

## Site files

- `index.html` — homepage and projects
- `factory.html` — Factory Sensor Telemetry case study
- `app.js` — common interactions and SPA navigation
- `style.css` — global styling
- `notebooks/01_data_quality_analysis.html` — Data Quality notebook reader
- `notebooks/02_data_cleaning_validation.html` — Data Cleaning notebook reader
- `notebooks/notebook.js`, `notebooks/notebook.css` — notebook interactions and presentation
- `experiment/experience.css`, `experiment/experience.js`, `experiment/disclosure-motion.js`, `experiment/industrial-intelligence.css` — shared styles and effects
- `assets/` — portrait, graphics, and English / Arabic PDF reports
- `downloads/` — original .ipynb files and project archive

## Preservation and release policy

This candidate is derived from the Scroll Jank Diagnostic archive the user found smooth in VS Code Live Server. The approved Clean Stable base was preserved; the Obsidian palette has been integrated into `experiment/industrial-intelligence.css`, and the temporary `obsidian-concept.css` layer was removed. Six original images missing from the Obsidian test ZIP were restored from Clean Stable byte-for-byte. An asset URL correction in `app.js` ensures cross-folder SPA navigation resolves images against their destination document. No existing scroll timing, CSS motion sequence, or artwork was changed.

The `site/` directory is ready for local review and contains `.nojekyll` for GitHub Pages. Do not publish without approval. On deployment, verify cache refresh, mobile navigation, notebook transitions, all download links and interactive details. A local test does not establish identical performance in every browser.

Portfolio and project images, reports and text are retained as supplied, with no new reuse license.

## Image integrity and style acceptance

- `assets/report-cover.png` and the four chart PNGs are present and decoded successfully.
- `assets/share-card.png` is present for link previews.
- All 15 image/PDF/SVG assets match the previously approved Clean Stable files byte-for-byte.
- All four document shells use the integrated Obsidian Signature stylesheet.
- Factory art maintains original cyan signal routes and warm amber data readings; enhancements affect only surrounding neutral UI.
- The four chart `<img>` elements now have intrinsic width/height to reserve space while native lazy loading works.

See `../QA_REPORT_AR.md` and `../CHECKLIST_AR.md` for reviewed changes and limits of automated browser testing.

## Final Precision Pass (review candidate)

The approved surfaces, layout, hero motion, scrolling and navigation logic are unchanged. The only new code is a small set of CSS rules appended inside the existing `experiment/industrial-intelligence.css` for neutral-silver keyboard focus, slightly more legible factory labels on mobile and 44px link targets in the Factory files section and notebook table of contents. The four HTML shells reference the updated CSS revision to prevent stale caching. The prior Obsidian Signature archive is preserved independently and is the rollback source.

This is a **review candidate**, not an instruction to deploy. See the root QA report and checklist for limitations and acceptance steps.
