---
title: API reference
description: Signatures and return values for the Hooks 2.x public API.
---

# API reference

Use this page when you need the exact public methods behind [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), and [collectors](/docs/2.x/collectors). It explains how to register, inspect, order, and remove callbacks, with signatures and return values in one place.

The signatures and edge cases here match `magdicom/hooks` `v2.0.0-beta.1`. Start with the guide for your hook type, then use this page when you need a complete method summary.

## Registering listeners

`Hooks` has one registration method for each hook type:

```php
addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
```

Registrations belong to the `Hooks` instance that created them. The default priority is `10`. Lower numbers run first, and equal priorities retain registration order.

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('profile.updated', static function (int $profileId): void {
    // Runs first.
}, priority: 5);

$hooks->addAction('profile.updated', static function (int $profileId): void {
    // Runs second.
});

$hooks->doAction('profile.updated', 42);
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
$handle = $hooks->addFilter('email.subject', static fn (string $value): string => strtoupper($value));

$handle->remove(); // true
$handle->remove(); // false
```

This matters when you register equivalent or duplicate callbacks. A handle belongs to the particular `Hooks` object that returned it. `belongsTo($hooks)` checks that exact ownership rather than comparing configuration.

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

`has()` checks whether any action, filter, or collector exists at a hook point. The type-specific methods check one type. Omit the callback to ask whether anything of that type is registered; provide it to include callback and priority matching:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$callback = static fn (string $value): string => trim($value);

$hooks->addFilter('email.subject', $callback, priority: 20);

$hasAny = $hooks->has('email.subject');
$hasFilter = $hooks->hasFilter('email.subject');
$hasExactPriority = $hooks->hasFilter('email.subject', $callback, priority: 20);
$hasWrongPriority = $hooks->hasFilter('email.subject', $callback, priority: 10);
```

`count()` counts registrations across all hook types, optionally limited to one hook point. `listeners()` returns handles for every type at the point. `actions()`, `filters()`, and `collectors()` return handles for the corresponding exact type, all in dispatch order.

## Type-aware removal

Removal by callback is type-aware:

```php
removeAction(string $hookPoint, array|callable $callback, int $priority = 10): bool
removeFilter(string $hookPoint, array|callable $callback, int $priority = 10): bool
removeCollector(string $hookPoint, array|callable $callback, int $priority = 10): bool
```

These methods remove the first matching callback of the requested type and priority. They do not accept a `RegistrationHandle`; call the handle's `remove()` method for exact registration-id removal. A callback registered as an action is not removed by `removeFilter()`.

Bulk methods remove registrations and return the number removed:

```php
removeAll(?string $hookPoint = null): int
removeAllActions(?string $hookPoint = null): int
removeAllFilters(?string $hookPoint = null): int
removeAllCollectors(?string $hookPoint = null): int
```

Passing a hook point limits removal to that point. Omitting it removes the relevant type across the registry; `removeAll()` removes all types.

## Priorities and snapshots

Hooks sorts listeners by ascending priority and then by registration id. Equal-priority callbacks therefore run in a predictable order.

Before dispatch, Hooks creates a sorted listener snapshot. Adding or removing registrations while a callback runs does not alter the list selected for that invocation. The change appears on a later invocation:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$late = static function (): void {
    // Added during dispatch, so it does not run in that same snapshot.
};

$hooks->addAction('order.cancelled', static function () use ($hooks, $late): void {
    $hooks->addAction('order.cancelled', $late);
});

