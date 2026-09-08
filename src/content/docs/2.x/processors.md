---
title: Processors
description: Process collected results with explicit collector processors.
---

# Processors

Processors reduce a collector's raw result list to another value. They are invoked by `process()` and receive both the raw results and a `ProcessingContext` containing the hook point and the original invocation arguments.

The behavior on this page is derived from the released `magdicom/hooks` `v2.0.0-beta.1` implementation and tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#processing-and-rendering).

Processors apply to collectors only. Actions return `void`, and filters already return their transformed value; neither type has a processor slot.

## Configure and process

The relevant methods are:

```php
setProcessor(string $hookPoint, ResultProcessor|callable|string $processor): self
hasProcessor(string $hookPoint): bool
processor(string $hookPoint): ResultProcessor|callable|string|null
clearProcessor(string $hookPoint): bool
process(string $hookPoint, mixed ...$arguments): mixed
```

`process()` first collects the listener results, then invokes the configured processor. It returns the processor output unchanged:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\FirstProcessor;

$hooks = new Hooks();
$hooks->addCollector('menu.title', static fn (): string => 'Account');
$hooks->addCollector('menu.title', static fn (): string => 'Settings');
$hooks->setProcessor('menu.title', new FirstProcessor());

$title = $hooks->process('menu.title');
// 'Account'
```

Calling `collect('menu.title')` on the same endpoint would still return `['Account', 'Settings']`; `collect()` bypasses the configured processor and renderer slots.

When no processor is configured, `process()` throws the released `MissingProcessorException`. `clearProcessor()` removes the configured slot and returns whether a slot existed. `setProcessor()` replaces the current slot for that collector endpoint.

## Released built-in processors

All built-ins live under the `Magdicom\Processor` namespace and implement `ResultProcessor`. They receive `(array $results, ProcessingContext $context)`.

| Class | Input expectation | Return and empty-result behavior | Failure behavior |
| --- | --- | --- | --- |
| `FirstProcessor` | Any result list | First entry, or `null` | No additional validation failure |
| `LastProcessor` | Any result list | Last entry, or `null` | No additional validation failure |
| `FirstNonNullProcessor` | Any result list | First non-`null` entry, or `null` | No additional validation failure |
| `BooleanAndProcessor` | Every entry must be `bool` | `true` for empty results; short-circuits to `false` | `UnexpectedValueException` for a non-boolean entry |
| `BooleanOrProcessor` | Every entry must be `bool` | `false` for empty results; short-circuits to `true` | `UnexpectedValueException` for a non-boolean entry |
| `MergeProcessor` | Every entry must be an array | `[]` for empty results; uses `array_merge()` semantics | `UnexpectedValueException` for a non-array entry |
| `FlattenProcessor` | Every top-level entry must be an array | `[]` for empty results; flattens values by configured depth and discards keys | `InvalidArgumentException` for depth below `-1`; `UnexpectedValueException` for a non-array entry |

`FlattenProcessor` defaults to depth `-1` for unlimited flattening. Depth `0` keeps nested arrays at the current level; any non-negative depth is reduced as nested arrays are traversed.

## Built-in usage

The processor receives the collector's raw results, not individual callbacks:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\BooleanAndProcessor;

$hooks = new Hooks();
$hooks->addCollector('feature.enabled', static fn (): bool => true);
$hooks->addCollector('feature.enabled', static fn (): bool => false);
$hooks->setProcessor('feature.enabled', new BooleanAndProcessor());

$enabled = $hooks->process('feature.enabled');
// false
```

For `MergeProcessor` and `FlattenProcessor`, every collector must return an array. For boolean processors, a value of the wrong type throws instead of being coerced. These checks are part of the released implementation; callers should make the collector contract explicit.

## Processor callbacks and class names

`setProcessor()` also accepts a callable or a class name. A callable receives the raw result array and `ProcessingContext` and may return any value:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\ProcessingContext;

$hooks = new Hooks();
$hooks->addCollector('scores', static fn (): int => 8);
$hooks->addCollector('scores', static fn (): int => 13);
$hooks->setProcessor('scores', static function (array $results, ProcessingContext $context): int {
    return array_sum($results);
});

$total = $hooks->process('scores');
// 21
```

A class-name processor is resolved and must implement `ResultProcessor`; otherwise the released `InvalidProcessorException` is thrown. The class name can be supplied with `SomeProcessor::class` and is resolved when the processor is invoked.

See [renderers](/docs/2.x/renderers) for string-specific collector output, and [collectors](/docs/2.x/collectors) for raw collection semantics.

## Resolver and callback behavior

The core resolver contract is:

```php
interface Resolver
{
    public function resolve(string $className): object;
}
```

`new Hooks()` uses `NativeResolver` automatically. Its released behavior is to instantiate a resolved class with `new $className()`. A custom resolver can be passed to `Hooks`:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Resolver;

final class ApplicationResolver implements Resolver
{
    public function resolve(string $className): object
    {
        return new $className();
    }
}

$hooks = new Hooks(new ApplicationResolver());
```

Callbacks support closures and normal callables, object method arrays, and class-name method arrays. A static callable is used directly when PHP considers it callable. A non-static class method array is resolved through the configured resolver and then invoked on the resolved object:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

final class AuditListener
{
    public function record(string $event): void
    {
        // Record the event.
    }
}

$hooks = new Hooks();
$hooks->addAction('audit', [AuditListener::class, 'record']);
$hooks->doAction('audit', 'profile.updated');
```

Resolver and callback exceptions bubble to the caller. The resolver is not a service container in the core package; Laravel applications get container-backed resolution from the separate Laravel wrapper.
