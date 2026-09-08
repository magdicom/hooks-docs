---
title: Collectors
description: Independent callback result collection.
---

# Collectors

Collectors invoke independent callbacks and return one raw result per listener. Register with `addCollector()` and call `collect()` with the explicit invocation arguments.

The behavior on this page is derived from the released implementation and tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#core-public-api-truth-set).

## Register and collect

The core signatures are:

```php
addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
collect(string $hookPoint, mixed ...$arguments): array
```

Every listener receives the same explicit arguments, and its return value occupies one entry in the result array:

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

`collect()` preserves dispatch order. It does not automatically flatten nested arrays, merge associative keys, discard duplicates, or otherwise interpret callback results. The caller chooses what the raw results mean.

## Priority and empty results

The default priority is `10`. Lower priorities run first, and equal priorities preserve registration order. A collector with no listeners returns `[]`:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$results = $hooks->collect('sidebar.items');
// []
```

Arguments are explicit. `collect('sidebar.items', $userId)` passes `$userId` to every registered listener; the Hooks object does not use a global parameter array or hidden invocation state.

## Remove a collector

As with the other hook types, `addCollector()` returns an exact registration handle:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$handle = $hooks->addCollector('sidebar.items', static fn (): string => 'Help');
$handle->remove();

$items = $hooks->collect('sidebar.items');
// []
```

`removeCollector()` removes the first matching callback at the requested priority. `removeAllCollectors(?string $hookPoint = null)` removes collector registrations in bulk.

## `collect()`, `process()`, and `render()`

These methods have distinct responsibilities:

- **`collect()`** returns the raw result array and does not require a processor or renderer.
- **`process()`** collects results and passes them with a `ProcessingContext` to the configured processor. It throws `MissingProcessorException` when no processor is configured.
- **`render()`** collects results and passes them to the configured renderer, requiring a string result. Missing or invalid renderer configuration raises the released renderer exceptions.

Processors and renderers apply to collectors only—not actions or filters. See [processors](/docs/2.x/processors) and [renderers](/docs/2.x/renderers) for the released built-ins and their failure behavior.
