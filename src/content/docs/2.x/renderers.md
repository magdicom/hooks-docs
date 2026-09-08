---
title: Renderers
description: Turn collector results into formatted strings.
---

# Renderers

Renderers turn a collector's results into a string. Use one when callback results need to become text, such as a list of labels or a short piece of markup. Renderers apply to collectors only.

Configure a renderer with `setRenderer()` and call `render()` when the caller needs formatted output.

## Configure and render

The relevant methods are:

```php
setRenderer(string $hookPoint, Renderer|callable|string $renderer): self
render(string $hookPoint, mixed ...$arguments): string
```

`render()` collects one raw result per listener, passes the list and a `ProcessingContext` to the renderer, and requires a string result:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\ConcatenateRenderer;

$hooks = new Hooks();
$hooks->addCollector('navigation.items', static fn (): string => '<a href="/docs">Docs</a>');
$hooks->addCollector('navigation.items', static fn (): string => '<a href="/api">API</a>');
$hooks->setRenderer('navigation.items', new ConcatenateRenderer(separator: "\n"));

$html = $hooks->render('navigation.items');
```

`collect()` remains the raw operation even when a renderer is configured. `process()` and `render()` use the same collector result slot, so configure the endpoint for the operation your caller needs.

Without a configured renderer, `render()` throws `MissingRendererException`. A class-name renderer must resolve to `Renderer`; an invalid implementation raises `InvalidRendererException`. A callable renderer that returns a non-string raises the same exception.

## `ConcatenateRenderer`

The built-in `Magdicom\Processor\ConcatenateRenderer` joins rendered entries with a separator:

```php
final class ConcatenateRenderer implements Renderer
{
    public function __construct(string $separator = '')
}
```

It accepts `null` (as an empty string), strings, scalar values, and `Stringable` objects. An unsupported value throws `UnexpectedValueException`. An empty result list renders as an empty string.

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\ConcatenateRenderer;

$hooks = new Hooks();
$hooks->addCollector('navigation.labels', static fn (): string => 'Hooks');
$hooks->addCollector('navigation.labels', static fn (): string => 'Beta');
$hooks->setRenderer('navigation.labels', new ConcatenateRenderer(' · '));

$label = $hooks->render('navigation.labels');
// 'Hooks · Beta'
```

## Renderer callbacks and class names

A callable renderer receives `(array $results, ProcessingContext $context)` and must return a string:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\ProcessingContext;

$hooks = new Hooks();
$hooks->addCollector('report.sections', static fn (): string => 'Introduction');
$hooks->setRenderer('report.sections', static function (array $results, ProcessingContext $context): string {
    return implode(' / ', $results);
});

$heading = $hooks->render('report.sections');
```

A class-name renderer is resolved through the configured core `Resolver` and must implement `Renderer`. `new Hooks()` uses native `new $className()` resolution. Inject a custom resolver with `new Hooks($resolver)`; the Laravel wrapper supplies its container-backed resolver.

Renderers do not apply to actions or filters. Use [processors](/docs/2.x/processors) for non-string reductions and [collectors](/docs/2.x/collectors) for unprocessed result lists.
