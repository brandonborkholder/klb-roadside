# Codex development workflow

## Project map

- `index.html` is the Vite entry document; `src/main.ts` owns the single-page UI and its screen transitions.
- UI pages are rendered in `src/main.ts`: splash, onboarding, capture, review, settings, and success. Put page-specific markup and event binding next to that page's `render*` function; shared visual rules live in `src/styles.css`.
- Domain modules in `src/` are deliberately separated: `camera.ts` captures and compresses photos, `location.ts` reads browser location, `geocoding.ts` reverse-geocodes and validates Loudoun County, `auth.ts` signs in to PublicStuff, `submission.ts` sends reports, `storage.ts` persists local state, and `types.ts` defines shared data.
- `src/config.ts` contains public PublicStuff endpoint identifiers. Do not add credentials, contact data, precise locations, photos, or raw network captures to the repository.
- `public/` contains PWA assets: the service worker, offline page, manifest, and icons. `scripts/` contains the production submission-artifact safety check and icon generator.
- Unit tests mirror their source module in `tests/`; reusable sanitized fixtures live in `tests/fixtures/`.

## Development and verification

- Use `npm ci` for a clean install, `npm run dev` for local development, `npm test` for the Vitest suite, and `npm run build` for TypeScript checking, production build, and submission-artifact validation.
- Run tests and applicable linters/checks for every code change. Documentation-only or unrelated changes do not require the test suite.
- Keep test fixtures synthetic or redacted. Never commit credentials, personal contact data, precise locations, photos, or raw browser network captures.

## GitHub Pages

- Production Pages deployment is `.github/workflows/pages.yml`; it builds and deploys only `master` to the root production site.
- Branch previews are `.github/workflows/preview.yml`; every branch push except `master` and `gh-pages` runs `npm ci`, tests, builds, and publishes to a unique `gh-pages` subdirectory without replacing the production site.
- A preview URL has the form `https://<owner>.github.io/<repo>/<branch>-<run-number>/`. The workflow prints it and updates the open pull request's preview comment when one exists.

## Codex commit workflow

- Push every completed Codex commit to its branch so the branch-preview workflow can publish it.
- After every verification, echo the branch preview URL in the format above so it can be opened for testing.
