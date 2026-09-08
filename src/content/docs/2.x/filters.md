---
title: Filters
description: Pass a value through an ordered sequence of transformations.
---

# Filters

Use a filter when several parts of your application may adjust the same value. Register callbacks with `addFilter()`, pass the starting value to `applyFilters()`, and use the returned value.

A useful example is a display title that different integrations can localize or annotate.

## Register and apply

The core signatures are:

```php
addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
applyFilters(string $hookPoint, mixed $value, mixed ...$arguments): mixed
```

The current value is always the first callback argument. Any additional arguments follow it:

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

The first callback receives `'Release notes'` as `$title` and `'en'` as `$locale`. A later callback receives the first callback's returned string as its new `$title`.

## Sequential transformation

Each callback returns the value passed to the next callback. That lets you keep each transformation small:

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

Lower priorities run first. Equal-priority filters keep registration order. The default is `10`; choose another priority when the order is part of your hook point's contract.

## Empty filters

With no listeners, `applyFilters()` returns the original `$value`. Hooks does not transform or consume the additional arguments; it only passes them to registered callbacks.

## Remove a filter

`addFilter()` returns a `RegistrationHandle`, which is the simplest way to remove one exact registration:

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

The handle's `remove()` method returns `true` once and `false` after removal. Callback-based `removeFilter()` matches the callback and priority. `removeAllFilters(?string $hookPoint = null)` removes filters for one point or, when omitted, all filter registrations.

Use [actions](/docs/2.x/actions) when return values are irrelevant, and [collectors](/docs/2.x/collectors) when each listener should keep an independent result.
