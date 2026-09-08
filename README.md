# Hooks documentation

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
npm run preview
```

Markdown documentation lives under `src/content/docs/` and is rendered by Starlight. The static site is generated in `dist/` and can later be copied to an Apache document root. This repository does not contain Laravel, PHP runtime, database, CMS, authentication, or deployment dependencies.

The site is maintained separately from the [`magdicom/hooks`](https://github.com/magdicom/hooks) and [`magdicom/laravel-hooks`](https://github.com/magdicom/laravel-hooks) package repositories.
