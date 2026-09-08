---
title: Concepts
description: Choose the right Hooks type for side effects, value changes, or collected results.
---

# Concepts

# Choose a hook type

Start with what the caller needs back. Actions do something, filters return one changed value, and collectors return every callback's contribution. All three are synchronous and ordered.

| Type | Listener input | Listener return | Empty-listener behavior | Use it for |
| --- | --- | --- | --- | --- |
| [Action](/docs/2.x/actions) | The explicit variadic invocation arguments | Ignored | `doAction()` returns `void` | Ordered side effects such as notifications or audit writes |
| [Filter](/docs/2.x/filters) | The current value first, then explicit variadic arguments | Becomes the next current value | `applyFilters()` returns the original value | Sequential value transformation |
| [Collector](/docs/2.x/collectors) | The explicit variadic invocation arguments | One raw result per listener | `collect()` returns `[]` | Independent contributions that the caller can inspect or process |

All three types support priorities. The default is `10`; lower numbers run first, and equal priorities keep registration order. Each registration returns a handle, so you can remove that exact callback later.

## Actions: do something

An action callback receives the arguments passed to `doAction()`. Its return value is intentionally ignored:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Notify a synchronous integration.
});

$hooks->doAction('invoice.paid', 42);
```

With no listeners, `doAction()` simply returns `void`. Use an action when the caller needs to trigger work, not when it needs a transformed value or a list of results.

## Filters: change one value

The current value is always the first callback argument. Any additional arguments passed to `applyFilters()` follow it. Each callback's return value becomes the value given to the next callback:

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

When no filter is registered, `applyFilters()` returns the value it was given. Priorities determine order; equal-priority filters run in registration order.

## Collectors: gather contributions

A collector invokes each listener with the explicit arguments and returns one raw array entry per listener:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addCollector('dashboard.cards', static fn (string $userId): array => ['owner' => $userId]);
$hooks->addCollector('dashboard.cards', static fn (string $userId): array => ['count' => 3]);

$cards = $hooks->collect('dashboard.cards', 'user-42');
// [['owner' => 'user-42'], ['count' => 3]]
```

`collect()` leaves the raw results alone. It does not flatten or merge them, and returns `[]` when there are no listeners. If you need to reduce or format those results, use `process()` or `render()`; see [processors](/docs/2.x/processors) and [renderers](/docs/2.x/renderers).

## A quick decision guide

- Need to tell listeners that something happened and ignore their results? Use an action.
- Need one value refined by a sequence of listeners? Use a filter.
- Need every listener's contribution separately? Use a collector.
- Need domain events, queueing, broadcasting, or Laravel workflow behavior? Use Laravel Events.
- Need a fixed middleware-style chain? Use Laravel Pipeline.

The full dispatch, priority, mutation, registration, and removal semantics are documented on the individual hook-type pages.
