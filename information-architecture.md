# Hooks Documentation Information Architecture

This is the approved route, navigation, and versioning contract for the first Hooks documentation website. It is intentionally separate from implementation details so the Astro/Starlight scaffold and content work can be reviewed against a stable map.

## Product and URL assumptions

- Site name: **Hooks**.
- Production canonical origin: `https://hooks.momagdi.com`.
- Current documentation version: **2.x Beta**.
- Site root is the concise landing page; versioned technical content lives below `/docs/2.x/`.
- Astro is configured for static output with a root base (`/`) and Starlight serves the versioned documentation tree.
- Leaf documentation URLs do not expose `.html` or `.md`.
- The site is static. Route behavior must work when the generated output is copied to an Apache document root.
- `/docs` is an entry route only and redirects users to `/docs/2.x/`.

The visual system must remain original to Hooks. The information architecture may use familiar versioned documentation navigation, but it must not copy Laravel's branding, typography, layout, icons, gradients, or trade dress.

## Canonical route map

| Route | Source page | Page role | Primary audience |
| --- | --- | --- | --- |
| `/` | `index.md` | Landing page, beta notice, concepts, examples, comparison guidance, and primary links | Everyone |
| `/docs` | generated redirect page | Redirects to `/docs/2.x/` | Everyone entering the docs root |
| `/docs/2.x/` | `src/content/docs/2.x/index.md` | Introduction and version landing page | New and returning users |
| `/docs/2.x/installation` | `src/content/docs/2.x/installation.md` | Core and Laravel beta installation, requirements, Composer stability guidance | New users |
| `/docs/2.x/concepts` | `src/content/docs/2.x/concepts.md` | Choosing actions, filters, collectors, Events, or Pipeline | New and integrating users |
| `/docs/2.x/actions` | `src/content/docs/2.x/actions.md` | Action registration, invocation, priority, return behavior, handles, and empty dispatch | Core users |
| `/docs/2.x/filters` | `src/content/docs/2.x/filters.md` | Sequential transformation and invocation arguments | Core users |
| `/docs/2.x/collectors` | `src/content/docs/2.x/collectors.md` | Raw result collection, ordering, empty results, and explicit arguments | Core users |
| `/docs/2.x/processors` | `src/content/docs/2.x/processors.md` | Collector processors, contracts, built-ins, inputs, outputs, failures, and examples | Core users |
| `/docs/2.x/renderers` | `src/content/docs/2.x/renderers.md` | Collector renderers, string contract, built-ins, and examples | Core users |
| `/docs/2.x/laravel` | `src/content/docs/2.x/laravel.md` | Auto-discovery, facade, helper, container, resolver, singleton, and long-running processes | Laravel users |
| `/docs/2.x/upgrade` | `src/content/docs/2.x/upgrade.md` | Version-1 to 2.x migration mappings and removed APIs | Existing users |
| `/docs/2.x/api` | `src/content/docs/2.x/api.md` | Human-written public API summary with signatures, returns, exceptions, and applicable types | Reference users |

The `/docs/2.x/` page is the introduction. A separate `/docs/2.x/introduction` route is intentionally not created, avoiding duplicate canonical content and preserving the requested URL set.

## Source tree contract

The planned Markdown tree is:

```text
src/
├── pages/
│   └── index.astro          # root landing page
└── content/
    ├── content.config.ts
    └── docs/
        ├── index.md         # redirect target for /docs
        └── 2.x/
            ├── index.md     # introduction and version landing page
            ├── installation.md
            ├── concepts.md
            ├── actions.md
            ├── filters.md
            ├── collectors.md
            ├── processors.md
            ├── renderers.md
            ├── laravel.md
            ├── upgrade.md
            └── api.md
```

The `src/content/docs/index.md` page should contain only a clear redirect mechanism and a fallback link to `/docs/2.x/` for clients that do not automatically follow it. It must not become a second documentation landing page.

## Header navigation

The desktop header and responsive menu use this order:

1. **Docs** → `/docs/2.x/`
2. **Concepts** → `/docs/2.x/concepts`
3. **Laravel** → `/docs/2.x/laravel`
4. **Upgrade** → `/docs/2.x/upgrade`
5. **GitHub** → `https://github.com/magdicom/hooks`

