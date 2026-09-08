# Hooks documentation MVP QA

Final pre-production QA was run on 2026-09-08 from a clean dependency install using Node.js `v22.23.1` and npm `10.9.8`.

## Validation results

- `npm ci` passed. npm reported two development dependency audit findings during install; `npm audit --omit=dev --audit-level=moderate` reports zero production vulnerabilities.
- `npm run astro -- check` passed with 0 errors, warnings, and hints.
- `npm run build` passed and generated static output in `dist/`.
- `npm run validate` passed: 13 Markdown files, 54 PHP examples, and 13 planned routes.
- `npm run preview:smoke` passed: all 13 planned routes returned HTTP 2xx.
- `git diff --check` passed.
- Browser QA passed with Playwright Chromium 145.

## Generated-site checks

The build contains:

- the landing page, `/docs`, and all 2.x documentation routes;
- Pagefind assets for local search;
- `sitemap-index.xml` and `sitemap-0.xml` with the `https://hooks.momagdi.com` base;
- canonical and Open Graph metadata on documentation pages;
- corrected GitHub edit links under `src/content/docs/`;
- the original Hooks mark and `robots.txt`.

The current robots policy disallows crawling because `hooks.momagdi.com` has not been deployed. It must be reviewed during the approved production deployment stage.

## Browser QA evidence

The built preview was tested in these real browser contexts:

| Context | Viewport | Theme |
| --- | ---: | --- |
| Desktop | `1440×1000` | Light |
| Desktop | `1440×1000` | Dark |
| Mobile | `390×844` | Light |
| Mobile | `390×844` | Dark |

Every context inspected `/`, `/docs/2.x/`, installation, actions, filters, collectors, processors, renderers, Laravel, API, upgrade, and a missing route returning the 404 page. Checks covered header/sidebar/mobile menu, version label, Pagefind search opening, theme switching, keyboard focus, edit links, code blocks, API tables, external links, footer, and horizontal-overflow detection. Screenshots were captured and visually reviewed for the homepage and API page in desktop light, desktop dark, mobile light, and mobile dark contexts under `/tmp/hooks-*-home.png` and `/tmp/hooks-*-docs-dark.png`.

The desktop layout has the responsive header, primary navigation, sidebar, local search, social link, theme selector, version selector, edit links, code blocks, tables, and footer. Mobile layouts stack the homepage grids and examples, preserve horizontally scrollable code, and expose Starlight's mobile documentation menu. Dark-mode tokens and theme switching were verified in-browser. The current content has no custom callout blocks; no callout-specific styling defect was present to correct.

The build contains no VitePress runtime or configuration.

## Defects found and corrected

- Mobile homepage installation cards expanded the document to `680px` at a `390px` viewport because long Composer commands affected grid minimum sizing. Added minimum-width and code-block constraints so commands scroll within their cards without page overflow.
- API signatures containing PHP union types such as `array|callable` were being parsed as Markdown table separators. Escaped the union pipes and verified the rendered cells in Chromium.
- Updated GitHub Actions from the deprecated Node 20-runtime majors to `actions/checkout@v7` and `actions/setup-node@v7`, both using the Node 24 action runtime. The project itself continues to build with Node 22.

## Final status

The repository is ready for server provisioning, but not for production deployment. Keep `robots.txt` blocking crawling until the site is deployed and verified over HTTPS. No DNS, cPanel, SSL, SSH, deployment-secret, or production workflow configuration has been performed.

## Documentation truth set

The content was checked against:

- `magdicom/hooks` `v2.0.0-beta.1`, commit `cc0b47cce38604e2cd23c50cc528bdd750e61ef6`;
- `magdicom/laravel-hooks` `v2.0.0-beta.2`, commit `37ea485547724b0c354bcf7827aa7f37d637d8a6`.

No unresolved implementation-versus-test contradiction was recorded in the source audit. The documented uncertainty is limited to the beta release status and the consumer's responsibility for compatibility between collector results and custom processors/renderers.

## Production deployment workflow QA

Deployment workflow review date: 2026-09-08.

The first production workflow is now implemented in `.github/workflows/deploy.yml` and remains manually triggered through `workflow_dispatch`. It uses the protected `production` environment, Node.js 22, `npm ci`, the complete validation sequence, SSH key authentication, pinned `known_hosts`, and a concurrency group that prevents overlapping deployments.

The workflow fails closed unless all six production secrets are non-empty, `DEPLOY_USER` is `hooksmomagdi`, and `DEPLOY_PATH` is exactly `/home/hooksmomagdi/public_html`. It packages only `dist/`, uploads to the non-public incoming area, extracts a commit-named release, verifies required output, backs up existing public content, synchronizes with rsync, records the commit/timestamp, and performs HTTPS smoke checks. Old releases are retained and there is no automatic rollback or cleanup.

`robots.txt` continues to disallow all crawlers. Indexing must not be enabled until the first live deployment has been manually accepted over HTTPS.

The workflow is ready to run once the protected environment secrets contain the verified server values and the production environment approval rules allow the operator to proceed. No production deployment has been run by this QA pass.

## Deployment readiness boundary

The repository is pushed to `magdicom/hooks-docs`. Before the first run, verify the DNS target and SSL arrangement, confirm the exact cPanel document root and `hooksmomagdi` permissions, confirm the SSH port and pinned host key, populate the six protected `production` secrets, and confirm required GitHub environment reviewers. The workflow does not deploy automatically on push.
