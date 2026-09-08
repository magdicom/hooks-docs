---
title: Actions
description: Ordered synchronous side-effect hooks.
---

# Actions

Actions are synchronous, ordered notifications for side effects. Register a callback with `addAction()` and invoke the hook point with `doAction()`.

The behavior on this page is derived from the released implementation and tests in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#core-public-api-truth-set).

## Register and invoke

The core signature is:

```php
addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
```

The callback receives the variadic arguments passed to `doAction()` in the same order:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('invoice.paid', static function (int $invoiceId, string $currency): void {
    // Write an audit entry or notify a synchronous integration.
}, priority: 10);

$hooks->doAction('invoice.paid', 42, 'USD');
```

`doAction()` returns `void`. A callback's return value is ignored, so actions should communicate through their side effects rather than returning a value to the caller. The method accepts any number of explicit arguments after the hook point.

## Priority and order

The default priority is `10`. Lower numeric priorities run first. When two listeners have the same priority, their registration order is preserved:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('cache.refresh', static function (): void {
    // Runs first.
}, priority: 5);

$hooks->addAction('cache.refresh', static function (): void {
    // Runs second.
}, priority: 10);

$hooks->doAction('cache.refresh');
```

The registry dispatches a sorted listener snapshot. Adding or removing a listener from inside a callback does not change the listeners already selected for the current invocation; the mutation is visible to a later invocation. Exceptions bubble to the caller.

## Empty actions

Calling `doAction()` for a hook point with no listeners completes without side effects and returns `void`. It is safe to invoke an action before any package has registered a listener.

## Remove a registration

`addAction()` returns a `RegistrationHandle`. Calling `remove()` removes that exact registration and returns `true`; calling it again returns `false`:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$hooks = new Hooks();

$handle = $hooks->addAction('cache.refresh', static function (): void {
    // This exact registration can be removed later.
});

$handle->remove();
$hooks->doAction('cache.refresh');
```

The handle is tied to the `Hooks` instance that created it. For callback-based removal, use `removeAction($hookPoint, $callback, $priority)`, which removes the first matching callback of the requested type and priority. Use `removeAllActions(?string $hookPoint = null)` for bulk removal of action registrations.

Actions do not transform values or collect results. Use [filters](/docs/2.x/filters) for a sequential value or [collectors](/docs/2.x/collectors) for one result per listener.
