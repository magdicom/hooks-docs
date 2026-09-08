# Documentation repository instructions

## Accuracy

Released package tags are authoritative for documentation. Inspect and cite the tagged implementation, tests, Composer metadata, and public APIs before adding claims or examples. Do not invent methods, behavior, requirements, or package integrations.

## Versioning

Current site content is for Hooks 2.x Beta. Keep versioned URLs under `/docs/2.x/` so future versions can be added as sibling trees. Clearly distinguish the framework-independent core package from the Laravel wrapper.

## Examples and links

Use released method signatures and complete PHP examples with `declare(strict_types=1);` where applicable. Run `npm run validate` to check internal links, navigation, package names, Composer commands, representative code examples, and committed-secret patterns. Run `npm run preview:smoke` after `npm run build` to check the static routes through Astro preview.

## Scope

This repository contains static Markdown/Astro/Starlight documentation only. Markdown pages live under `src/content/docs/`. Do not add Laravel, PHP runtime dependencies, databases, CMS features, authentication, analytics, cookies, tracking, or production deployment configuration unless a separate approved task requires it.
