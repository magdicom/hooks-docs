---
title: Upgrade from 1.x
description: Move common Hooks version 1 patterns to the 2.x Beta API.
---

Hooks 2.x replaces version 1's registration and output model with explicit actions, filters, collectors, processors, and renderers. This guide shows how to move the common patterns; it is not a copy of the version-1 manual.

The mappings below follow the core and Laravel package upgrade guides. The 2.x packages are beta releases, so test your migration against the versions your application supports.

## Before you migrate

Install the beta packages explicitly in your application:

```bash
composer require magdicom/hooks:"^2.0@beta"
```

For Laravel, install both packages:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

Do not change global Composer `minimum-stability` settings. See [installation](/docs/2.x/installation) for PHP and Laravel requirements.

## Choose the new hook type

Version 1's registration method covered several jobs. In 2.x, choose the method that matches what the caller needs:

| Version 1 intent | Version 2 registration and invocation | Result |
| --- | --- | --- |
| `register()` for side effects | `addAction()` + `doAction()` | Synchronous `void` execution; callback returns are ignored |
| `register()` for transformations | `addFilter()` + `applyFilters()` | Sequentially transformed value |
| `register()`/`all()` for result gathering | `addCollector()` + `collect()` | One raw result per listener |

There is no single replacement for every old `register()` call. Look at what each registration does, then choose [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), or [collectors](/docs/2.x/collectors).

### Side effects: `register()` to actions

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addAction('InvoicePaid', static function (int $invoiceId): void {
    // Send a synchronous notification or write an audit entry.
});

$hooks->doAction('InvoicePaid', 42);
```

`doAction()` returns `void`. If callers used the old callback's return value, migrate that code to a filter or collector instead.

### Transformations: `register()` to filters

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addFilter('ProfileLabel', static function (string $label): string {
    return strtoupper($label);
});

$label = $hooks->applyFilters('ProfileLabel', 'administrator');
```

The current value is the first callback argument, and each callback's return value becomes the next value. With no listeners, `applyFilters()` returns the original value.

### Result gathering: `register()`/`all()` to collectors

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addCollector('DashboardWidgets', static fn (): array => ['owner']);
$hooks->addCollector('DashboardWidgets', static fn (): array => ['activity']);

$cards = $hooks->collect('DashboardWidgets');
// [['owner'], ['activity']]
```

`collect()` returns one raw entry per listener. It does not recreate implicit version-1 aggregation, flattening, or output state.

## `all()` and `toArray()` to `collect()`

For result lists, the migration is:

```php
// Version 2
$results = $hooks->collect('DashboardWidgets');
```

This replaces both old `all()` result gathering and `all()->toArray()`. If you need a merged or flattened shape, configure a collector processor such as `MergeProcessor` or `FlattenProcessor`, or transform the raw array yourself. `collect()` never merges entries automatically.

## `first()` and `last()` to processors

When the old code selected one collector result, configure the intended reduction explicitly:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processors\FirstProcessor;
use Magdicom\Processors\LastProcessor;

$hooks = new Hooks();
$hooks->addCollector('CheckoutBanner', static fn (): string => 'Primary');
$hooks->addCollector('CheckoutBanner', static fn (): string => 'Fallback');

$hooks->setProcessor('CheckoutBanner', new FirstProcessor());
$first = $hooks->process('CheckoutBanner');

$hooks->setProcessor('CheckoutBanner', new LastProcessor());
$last = $hooks->process('CheckoutBanner');
```

`FirstProcessor` and `LastProcessor` return `null` for an empty result list. Selection is a collector decision; actions and filters do not have `first()` or `last()` methods.

## Parameters: global arrays to explicit arguments

If version 1 stored parameters globally, pass the values at invocation time:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();
$hooks->addFilter('InvoiceTotal', static function (int $price, string $currency): int {
    return $currency === 'USD' ? $price : $price + 1;
});

$price = $hooks->applyFilters('InvoiceTotal', 100, 'USD');
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
$hooks->doAction('ProfileRendered', $context);
```

The Hooks core does not maintain a hidden global parameter array. Processors and renderers can use `ProcessingContext` to read the hook point and original invocation arguments.

## String aggregation to renderers

When the old code assembled collector output as a string, use a renderer with an explicit separator:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processors\ConcatenateRenderer;

$hooks = new Hooks();
$hooks->addCollector('NavigationLabels', static fn (): string => 'Hooks');
$hooks->addCollector('NavigationLabels', static fn (): string => 'Beta');
$hooks->setRenderer('NavigationLabels', new ConcatenateRenderer(' · '));

$output = $hooks->render('NavigationLabels');
// 'Hooks · Beta'
```

`ConcatenateRenderer` accepts supported scalar, string, `null`, and `Stringable` values. It returns an empty string for an empty result list; unsupported values throw `UnexpectedValueException`.

## Removed chaining and legacy output state

These version-1 APIs are removed in 2.x:

`register()`, `all()`, `first()`, `last()`, `toArray()`, `toString()`, `__toString()`, `setParameter()`, `setParam()`, `setParameters()`, and `setParams()`.

Rewrite chained version-1 calls as explicit steps:

1. register a named action, filter, or collector;
2. invoke it with explicit arguments;
3. collect raw results when needed;
4. process or render those results explicitly.

There is no shared legacy output or chaining state after dispatch. Decide explicitly where aggregation, selection, string conversion, and parameter ownership belong in the new code.

## Version 1 reference

This guide does not recreate the complete version-1 manual. Use the [historical Hooks releases and source](https://github.com/magdicom/hooks/releases) when you need the old package documentation, then use this page to plan the move to 2.x Beta.
