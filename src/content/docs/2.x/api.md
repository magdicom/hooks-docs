---
title: API reference
description: Human-written Hooks 2.x public API reference.
---

# API reference

This page explains the released listener lifecycle behind [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), and [collectors](/docs/2.x/collectors). It focuses on registration, inspection, ordering, and removal rather than reproducing a reflection dump.

The behavior documented here is derived from the released `magdicom/hooks` `v2.0.0-beta.1` implementation and focused tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#inspection-handles-and-removal).

## Registering listeners

`Hooks` provides one registration method for each hook type:

```php
addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
```

All registrations belong to the `Hooks` instance that created them. The default priority is `10`. Lower numeric priorities run first, and equal priorities retain registration order.

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('profile.saved', static function (int $profileId): void {
    // Runs first.
}, priority: 5);

$hooks->addAction('profile.saved', static function (int $profileId): void {
    // Runs second.
});

$hooks->doAction('profile.saved', 42);
```

The returned `RegistrationHandle` identifies that exact registration, including its hook point, type, priority, and registration id.

## Registration handles

Each handle exposes:

```php
id(): int
hookPoint(): string
type(): string
priority(): int
remove(): bool
belongsTo(Hooks $hooks): bool
```

`remove()` is registration-id based. It removes the exact registration and returns `true`; calling it after that registration has already been removed returns `false`:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$handle = $hooks->addFilter('title', static fn (string $value): string => strtoupper($value));

$handle->remove(); // true
$handle->remove(); // false
```

This exactness matters when equivalent callbacks or duplicate callbacks are registered. A handle identifies the registration returned by that particular `Hooks` object. `belongsTo($hooks)` reports exact object ownership, not merely equivalent configuration.

## Inspecting registrations

The released inspection methods are:

```php
has(string $hookPoint): bool
hasAction(string $hookPoint, array|callable|null $callback = null, int $priority = 10): bool
hasFilter(string $hookPoint, array|callable|null $callback = null, int $priority = 10): bool
hasCollector(string $hookPoint, array|callable|null $callback = null, int $priority = 10): bool
count(?string $hookPoint = null): int
listeners(string $hookPoint): array
actions(string $hookPoint): array
filters(string $hookPoint): array
collectors(string $hookPoint): array
```

`has()` checks whether any action, filter, or collector registration exists at a hook point. The type-specific methods restrict the check to one type. Omitting the callback checks for any registration of that type; providing a callback also matches its priority:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$callback = static fn (string $value): string => trim($value);

$hooks->addFilter('slug', $callback, priority: 20);

$hasAny = $hooks->has('slug');
$hasFilter = $hooks->hasFilter('slug');
$hasExactPriority = $hooks->hasFilter('slug', $callback, priority: 20);
$hasWrongPriority = $hooks->hasFilter('slug', $callback, priority: 10);
```

`count()` counts registrations across all hook types, optionally limited to one hook point. `listeners()` returns handles for every type at the point. `actions()`, `filters()`, and `collectors()` return handles for the corresponding exact type, all in dispatch order.

## Type-aware removal

Callback-based removal is deliberately type-aware:

```php
removeAction(string $hookPoint, array|callable $callback, int $priority = 10): bool
removeFilter(string $hookPoint, array|callable $callback, int $priority = 10): bool
removeCollector(string $hookPoint, array|callable $callback, int $priority = 10): bool
```

These methods remove the first matching callback of the requested type and priority. They do not accept a `RegistrationHandle`; call the handle's `remove()` method for exact registration-id removal. Callback matching compares callback identity and priority, so a callback registered as an action is not removed by `removeFilter()`.

Bulk methods remove registrations and return the number removed:

```php
removeAll(?string $hookPoint = null): int
removeAllActions(?string $hookPoint = null): int
removeAllFilters(?string $hookPoint = null): int
removeAllCollectors(?string $hookPoint = null): int
```

Passing a hook point limits removal to that point. Omitting it removes the relevant type across the registry; `removeAll()` removes all types.

## Priorities and snapshots

The registry sorts listeners by ascending priority and then by monotonic registration id. This gives deterministic equal-priority ordering without relying on callback identity.

Before dispatch, Hooks creates a sorted listener snapshot. Adding or removing registrations while a callback is running does not alter the listener list already selected for that invocation. The change is visible to a later invocation:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$late = static function (): void {
    // Added during dispatch, so it does not run in that same snapshot.
};

$hooks->addAction('sync', static function () use ($hooks, $late): void {
    $hooks->addAction('sync', $late);
});

$hooks->doAction('sync');
$hooks->doAction('sync'); // The new listener is available here.
```

Nested `collect()`, `process()`, and `render()` calls use their own snapshots and remain isolated from the outer dispatch snapshot. Exceptions bubble to the caller; a later invocation can still use the registry.

For value transformation and raw result behavior, see the [hook type pages](/docs/2.x/concepts). Processor, renderer, resolver, and callback behavior is covered in the [advanced core reference](/docs/2.x/processors).