The header also contains:

- a visible **2.x Beta** version selector;
- a local-search control;
- theme toggle;
- a keyboard-accessible mobile menu.

The version label must say `2.x Beta`, not merely `2.x`, so beta status is visible on every documentation page. Header links must remain usable at mobile widths without relying on hover.

## Version selector contract

The selector is designed as a stable extension point, not a one-off link:

| Selector entry | Status | Destination in this milestone |
| --- | --- | --- |
| `2.x Beta` | Current | `/docs/2.x/` |
| `1.x` | Historical | `/docs/2.x/upgrade#version-1` until a verified historical manual URL is selected |

Future versions should be added as sibling content trees (`docs/3.x/`, etc.) and sibling sidebar configurations. They must not require renaming or moving the current `docs/2.x/` source tree.

The 1.x entry is deliberately lightweight. It may later point to verified historical package documentation, but this milestone does not recreate the entire v1 manual or invent an external historical URL.

## Sidebar contract

The `/docs/2.x/` sidebar uses these groups and order:

### Overview

1. Introduction
2. Installation
3. Concepts

### Hook types

1. Actions
2. Filters
3. Collectors

### Collector results

1. Processors
2. Renderers

### Integration

1. Laravel

### Migration and reference

1. Upgrade from 1.x
2. API reference

Every sidebar item must map to one route in the canonical route map. No page may be linked only from a sidebar; important pages also need contextual links from the homepage or adjacent pages.

## Page-level metadata and edit links

Every documentation page must define or receive:

- a useful title containing the page subject and `Hooks` where appropriate;
- a concise description matching the page's actual content;
- a canonical URL under `https://hooks.momagdi.com`;
- Open Graph title, description, URL, and site name metadata;
- an “Edit this page on GitHub” link targeting the corresponding path in `magdicom/hooks-docs`;
- semantic heading hierarchy beginning with one page-level `h1`.

The homepage has separate metadata and does not show an edit link unless the implementation makes the landing source intentionally editable. The `/docs` redirect page is not indexed as a duplicate content page; `/docs/2.x/` is canonical.

## Cross-linking rules

- Use root-relative internal links with clean paths, for example `/docs/2.x/actions`.
- Link the words **Actions**, **Filters**, and **Collectors** to their canonical pages on first substantial mention.
- Link installation instructions from the homepage, introduction, and Laravel page.
- Link comparison guidance from the homepage and concepts page.
- Link processor/renderer details from collectors, upgrade, and API pages.
- Link Laravel-specific access paths only to `/docs/2.x/laravel`; core pages must not imply Laravel container behavior.
- Link migration guidance from the homepage, introduction, version selector, and API page.
- Use external links for the core GitHub repository, Laravel wrapper repository, both Packagist packages, and current GitHub releases.
- Never use a link to the future production domain as evidence that the site is already live.

## Route and navigation invariants

These are acceptance criteria for the scaffold and validation tasks:

- `/` loads the landing page.
- `/docs` reaches `/docs/2.x/` and does not expose duplicate introduction content.
- `/docs/2.x/` and every leaf route resolve without `.html` or `.md`.
- Every route in the canonical map appears exactly once in the 2.x sidebar, except `/docs` which is a redirect-only route.
- Every sidebar and header link has a matching source page or an explicitly approved external destination.
- The version selector identifies `2.x Beta` on every versioned page.
- A future `3.x` tree can be added without changing existing 2.x URLs.
- Mobile navigation exposes the same destinations as desktop navigation and is keyboard operable.
- Search indexes the versioned Markdown pages and does not produce duplicate `/docs` results.
- Edit links point to this repository, not either package repository.

## Implementation handoff

The Astro/Starlight configuration should implement this contract with:

- Starlight’s sidebar configuration for the 2.x tree;
- a generated or static redirect page at `/docs`;
- a custom header component that keeps `2.x Beta` visible;
- Starlight’s `editLink.baseUrl` scoped to `src/content/docs/`;
- Pagefind local search;
- a future-version configuration shape that can add sibling sidebars without rewriting current routes;
- Astro static output in `dist/`.
