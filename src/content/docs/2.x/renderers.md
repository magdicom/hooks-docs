---
title: Renderers
description: Render collector results as strings.
---

# Renderers

Renderers turn a collector's raw results into a string. They are a specialized processor used by `render()` and apply to collectors only.

The behavior on this page is derived from the released `magdicom/hooks` `v2.0.0-beta.1` implementation and tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#processing-and-rendering).

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
$hooks->addCollector('navigation.links', static fn (): string => '<a href="/docs">Docs</a>');
$hooks->addCollector('navigation.links', static fn (): string => '<a href="/api">API</a>');
$hooks->setRenderer('navigation.links', new ConcatenateRenderer(separator: "\n"));

$html = $hooks->render('navigation.links');
```

`collect()` remains the raw operation even when a renderer is configured. `process()` and `render()` use the same collector result slot, so configure the endpoint for the operation your caller needs.

When no renderer is configured, `render()` throws `MissingRendererException`. A class-name renderer must resolve to an implementation of `Renderer`; an invalid implementation raises `InvalidRendererException`. A callable renderer that returns a non-string also raises `InvalidRendererException`.

## `ConcatenateRenderer`

The released built-in class is `Magdicom\Processor\ConcatenateRenderer`:

```php
final class ConcatenateRenderer implements Renderer
{
    public function __construct(string $separator = '')
}
```

It joins rendered entries with the configured separator. It accepts `null` (rendered as an empty string), strings, scalar values, and `Stringable` objects. An unsupported value throws `UnexpectedValueException`. An empty result list renders as an empty string.

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Processor\ConcatenateRenderer;

$hooks = new Hooks();
$hooks->addCollector('labels', static fn (): string => 'Hooks');
$hooks->addCollector('labels', static fn (): string => 'Beta');
$hooks->setRenderer('labels', new ConcatenateRenderer(' · '));

$label = $hooks->render('labels');
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
$hooks->addCollector('headings', static fn (): string => 'Introduction');
$hooks->setRenderer('headings', static function (array $results, ProcessingContext $context): string {
    return implode(' / ', $results);
});

$heading = $hooks->render('headings');
```

A class-name renderer is resolved through the configured core `Resolver` and must implement `Renderer`. `new Hooks()` uses native `new $className()` resolution. A custom resolver can be injected through `new Hooks($resolver)`; the Laravel wrapper supplies its container-backed resolver separately.

Renderers do not apply to actions or filters. Use [processors](/docs/2.x/processors) for non-string reductions and [collectors](/docs/2.x/collectors) for unprocessed result lists.
