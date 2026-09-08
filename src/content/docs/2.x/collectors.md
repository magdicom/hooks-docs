---
title: Collectors
description: Gather one independent result from each callback.
---

# Collectors

Use a collector when several callbacks should contribute independently. Register with `addCollector()` and call `collect()` with the arguments every callback needs.

For example, dashboard cards may come from several packages. Each package can return one card without knowing about the others.

## Register and collect

The core signatures are:

```php
addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
collect(string $hookPoint, mixed ...$arguments): array
```

Every listener receives the same explicit arguments, and its return value becomes one entry in the result array:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addCollector('dashboard.widgets', static fn (string $userId): array => ['owner' => $userId]);
$hooks->addCollector('dashboard.widgets', static fn (string $userId): array => ['count' => 3]);

$cards = $hooks->collect('dashboard.widgets', 'user-42');
// [['owner' => 'user-42'], ['count' => 3]]
```

`collect()` preserves dispatch order and leaves interpretation to you. It does not flatten nested arrays, merge associative keys, or discard duplicates.

## Priority and empty results

The default priority is `10`. Lower priorities run first, and equal priorities preserve registration order. With no listeners, a collector returns `[]`:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$results = $hooks->collect('navigation.items');
// []
```

Arguments are explicit. `collect('navigation.items', $userId)` passes `$userId` to every listener; Hooks does not keep a global parameter array or hidden invocation state.

## Remove a collector

As with the other hook types, `addCollector()` returns a handle for that exact registration:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$handle = $hooks->addCollector('navigation.items', static fn (): string => 'Help');
$handle->remove();

$items = $hooks->collect('navigation.items');
// []
```

`removeCollector()` removes the first matching callback at the requested priority. `removeAllCollectors(?string $hookPoint = null)` removes collector registrations in bulk.

## `collect()`, `process()`, and `render()`

These methods have different jobs:

- **`collect()`** returns the raw result array. It does not need a processor or renderer.
- **`process()`** collects results and passes them with a `ProcessingContext` to the configured processor. It throws `MissingProcessorException` when no processor is configured.
- **`render()`** collects results and passes them to the configured renderer, which must return a string. Missing or invalid renderer configuration raises the documented renderer exceptions.

Processors and renderers apply to collectors only—not actions or filters. See [processors](/docs/2.x/processors) and [renderers](/docs/2.x/renderers) for the released built-ins and their failure behavior.
