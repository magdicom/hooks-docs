---
title: Installation
description: Install the Hooks core package or Laravel integration.
---

# Installation

Hooks 2.x is available as beta Composer packages. Install the core package in any PHP application, or add the Laravel wrapper alongside it when your application uses Laravel.

## Requirements

The released core tag requires PHP `^8.2` and has no runtime dependencies. The released Laravel wrapper requires PHP `^8.2`, Laravel Contracts/Support `^12.0 || ^13.0`, and the core package at `^2.0.0-beta.1`.

These requirements come from the package metadata for the beta tags. The wrapper's documented requirements do not include Laravel 9, 10, or 11.

## Core PHP

From your application's root, run:

```bash
composer require magdicom/hooks:"^2.0@beta"
```

The core package provides `Magdicom\Hooks` and has no Laravel or other framework runtime dependency.

```php
<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use Magdicom\Hooks;

$hooks = new Hooks();

$hooks->addAction('report.generated', static function (string $reportId): void {
    // Perform a synchronous side effect for this extension point.
});

$hooks->doAction('report.generated', 'report-42');
```

## Laravel

Install both beta packages explicitly:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

The wrapper depends on the core package, but your root `composer.json` still needs to allow both beta packages. Composer's normal stable policy does not automatically allow a beta dependency just because another package asks for it. Naming both packages makes that choice explicit.

Do **not** change your global `minimum-stability` setting. Keep beta permission scoped to the package requirements shown above.

Composer auto-discovers the Laravel service provider and facade alias. After installation, the helper is available:

```php
<?php

declare(strict_types=1);

hooks()->addFilter('profile.label', static function (string $label): string {
    return strtoupper($label);
});

$label = hooks()->applyFilters('profile.label', 'administrator');
```

See [Laravel integration](/docs/2.x/laravel) for the facade, dependency injection, container access, and long-running process considerations.

## Verify the installation

Composer should resolve the beta versions allowed by your root constraints. Check the installed versions and run your normal test suite before wiring a hook into an important path. The core examples do not need a Laravel runtime.
