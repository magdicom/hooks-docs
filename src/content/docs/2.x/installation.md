---
title: Installation
description: Install the Hooks 2.x Beta packages.
---

# Installation

Hooks 2.x is published as prerelease Composer packages. Install the core package for a framework-independent PHP application, or install the Laravel wrapper alongside the core package for a Laravel application.

## Requirements

The released core tag requires PHP `^8.2` and has no runtime dependencies. The released Laravel wrapper requires PHP `^8.2`, Laravel Contracts/Support `^12.0 || ^13.0`, and the core package at `^2.0.0-beta.1`.

These requirements come from the tagged Composer metadata recorded in the [source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md#package-requirements-and-installation-truth). Laravel 9, 10, and 11 are not supported by the documented beta wrapper requirements.

## Core PHP

From the root of a PHP application or reusable package, run:

```bash
composer require magdicom/hooks:"^2.0@beta"
```

The core package provides `Magdicom\Hooks` and does not require Laravel or another framework at runtime.

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

Install both prerelease packages explicitly:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

The wrapper depends on the core package, but both prerelease constraints must be permitted by the consumer root project. Composer's normal stable policy does not automatically allow a beta dependency simply because another package requests it. The explicit command makes the prerelease choice clear at the application boundary.

Do **not** change your global `minimum-stability` setting to install these packages. Keep prerelease permission scoped to the package requirements shown above.

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

Composer should resolve the beta versions allowed by your root project's constraints. Check the installed package metadata and run your application's normal test suite before relying on a hook point. The documentation examples use the public methods from the released tags; they do not require a Laravel runtime for core examples.
