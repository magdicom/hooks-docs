# Contributing to Hooks documentation

This repository is the separate public documentation site for Hooks. It uses Astro + Starlight and produces static files; it does not contain either package implementation.

## Before changing documentation

1. Check the released package tags and the [source audit](source-audit.md).
2. Treat released implementation, focused tests, Composer metadata, and public APIs as authoritative.
3. Keep core PHP guidance separate from the optional Laravel wrapper.
4. Keep versioned content under `src/content/docs/2.x/`. Add future versions as sibling trees rather than rewriting the 2.x URLs.

Do not invent APIs, requirements, exceptions, or framework integrations. If the released source is ambiguous, document the uncertainty and link the evidence for review.

## Local workflow

Use Node.js 22 and npm:

```bash
npm ci
npm run astro -- check
npm run build
npm run validate
npm run preview:smoke
```

`npm run validate` reports the Markdown file, route, link, package command, PHP example, or secret-pattern check that failed. `npm run preview:smoke` must run after a build because it checks the generated `dist/` output through Astro's static preview server.

Complete PHP examples should use `declare(strict_types=1);`, released method signatures, defined variables, and a clear label when they require Laravel. Do not add PHP, Composer, Laravel, database, CMS, authentication, analytics, cookie, or tracking dependencies to this site.

## Pull requests

Keep changes focused and explain which documentation or implementation backlog task they complete. Pull requests should include:

- the source tag or audit section used for technical claims;
- the affected page paths and planned URLs;
- local validation results;
- any known documentation uncertainty.

GitHub Actions runs on pull requests and pushes to `main`. It installs from the committed `package-lock.json`, checks the Astro project, builds the static site, validates documentation, and smoke-tests the preview routes.

## Deployment boundary

This stage does not deploy the site. Do not add production deployment jobs, SSH keys, DNS changes, cPanel configuration, server paths, or secrets. Future Apache/cPanel preparation belongs in `DEPLOYMENT.md` and must remain separate from the documentation CI workflow.
