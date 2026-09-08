---
title: Processors
description: Turn collector results into the value your application needs.
---

# Processors

Processors turn a collector's raw result list into the value your application needs. Call `process()` after configuring a processor; it receives the results and a `ProcessingContext` with the hook point and original arguments.

Use a processor when callbacks contribute structured or boolean values that need a clear reduction step.

Processors belong to collectors only. Actions return `void`, and filters already return their transformed value, so neither has a processor slot.

## Configure and process

The relevant methods are:

```php
setProcessor(string $hookPoint, ResultProcessor|callable|string $processor): self
hasProcessor(string $hookPoint): bool
processor(string $hookPoint): ResultProcessor|callable|string|null
clearProcessor(string $hookPoint): bool
process(string $hookPoint, mixed ...$arguments): mixed
```

`process()` collects listener results, invokes the configured processor, and returns its output unchanged:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\FirstProcessor;

$hooks = new Hooks();
$hooks->addCollector('navigation.items', static fn (): string => 'Account');
$hooks->addCollector('navigation.items', static fn (): string => 'Settings');
$hooks->setProcessor('navigation.items', new FirstProcessor());

$title = $hooks->process('navigation.items');
// 'Account'
```

Calling `collect('navigation.items')` on the same endpoint still returns `['Account', 'Settings']`; `collect()` bypasses processor and renderer configuration.

Without a configured processor, `process()` throws `MissingProcessorException`. `clearProcessor()` removes the slot and reports whether one existed. `setProcessor()` replaces the processor for that collector point.

## Released built-in processors

The built-ins live under `Magdicom\Processor` and implement `ResultProcessor`. Each receives `(array $results, ProcessingContext $context)`.

| Class | Input expectation | Return and empty-result behavior | Failure behavior |
| --- | --- | --- | --- |
| `FirstProcessor` | Any result list | First entry, or `null` | No additional validation failure |
| `LastProcessor` | Any result list | Last entry, or `null` | No additional validation failure |
| `FirstNonNullProcessor` | Any result list | First non-`null` entry, or `null` | No additional validation failure |
| `BooleanAndProcessor` | Every entry must be `bool` | `true` for empty results; short-circuits to `false` | `UnexpectedValueException` for a non-boolean entry |
| `BooleanOrProcessor` | Every entry must be `bool` | `false` for empty results; short-circuits to `true` | `UnexpectedValueException` for a non-boolean entry |
| `MergeProcessor` | Every entry must be an array | `[]` for empty results; uses `array_merge()` semantics | `UnexpectedValueException` for a non-array entry |
| `FlattenProcessor` | Every top-level entry must be an array | `[]` for empty results; flattens values by configured depth and discards keys | `InvalidArgumentException` for depth below `-1`; `UnexpectedValueException` for a non-array entry |

`FlattenProcessor` defaults to depth `-1`, which means unlimited flattening. Depth `0` keeps nested arrays at the current level; non-negative depths control how far nested arrays are traversed.

## Built-in usage

The processor sees the collector's raw results, not callbacks one at a time:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\BooleanAndProcessor;

$hooks = new Hooks();
$hooks->addCollector('checkout.allowed', static fn (): bool => true);
$hooks->addCollector('checkout.allowed', static fn (): bool => false);
$hooks->setProcessor('checkout.allowed', new BooleanAndProcessor());

$enabled = $hooks->process('checkout.allowed');
// false
```

For `MergeProcessor` and `FlattenProcessor`, every collector must return an array. For boolean processors, a value of the wrong type throws instead of being coerced. Make that collector contract clear in your application.

## Processor callbacks and class names

`setProcessor()` also accepts a callable or a class name. A callable receives the raw result array and `ProcessingContext` and may return any value:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\ProcessingContext;

$hooks = new Hooks();
$hooks->addCollector('report.scores', static fn (): int => 8);
$hooks->addCollector('report.scores', static fn (): int => 13);
$hooks->setProcessor('report.scores', static function (array $results, ProcessingContext $context): int {
    return array_sum($results);
});

$total = $hooks->process('report.scores');
// 21
```

A class-name processor is resolved when it is invoked and must implement `ResultProcessor`; otherwise `InvalidProcessorException` is thrown. Pass a class name such as `SomeProcessor::class` when you want the resolver to create it.

See [renderers](/docs/2.x/renderers) for string-specific collector output, and [collectors](/docs/2.x/collectors) for raw collection semantics.

## Resolver and callback behavior

The core resolver contract is:

```php
interface Resolver
{
    public function resolve(string $className): object;
}
```

`new Hooks()` uses `NativeResolver` automatically, which creates a resolved class with `new $className()`. You can pass a custom resolver to `Hooks`:

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
$hooks->addAction('audit.recorded', [AuditListener::class, 'record']);
$hooks->doAction('audit.recorded', 'profile.updated');
```

Resolver and callback exceptions bubble to the caller. The resolver is not a service container in the core package; Laravel applications get container-backed resolution from the separate Laravel wrapper.
