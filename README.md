# Mohammed Muayad — Portfolio

Artificial Intelligence Engineering · Data Analytics

Published at: https://mohadmuayad.github.io/

## Hosting

GitHub Pages: `main` branch, `/(root)`. No build step, Node, secrets, or custom Actions workflow. Keep `.nojekyll`.

## Files

- `index.html`: homepage and Project Milestone
- `factory.html`: Factory Sensor Telemetry case study
- `style.<hash>.css` / `app.<hash>.js`: versioned styles and scripts
- `assets/`: images, Arabic and English reports, and site imagery
- `downloads/`: analysis notebooks and English project archive
- `notebooks/`: browsable notebooks

## Safe updates

The CSS and JavaScript filenames carry a SHA-256 fingerprint (first 12 hexadecimal characters). When these files change, give them new names and update references in both HTML files in one commit. Remove unused previous assets when publishing a fully new release. A browser may temporarily cache HTML or social previews after a deployment; invalidate by reloading and check fresh windows.

For a local test run `python -m http.server 8000` from this directory and visit http://localhost:8000/; check `index.html` and `factory.html`.

## Project notes

The sensor data are synthetic and historical, not live telemetry. The portfolio retains the project's source attribution. The reports are in English and Arabic. The website, portrait, and project reports are not implicitly licensed for reuse.
