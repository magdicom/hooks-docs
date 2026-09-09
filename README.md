# Hooks — Extension points for PHP

The official Astro + Starlight documentation website for [Hooks](https://github.com/magdicom/hooks).

## Requirements

- Node.js 22
- npm 10 or newer

## Local development

```bash
npm ci
npm run dev
```

## Validation and build

```bash
npm run astro -- check
npm run build
npm run validate
npm run preview:smoke
```

`npm run validate` checks Markdown frontmatter and fences, planned routes and sidebar links, internal documentation links, representative PHP examples, Composer commands, package names, and committed-secret patterns. `npm run preview:smoke` builds on the existing `dist/` output and checks every planned route through `astro preview`.

Build extensible PHP applications without tightly coupling modules. Run actions, transform values, and collect contributions through clear, named extension points.

The production site is live at `https://hooks.momagdi.com`. Canonical URLs, sitemap output, and `public/robots.txt` use that domain.

Markdown documentation lives under `src/content/docs/` and is rendered by Starlight. The static site is generated in `dist/` and is copied to the Apache document root by the manually triggered production workflow. This repository does not contain Laravel, PHP runtime, database, CMS, or authentication dependencies.

The site is maintained separately from the [`magdicom/hooks`](https://github.com/magdicom/hooks) and [`magdicom/laravel-hooks`](https://github.com/magdicom/laravel-hooks) package repositories.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the source-of-truth, review, validation, versioning, and non-deployment rules for documentation changes.
