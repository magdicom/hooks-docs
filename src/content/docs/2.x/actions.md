---
title: Actions
description: Run ordered callbacks for synchronous side effects.
---

# Actions

Use an action when something should happen but the caller does not need a value back. Actions are synchronous and ordered: register callbacks with `addAction()`, then run them with `doAction()`.

For example, an order-created action can notify an integration and write an audit entry without coupling the order class to either detail.

## Register and run an action

The core signature is:

```php
addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle
```

Callbacks receive the extra arguments passed to `doAction()`, in the same order:

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

`doAction()` returns `void`. Callback return values are ignored, so use an action for side effects rather than for producing a value. You can pass any number of explicit arguments after the hook point.

## Priority and ordering

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

Hooks takes a sorted snapshot before it starts. Adding or removing a listener inside a callback does not change the callbacks already selected for this run; the change is visible on the next run. Exceptions reach the caller.

## Empty actions

Calling `doAction()` with no listeners is safe: nothing runs and the method returns `void`.

## Remove a registration

`addAction()` returns a `RegistrationHandle`. Its `remove()` method removes that exact registration and returns `true`; calling it again returns `false`:

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

The handle belongs to the `Hooks` instance that created it. If you prefer callback-based removal, `removeAction($hookPoint, $callback, $priority)` removes the first matching callback at that priority. Use `removeAllActions(?string $hookPoint = null)` to remove action registrations in bulk.

Actions do not transform values or collect results. Use [filters](/docs/2.x/filters) for a sequential value or [collectors](/docs/2.x/collectors) for one result per listener.