$hooks->doAction('order.cancelled');
$hooks->doAction('order.cancelled'); // The new listener is available here.
```

Nested `collect()`, `process()`, and `render()` calls use their own snapshots. Exceptions reach the caller, and a later invocation can still use the registry.

For value transformation and raw result behavior, see the [hook type pages](/docs/2.x/concepts). Processor, renderer, resolver, and callback behavior is covered in the [advanced core reference](/docs/2.x/processors).

## Complete core method summary

The following summary covers the public methods on `Magdicom\Hooks`. Private helpers are left out.

### Construction and dispatch

| Method | Purpose and return value | Applies to / relevant exceptions |
| --- | --- | --- |
| `__construct(?Resolver $resolver = null)` | Creates a Hooks registry. Returns the new object; uses `NativeResolver` when no resolver is supplied. | Core; resolver construction errors can bubble from a custom resolver |
| `doAction(string $hookPoint, mixed ...$arguments): void` | Invokes the action snapshot with the arguments exactly as passed. Callback returns are ignored. | Actions; listener and callback exceptions bubble |
| `applyFilters(string $hookPoint, mixed $value, mixed ...$arguments): mixed` | Passes the current value first, then explicit arguments, through each filter and returns the final value. | Filters; listener and callback exceptions bubble |
| `collect(string $hookPoint, mixed ...$arguments): array` | Returns one raw result per collector listener in dispatch order. | Collectors; listener and callback exceptions bubble |

Registration methods return a `RegistrationHandle` and default to priority `10`:

```php
addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
```

They apply respectively to actions, filters, and collectors. A callback may be a callable, object method array, or class-name method array; invalid callback resolution or callback exceptions surface when the callback is prepared or invoked.

### Processors and renderers

| Method | Purpose and return value | Applies to / relevant exceptions |
| --- | --- | --- |
| `setProcessor(string $hookPoint, ResultProcessor\|callable\|string $processor): self` | Stores or replaces the processor slot and returns the same Hooks object for deliberate method chaining. | Collectors; class-name processors must implement `ResultProcessor`, otherwise `InvalidProcessorException` is raised when invoked |
| `hasProcessor(string $hookPoint): bool` | Reports whether the endpoint has a configured processing slot. | Collectors |
| `processor(string $hookPoint): ResultProcessor\|callable\|string\|null` | Returns the stored processor reference unchanged, or `null`. | Collectors |
| `clearProcessor(string $hookPoint): bool` | Removes the processing slot and reports whether one existed. | Collectors |
| `setRenderer(string $hookPoint, Renderer\|callable\|string $renderer): self` | Stores or replaces the same slot used by `setProcessor()` and returns the Hooks object. | Collectors; invalid renderer configuration is reported by `render()` |
| `process(string $hookPoint, mixed ...$arguments): mixed` | Collects raw results, creates `ProcessingContext`, invokes the configured processor, and returns its output unchanged. | Collectors; `MissingProcessorException` when unset, `InvalidProcessorException` for an invalid class reference |
| `render(string $hookPoint, mixed ...$arguments): string` | Collects raw results, invokes the configured renderer, and requires string output. | Collectors; `MissingRendererException` when unset and `InvalidRendererException` for invalid class or non-string callable output |

`setProcessor()` and `setRenderer()` share one collector endpoint slot. `collect()` always bypasses that slot. See [processors](/docs/2.x/processors) and [renderers](/docs/2.x/renderers) for built-in behavior.

### Inspection and removal

| Method | Purpose and return value | Applies to |
| --- | --- | --- |
| `has(string $hookPoint): bool` | Reports whether any hook type has a registration at the point. | All hook types |
| `hasAction(string $hookPoint, array\|callable\|null $callback = null, int $priority = 10): bool` | Checks for any action, or a matching callback at the requested priority. | Actions |
| `hasFilter(string $hookPoint, array\|callable\|null $callback = null, int $priority = 10): bool` | Checks for any filter, or a matching callback at the requested priority. | Filters |
| `hasCollector(string $hookPoint, array\|callable\|null $callback = null, int $priority = 10): bool` | Checks for any collector, or a matching callback at the requested priority. | Collectors |
| `count(?string $hookPoint = null): int` | Counts registrations across all types, optionally restricted to one point. | All hook types |
| `listeners(string $hookPoint): array` | Returns all registration handles at the point, sorted by priority and registration id. | All hook types |
| `actions(string $hookPoint): array` | Returns action handles in dispatch order. | Actions |
| `filters(string $hookPoint): array` | Returns filter handles in dispatch order. | Filters |
| `collectors(string $hookPoint): array` | Returns collector handles in dispatch order. | Collectors |
| `removeAction(string $hookPoint, array\|callable $callback, int $priority = 10): bool` | Removes the first matching action callback and priority. | Actions |
| `removeFilter(string $hookPoint, array\|callable $callback, int $priority = 10): bool` | Removes the first matching filter callback and priority. | Filters |
| `removeCollector(string $hookPoint, array\|callable $callback, int $priority = 10): bool` | Removes the first matching collector callback and priority. | Collectors |
| `removeAll(?string $hookPoint = null): int` | Removes all hook types at one point, or the entire registry when omitted; returns the number removed. | All hook types |
| `removeAllActions(?string $hookPoint = null): int` | Removes action registrations and returns the number removed. | Actions |
| `removeAllFilters(?string $hookPoint = null): int` | Removes filter registrations and returns the number removed. | Filters |
| `removeAllCollectors(?string $hookPoint = null): int` | Removes collector registrations and returns the number removed. | Collectors |

### Operational methods

These public methods provide diagnostics rather than dispatch:

| Method | Purpose and return value | Applies to |
| --- | --- | --- |
| `debug(callable|null $callback): self` | Enables debug logging when a callable is supplied, disables it for `null`, and returns the same Hooks object. | Core registry diagnostics |
| `setSourceFile(?string $path = null): self` | Stores an optional source-file label and returns the same Hooks object. | Core registry diagnostics |
| `getSourceFile(): string` | Returns the configured source-file label, or `'Unknown'` when none was set. | Core registry diagnostics |

These methods do not change action, filter, or collector behavior. The debug callback and source label are metadata, not a replacement for explicit arguments or application logging.

## Supporting public contracts

Processors, renderers, and class callbacks use these core contracts:

```php
interface Resolver
{
    public function resolve(string $className): object;
}

interface ResultProcessor
{
    public function process(array $results, ProcessingContext $context): mixed;
}

interface Renderer extends ResultProcessor
{
    public function process(array $results, ProcessingContext $context): string;
}
```

`ProcessingContext` exposes:

```php
__construct(string $hookPoint, mixed ...$arguments)
hookPoint(): string
arguments(): array
```

The `ProcessingContext` constructor stores the original invocation arguments as a list. `RegistrationHandle` exposes the lifecycle methods above. `NativeResolver::resolve(string $className): object` creates a class with `new $className()`; the Laravel wrapper replaces this with container-backed resolution.

`RegistrationHandle::__construct(...)` is public in the released class but is an implementation-created value: normal callers should obtain handles from `addAction()`, `addFilter()`, or `addCollector()` rather than constructing one. Its internal remover closure preserves exact registration-id behavior.

## Laravel surface

The Laravel wrapper does not add a second dispatch API. Its access points resolve the same core object:

- `hooks(): Magdicom\Hooks` returns the shared singleton and accepts no arguments;
- `app(Magdicom\Hooks::class)` resolves the typed singleton;
- `app('hooks')` resolves its alias;
- `Magdicom\LaravelHooks\Facades\Hooks` forwards static calls to the same root.

Use the [Laravel integration guide](/docs/2.x/laravel) for container lifecycle, auto-discovery, resolver timing, and long-running process guidance.
