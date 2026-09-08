---
title: Introduction
description: Introduction to the Hooks 2.x Beta documentation.
---

# Hooks 2.x Beta

Hooks is a small, synchronous extension-point library for modern PHP applications. It gives an application named places where other code can register an action, transform a value, or contribute an independent result.

The core package is framework-independent. The optional Laravel package adds Laravel-native access through auto-discovery, the container, a facade, and the `hooks()` helper. The wrapper does not change the core model: a hook is still explicit, ordered, and deterministic.

This site documents the released `magdicom/hooks` `v2.0.0-beta.1` and `magdicom/laravel-hooks` `v2.0.0-beta.2` tags. The [released source audit](https://github.com/magdicom/hooks-docs/blob/main/source-audit.md) records the package metadata, implementation, and focused tests used as the documentation authority.

## When Hooks fit

Use Hooks when a named extension point should be available to code that does not need to know every consumer in advance:

- use an **action** for ordered side effects where callback return values are not part of the result;
- use a **filter** when each listener should transform the current value into the next value;
- use a **collector** when every listener should contribute one result for the caller to inspect or process.

Dispatch is synchronous. The caller does not enqueue work or hand execution to a worker; listeners run during the invocation, in priority and registration order. Exceptions bubble to the caller, and an invocation uses a listener snapshot so mutations affect later invocations rather than the current one.

## When another abstraction fits better

Hooks are intentionally narrower than framework event and pipeline systems.

- Choose **Laravel Events** for domain events, queued listeners, broadcasting, and other Laravel event workflows.
- Choose **Laravel Pipeline** for a known middleware-like transformation chain where each pipe passes control to the next pipe.
- Choose **Hooks** for named synchronous extension points, ordered filters, and independent result collection.

Hooks is not a replacement for Laravel Events or Pipeline. In a framework-independent package, the core package can provide extension points without requiring Laravel; in a Laravel application, use the wrapper only where that explicit hook model is useful.

## Beta status

The 2.x documentation describes beta releases. Pin and test the package versions that your application supports, and review the [upgrade guide](/docs/2.x/upgrade) before moving from version 1. The current packages are not documented as stable releases.

Continue with [installation](/docs/2.x/installation) or compare the [three hook types](/docs/2.x/concepts).
