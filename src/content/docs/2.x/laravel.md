---
title: Laravel integration
description: Use Hooks through Laravel's container, facade, and helper.
---

# Laravel

The optional `magdicom/laravel-hooks` package connects the framework-independent Hooks core to Laravel's service container. It gives you familiar Laravel access points and container-backed class resolution; the action, filter, collector, processor, and renderer APIs remain the core APIs.

This page covers `magdicom/laravel-hooks` `v2.0.0-beta.2` with `magdicom/hooks` `v2.0.0-beta.1`. See the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#laravel-integration-truth-set) for the package details behind these examples.

## Core class and Laravel access

There are two classes named `Hooks`, but they serve different purposes:

- `Magdicom\Hooks` is the core instance class. In a framework-independent application, create an instance with `new Hooks()` and call methods on that instance. The core package intentionally does not provide a global helper or static state.
- `Magdicom\LaravelHooks\Facades\Hooks` is the Laravel facade. Its static-looking calls are forwarded to the Hooks singleton managed by Laravel.

In Laravel, `hooks()` is the simplest application-level syntax. The helper and facade resolve the same application singleton:

## Install and auto-discovery

Install both beta packages explicitly:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

Composer package metadata advertises the service provider and facade alias, so Laravel discovers the integration without manual provider configuration.

The wrapper requires PHP `^8.2`, Laravel Contracts/Support `^12.0 || ^13.0`, and the matching core package. See [installation](/docs/2.x/installation) for the root-project beta guidance.

## Access the shared Hooks instance

The service provider registers `Magdicom\Hooks` as a singleton, aliases it as `hooks`, and provides the global `hooks()` helper. These access paths all return the same application instance:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

$byClass = app(Hooks::class);
$byAlias = app('hooks');
$byHelper = hooks();

assert($byClass === $byAlias);
assert($byAlias === $byHelper);
```

The helper takes no arguments and returns `Magdicom\Hooks`. Put your invocation arguments on the Hooks method instead:

```php
<?php

declare(strict_types=1);

hooks()->addAction('invoice.paid', static function (int $invoiceId): void {
    // Run a synchronous side effect.
});

hooks()->doAction('invoice.paid', 42);
```

Passing arguments to `hooks()` throws `InvalidArgumentException`. Pass those arguments to `doAction()`, `applyFilters()`, `collect()`, `process()`, or `render()`.

## Facade alternative

Use the facade when its static-looking syntax fits the surrounding Laravel code. Keep it as an alternative to the helper rather than mixing both styles in one operation:

```php
<?php

declare(strict_types=1);

use Magdicom\LaravelHooks\Facades\Hooks;

Hooks::addFilter('profile.label', static function (string $label): string {
    return strtoupper($label);
});

$label = Hooks::applyFilters('profile.label', 'administrator');
```

The facade uses the same container binding as `app(Magdicom\Hooks::class)` and `hooks()`.

## Dependency injection

Because the core object is in the container, your services can type-hint `Magdicom\Hooks`. Constructor injection is the recommended style inside application services, jobs, commands, and other testable classes:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;

final class ProfileLabel
{
    public function __construct(private Hooks $hooks)
    {
    }

    public function make(string $name): string
    {
        return $this->hooks->applyFilters('profile.label', $name);
    }
}
```

`app(Magdicom\Hooks::class)`, `app('hooks')`, `hooks()`, facade calls, and constructor injection share singleton state within the Laravel application. Register listeners during application boot so every access path sees the same registry.

## Container-backed resolver

The wrapper binds a Laravel resolver for the core `Resolver` contract. Class callbacks, processors, and renderers can therefore use Laravel constructor injection. Static callable methods follow the core behavior and do not need container resolution.

If an application or package needs to replace the resolver, rebind `Magdicom\Resolver` before `Magdicom\Hooks` is first resolved:

```php
<?php

declare(strict_types=1);

use Magdicom\Hooks;
use Magdicom\Resolver;

app()->bind(Resolver::class, static function (): Resolver {
    return new ApplicationResolver();
});

// Resolve Hooks only after the replacement is registered.
$hooks = app(Hooks::class);
```

Set the resolver before `Magdicom\Hooks` is first resolved. Once the singleton exists, changing the binding does not replace the resolver already held by that instance. In tests, refresh the application between resolver configurations when you need isolation.

## Long-running application processes

The registry lives on the singleton. A short-lived request naturally limits its lifetime, but Octane workers, queue workers, daemons, and other long-running processes can reuse the same instance for many jobs or requests.

Use these practices for long-lived processes:

- register stable listeners during application boot rather than inside request or job code;
- do not capture request-specific state in a listener registered on the shared singleton;
- remove temporary registrations with their `RegistrationHandle`, or use the appropriate `removeAll*()` method after an isolated operation;
- make worker and test boundaries explicit when registrations must not leak between jobs;
- configure or replace the resolver before the Hooks singleton is first resolved.

The package does not reset registrations for each Octane request or worker job. Treat the shared registry as process-lifetime state until the application is refreshed or you remove registrations explicitly.

For core hook semantics, see [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), [collectors](/docs/2.x/collectors), and the [API reference](/docs/2.x/api).
