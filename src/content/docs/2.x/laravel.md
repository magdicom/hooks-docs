---
title: Laravel integration
description: Use the Hooks core package through the Laravel integration.
---

# Laravel

The optional `magdicom/laravel-hooks` package connects the framework-independent Hooks core to Laravel's container. It adds Laravel access paths and container-backed class resolution; the action, filter, collector, processor, and renderer APIs remain the core APIs documented elsewhere.

This page documents `magdicom/laravel-hooks` `v2.0.0-beta.2` with `magdicom/hooks` `v2.0.0-beta.1`. The released implementation, package metadata, and integration tests are summarized in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#laravel-integration-truth-set).

## Install and auto-discovery

Install both beta packages explicitly:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

The wrapper advertises its service provider and facade alias through Composer package metadata. Laravel can therefore discover the integration without manually adding the provider to the application configuration.

The wrapper requires PHP `^8.2`, Laravel Contracts/Support `^12.0 || ^13.0`, and the released core dependency. See [installation](/docs/2.x/installation) for the root-project prerelease guidance.

## Access the shared Hooks instance

The service provider registers the core `Magdicom\Hooks` object as a singleton, aliases it as `hooks`, and provides the global `hooks()` helper. These access paths resolve the same application instance:

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

The helper takes no arguments and returns `Magdicom\Hooks`. Put invocation arguments on the Hooks method instead:

```php
<?php

declare(strict_types=1);

hooks()->addAction('invoice.paid', static function (int $invoiceId): void {
    // Run a synchronous side effect.
});

hooks()->doAction('invoice.paid', 42);
```

Passing arguments to `hooks()` itself throws `InvalidArgumentException`. The arguments belong to `doAction()`, `applyFilters()`, `collect()`, `process()`, or `render()`.

## Facade

The package provides `Magdicom\LaravelHooks\Facades\Hooks`. Alias it when the core class is also imported:

```php
<?php

declare(strict_types=1);

use Magdicom\LaravelHooks\Facades\Hooks as HooksFacade;

HooksFacade::addFilter('profile.label', static function (string $label): string {
    return strtoupper($label);
});

$label = HooksFacade::applyFilters('profile.label', 'administrator');
```

The facade resolves its root from the same shared container binding as `app(Magdicom\Hooks::class)` and `hooks()`.

## Dependency injection

Because the core Hooks object is registered in the container, application services can type-hint `Magdicom\Hooks`:

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

`app(Magdicom\Hooks::class)`, `app('hooks')`, `hooks()`, facade calls, and constructor injection share the same singleton state within the Laravel application instance. Register listeners during stable application bootstrapping so every access path observes the intended registry.

## Container-backed resolver

The wrapper binds a Laravel resolver for the core `Resolver` contract. Class callbacks, processors, and renderers resolved through the Hooks object can therefore use Laravel constructor injection. Static callable methods follow the core callable behavior and do not need container resolution.

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

Once the Hooks singleton has been resolved, changing the `Resolver` binding does not replace the resolver already held by that existing Hooks instance. In a test, clear or refresh the application between resolver configurations when isolation is required.

## Long-running application processes

The registry is singleton state. In a normal short-lived request, the application lifecycle limits how long runtime registrations remain available. In Octane workers, queue workers, daemons, and other long-running processes, the same application instance can serve multiple jobs or requests.

Use these practices for long-lived processes:

- register stable listeners during application boot rather than inside request or job code;
- do not capture request-specific state in a listener registered on the shared singleton;
- remove temporary registrations with their `RegistrationHandle`, or use the appropriate `removeAll*()` method after an isolated operation;
- make worker and test boundaries explicit when registrations must not leak between jobs;
- configure or replace the resolver before the Hooks singleton is first resolved.

The package does not automatically reset registrations for every Octane request or worker job. Treat the shared registry as process-lifetime state until the application is refreshed or registrations are explicitly removed.

For core hook semantics, see [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), [collectors](/docs/2.x/collectors), and the [API reference](/docs/2.x/api).
