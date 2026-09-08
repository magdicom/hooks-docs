# Hooks documentation QA

## Visual and editorial pass

This pass was prepared on 2026-09-08 for the live site at `https://hooks.momagdi.com`. It keeps the site on Astro + Starlight, preserves all versioned routes and verified examples, and leaves `robots.txt` blocking all crawlers until the revised live site is manually approved.

The public theme now uses sky blue and slate tokens: light interactive `#0369a1`, hover `#075985`, decorative sky `#0ea5e9`, soft accent `#e0f2fe`, page background `#f8fafc`, ink `#0f172a`, secondary text `#334155`, and borders `#cbd5e1`. Dark mode uses `#020617` for the page, `#0f172a` for raised surfaces, `#1e293b` for secondary surfaces, `#e2e8f0` for primary text, `#94a3b8` for secondary text, `#7dd3fc` for links, `#38bdf8` for stronger accents, and `#334155` for borders. Primary buttons use dark blue with white text; focus rings use visible sky blue; prose links, selected navigation, code surfaces, tables, and cards use neutral slate support colors.

The sidebar is now flat at the useful navigation level: Overview, Getting Started, Hook Types, Processing Results, Integrations, and Reference. The `2.x Beta` label remains in the header version selector, and the `/docs/2.x/` route structure is unchanged.

Public copy was revised across the homepage, introduction, concepts, installation, actions, filters, collectors, processors, renderers, Laravel integration, API reference, upgrade guide, and 404 page. API names, signatures, exceptions, ordering, empty-list behavior, resolver behavior, and complete PHP examples were preserved.

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

The current robots policy disallows crawling even though `hooks.momagdi.com` is live. It must remain blocked until the revised live site is manually reviewed and approved.

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

The site is deployed and served over HTTPS. Keep `robots.txt` blocking crawling until the revised public site is approved. Do not change DNS, cPanel, SSL, SSH, or deployment secrets as part of this editorial pass.

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

The manually triggered workflow remains available for the next approved deployment. This pass did not trigger it.

## Deployment readiness boundary

The repository is pushed to `magdicom/hooks-docs` and production is live. The workflow still requires the protected `production` environment, six deployment secrets, and manual approval; it does not deploy automatically on push.

## Practical use cases pass

The Use Cases guide was added on 2026-09-08 at `/docs/2.x/use-cases/` and placed after Concepts in the visible sidebar. It covers invoice-paid actions, sequential invoice-total filters, dashboard widgets, extensible payment methods, structured order-receipt rendering, boolean checkout decisions, and Laravel container-resolved callbacks. The homepage now links to this guide from its Common use cases section.

Public examples now use meaningful lowercase dot-separated hook names such as `invoice.paid`, `invoice.total`, `dashboard.widgets`, `navigation.items`, and `checkout.allowed`. This is documented as a recommended convention rather than a package restriction. The released core uses exact string keys without normalization, so hook names are case-sensitive and should be treated as stable public contracts. The requested `checkout.payment_methods` example is retained verbatim as the payment-method capability identifier.

Short PHP snippets no longer repeat `declare(strict_types=1);`. Complete-file examples retain it where appropriate, and the documentation explains that strict types are an application choice rather than a Hooks requirement. Route, sidebar, link, hook-name, PHP-method, and preview-smoke validation now includes the Use Cases page; validation no longer requires every PHP block to contain a strict-types declaration.

The page's order-receipt renderer example was checked against the released `Renderer::process(array $results, ProcessingContext $context): string` contract from `magdicom/hooks` `v2.0.0-beta.1`. It keeps collector results structured until one application-owned renderer escapes and formats them. `ConcatenateRenderer` remains documented as the simple built-in option: collector results are joined in order, supported scalar/string/null/Stringable values are accepted, empty results produce an empty string, and unsupported values raise `UnexpectedValueException`. The `BooleanAndProcessor` example likewise documents strict boolean results and `true` for an empty result list.

Core and Laravel calling styles are documented separately. Core examples use a `Magdicom\Hooks` instance and `$hooks->...` methods. Laravel examples use `hooks()` as the primary application-level syntax and show `use Magdicom\LaravelHooks\Facades\Hooks;` with `Hooks::...` as a separate alternative. The docs explain that both Laravel access paths resolve the same singleton, while the core package intentionally has no global helper or static state; constructor injection remains the recommended style for testable application classes.

The synchronized PHP/Laravel tab pass was prepared on 2026-09-09. Starlight's official `Tabs` and `TabItem` components use `syncKey="framework"` with exactly `PHP` and `Laravel` labels. Tabs were added where installation, object access, invocation, or resolver construction differs; API-only method reference examples remain PHP-only because the core signatures and behavior are identical.

The Processors page now has a comparison table and separate guidance for `FirstProcessor`, `LastProcessor`, `FirstNonNullProcessor`, `MergeProcessor`, `FlattenProcessor`, `BooleanAndProcessor`, and `BooleanOrProcessor`. The public examples use the plural `Magdicom\Processors` namespace present on the inspected `2.0` branch, while the source audit retains the immutable beta-tag namespace note and does not claim branch-only APIs such as `processWith()` or `renderWith()` as released beta behavior.

The follow-up audit extended synchronized examples to Concepts and the API reference. The API page now shows PHP and Laravel access for registration and exact-handle removal; inspection, mutation-snapshot, signatures, and supporting contracts remain PHP-only because Laravel does not change those core behaviors. Upgrade guidance also remains PHP-only because it maps the core version-1 API to version 2 rather than teaching a second dispatch implementation.
