# Documentation repository instructions

## Accuracy

Released package tags are authoritative for documentation. Inspect and cite the tagged implementation, tests, Composer metadata, and public APIs before adding claims or examples. Do not invent methods, behavior, requirements, or package integrations.

## Versioning

Current site content is for Hooks 2.x Beta. Keep versioned URLs under `/docs/2.x/` so future versions can be added as sibling trees. Clearly distinguish the framework-independent core package from the Laravel wrapper.

## Examples and links

Use released method signatures and complete PHP examples with `declare(strict_types=1);` where applicable. Validate internal links, navigation, package names, Composer commands, and code examples before review.

## Scope

This repository contains static Markdown/VitePress documentation only. Do not add Laravel, PHP runtime dependencies, databases, CMS features, authentication, analytics, cookies, tracking, or production deployment configuration unless a separate approved task requires it.
