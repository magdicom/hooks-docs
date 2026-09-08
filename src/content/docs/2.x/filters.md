---
title: Filters
description: Sequential value transformations.
---

# Filters

Filters apply a sequence of value transformations. Register listeners with `addFilter()` and provide the starting value to `applyFilters()`.

The behavior on this page is derived from the released implementation and tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#core-public-api-truth-set).

## Register and apply

The core signatures are:

```php
addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
applyFilters(string $hookPoint, mixed $value, mixed ...$arguments): mixed
```

The current filtered value is always the first callback argument. Additional invocation arguments follow it:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addFilter('title.display', static function (string $title, string $locale): string {
    return $locale === 'en' ? $title : '[' . $locale . '] ' . $title;
});

$displayTitle = $hooks->applyFilters('title.display', 'Release notes', 'en');
```

The first callback receives `'Release notes'` as `$title` and `'en'` as `$locale`. If another listener follows it, that listener receives the first listener's returned string as its `$title`.

## Sequential transformation

Each callback return value becomes the current value for the next callback. A filter can therefore be composed from small transformations:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addFilter('slug', static fn (string $value): string => trim($value));
$hooks->addFilter('slug', static fn (string $value): string => strtolower($value), priority: 20);

$slug = $hooks->applyFilters('slug', '  Hooks Docs  ');
// 'hooks docs'
```

Lower priorities run first. Equal-priority filters retain registration order. The default priority is `10`; specify another priority only when the ordering is part of the extension point's contract.

## Empty filters

When no filter listener exists, `applyFilters()` returns the original `$value` unchanged. Additional arguments are not transformed or consumed by the Hooks object; they are only passed to registered callbacks.

## Remove a filter

`addFilter()` returns a `RegistrationHandle` for exact registration removal:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$handle = $hooks->addFilter('title.display', static fn (string $title): string => strtoupper($title));
$handle->remove();

$title = $hooks->applyFilters('title.display', 'Release notes');
// 'Release notes'
```

The handle's `remove()` method returns `true` once and `false` after the registration has already been removed. Callback-based `removeFilter()` matches the requested callback and priority; `removeAllFilters(?string $hookPoint = null)` removes all filter registrations for one point or, when omitted, all filter registrations.

Use [actions](/docs/2.x/actions) when return values are irrelevant, and [collectors](/docs/2.x/collectors) when each listener should keep an independent result.
