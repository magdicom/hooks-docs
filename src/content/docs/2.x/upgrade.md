---
title: Upgrade from 1.x
description: Migrate from Hooks version 1 to 2.x Beta.
---

# Upgrade from 1.x

Hooks 2.x replaces the version-1 registration and output model with explicit actions, filters, collectors, processors, and renderers. This guide maps the released migration guidance to the current beta APIs; it does not recreate the version-1 manual.

The mappings below are based on the core and Laravel wrapper upgrade guides for the released packages and the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#migration-truth-set). The 2.x packages are beta releases, so test the migration against your application's supported package versions.

## Before you migrate

Install the beta packages explicitly at the application boundary:

```bash
composer require magdicom/hooks:"^2.0@beta"
```

For Laravel, install both packages:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

Do not change global Composer `minimum-stability` settings. See [installation](/docs/2.x/installation) for the released PHP and Laravel requirements.

## Choose the new hook type

Version 1's registration method could be used for different kinds of behavior. In 2.x, select the method that describes the result your caller needs:

| Version 1 intent | Version 2 registration and invocation | Result |
| --- | --- | --- |
| `register()` for side effects | `addAction()` + `doAction()` | Synchronous `void` execution; callback returns are ignored |
| `register()` for transformations | `addFilter()` + `applyFilters()` | Sequentially transformed value |
| `register()`/`all()` for result gathering | `addCollector()` + `collect()` | One raw result per listener |

There is no single automatic replacement for every old `register()` call. Read each registration's intent and choose [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), or [collectors](/docs/2.x/collectors).

### Side effects: `register()` to actions

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Send a synchronous notification or write an audit entry.
});

$hooks->doAction('invoice.paid', 42);
```

`doAction()` returns `void`. If the old callback returned a value that callers used, it was not a side-effect-only registration and should be migrated to a filter or collector instead.

### Transformations: `register()` to filters

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addFilter('profile.label', static function (string $label): string {
    return strtoupper($label);
});

$label = $hooks->applyFilters('profile.label', 'administrator');
```

The current value is the first callback argument, and each callback's return value becomes the next value. With no listeners, `applyFilters()` returns the original value.

### Result gathering: `register()`/`all()` to collectors

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addCollector('dashboard.cards', static fn (): array => ['owner']);
$hooks->addCollector('dashboard.cards', static fn (): array => ['activity']);

$cards = $hooks->collect('dashboard.cards');
// [['owner'], ['activity']]
```

`collect()` returns one raw entry per listener. It does not reproduce implicit version-1 aggregation, flattening, or output state.

## `all()` and `toArray()` to `collect()`

The released migration mapping for result lists is:

```php
// Version 2
$results = $hooks->collect('dashboard.cards');
```

This replaces both the old `all()` result gathering and an old `all()->toArray()` conversion. If the consumer needs a merged or flattened shape, configure an explicit collector processor such as `MergeProcessor` or `FlattenProcessor`, or transform the raw array in application code. Do not assume `collect()` merges entries.

## `first()` and `last()` to processors

When the old code selected one collector result, configure the intended reduction explicitly:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\FirstProcessor;
use Magdicom\Processor\LastProcessor;

$hooks = new Hooks();
$hooks->addCollector('banner', static fn (): string => 'Primary');
$hooks->addCollector('banner', static fn (): string => 'Fallback');

$hooks->setProcessor('banner', new FirstProcessor());
$first = $hooks->process('banner');

$hooks->setProcessor('banner', new LastProcessor());
$last = $hooks->process('banner');
```

`FirstProcessor` and `LastProcessor` return `null` for an empty result list. Selection is therefore an explicit collector processing decision, not a method available on actions or filters.

## Parameters: global arrays to explicit arguments

Version 1 code that stored parameters globally should pass the required values at invocation time:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addFilter('price', static function (int $price, string $currency): int {
    return $currency === 'USD' ? $price : $price + 1;
});

$price = $hooks->applyFilters('price', 100, 'USD');
```

For a larger shared input, pass one typed context object as an explicit argument:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

final readonly class RenderContext
{
    public function __construct(
        public string $locale,
        public string $userId,
    ) {
    }
}

$hooks = new Hooks();
$context = new RenderContext('en', 'user-42');
$hooks->doAction('profile.rendered', $context);
```

The Hooks core does not maintain a hidden global parameter array. `ProcessingContext` is available to processors and renderers and exposes the hook point plus the original invocation arguments.

## String aggregation to renderers

When the old code assembled collector output as a string, use a renderer with an explicit separator:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\ConcatenateRenderer;

$hooks = new Hooks();
$hooks->addCollector('labels', static fn (): string => 'Hooks');
$hooks->addCollector('labels', static fn (): string => 'Beta');
$hooks->setRenderer('labels', new ConcatenateRenderer(' · '));

$output = $hooks->render('labels');
// 'Hooks · Beta'
```

`ConcatenateRenderer` is a collector renderer. It accepts supported scalar, string, `null`, and `Stringable` values and returns an empty string for an empty result list; unsupported values throw `UnexpectedValueException`.

## Removed chaining and legacy output state

The released upgrade guides explicitly identify these version-1 APIs as removed in 2.x:

`register()`, `all()`, `first()`, `last()`, `toArray()`, `toString()`, `__toString()`, `setParameter()`, `setParam()`, `setParameters()`, and `setParams()`.

Rewrite chained version-1 calls as explicit steps:

1. register a named action, filter, or collector;
2. invoke it with explicit arguments;
3. collect raw results when needed;
4. process or render those results explicitly.

There is no shared legacy output or chaining state to read after dispatch. This makes the result boundary visible, but it also means a migration must decide where aggregation, selection, stringification, and parameter ownership belong.

## Version 1 reference

This milestone does not recreate the complete version-1 manual. Use the [historical Hooks releases and source](https://github.com/magdicom/hooks/releases) when you need the old package documentation, then use this page to map the behavior to 2.x Beta.
