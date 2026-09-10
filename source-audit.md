# Released Source Audit

This document is the source-of-truth record for the current public documentation. It is tied to immutable release commits and must be updated whenever a documented package release changes the public API.

## Audit scope and authority

Inspected repositories:

| Package | Released tag | Commit | Repository |
| --- | --- | --- | --- |
| `magdicom/hooks` | `v2.0.0-beta.2` | `a3e10dc8674968ea4062b924706e6ea7ed83b876` | [source](https://github.com/magdicom/hooks/tree/a3e10dc8674968ea4062b924706e6ea7ed83b876) |
| `magdicom/laravel-hooks` | `v2.0.0-beta.3` | `5003de56228c53934548a6b704f4d51ece4b9472` | [source](https://github.com/magdicom/laravel-hooks/tree/5003de56228c53934548a6b704f4d51ece4b9472) |

Inspected material for both tags:

- `composer.json` requirements, autoloading, package metadata, scripts, and Laravel auto-discovery metadata;
- `README.md`, `UPGRADE.md`, and `AGENTS.md`;
- all public source classes;
- focused tests covering empty dispatch, execution order, invocation arguments, mutation/snapshots, nested processing, registration handles, resolver behavior, processor/renderer dispatch, and Laravel container integration.

When prose, README guidance, tests, and implementation differ, the released implementation and tests are authoritative. The audit does not use the repositories' moving branches.

## Package requirements and installation truth

### Core package

`magdicom/hooks` requires PHP `^8.2`. It has no runtime dependencies. Its PSR-4 namespace is `Magdicom\\` mapped to `src/`.

Source: [`composer.json`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/composer.json).

Released beta installation command:

```bash
composer require magdicom/hooks:"^2.0@beta"
```

### Laravel wrapper

`magdicom/laravel-hooks` requires:

- PHP `^8.2`;
- Laravel contracts/support `^12.0 || ^13.0`;
- `magdicom/hooks` `^2.0.0-beta.2`.

Its runtime namespace is `Magdicom\\LaravelHooks\\`, and `src/helpers.php` is autoloaded as a file. Composer metadata advertises `ServiceProvider` and the `Hooks` facade alias for Laravel auto-discovery.

Source: [`composer.json`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/composer.json).

Released beta installation command:

```bash
composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"
```

Both prerelease packages are explicit in the consumer command because the root project's default stable policy must permit both beta requirements. The released wrapper README explicitly says not to change global `minimum-stability`.

## Core public API truth set

The complete public surface below is derived from [`src/Hooks.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php), [`src/RegistrationHandle.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/RegistrationHandle.php), and the supporting contracts.

### Construction and hook dispatch

| Method | Released behavior | Applicable type |
| --- | --- | --- |
| `__construct(?Resolver $resolver = null)` | Uses the supplied resolver, or `NativeResolver` when omitted. | All |
| `addAction(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle` | Registers an action and returns a handle. | Action |
| `addFilter(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle` | Registers a filter and returns a handle. | Filter |
| `addCollector(string $hookPoint, array|callable $callback, int $priority = 10): RegistrationHandle` | Registers a collector and returns a handle. | Collector |
| `doAction(string $hookPoint, mixed ...$arguments): void` | Invokes an action snapshot with arguments exactly as passed; callback return values are ignored. | Action |
| `applyFilters(string $hookPoint, mixed $value, mixed ...$arguments): mixed` | Passes the current value as the first callback argument, then explicit arguments, sequentially. | Filter |
| `collect(string $hookPoint, mixed ...$arguments): array` | Returns one raw result per collector listener in dispatch order; it never flattens or processes results. | Collector |

Source: [`Hooks.php#L53-L126`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L53-L126). Tests: [`EmptyDispatchTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/EmptyDispatchTest.php), [`ExecutionSemanticsTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/ExecutionSemanticsTest.php), and [`InvocationArgumentsTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/InvocationArgumentsTest.php).

Empty dispatch behavior:

- actions complete without side effects and return `void`;
- filters return their original input value;
- collectors return `[]`.

### Processing and rendering

| Method | Released behavior |
| --- | --- |
| `setProcessor(string $hookPoint, ResultProcessor|callable|string $processor): self` | Stores or replaces the single processing slot for a collector endpoint. |
| `hasProcessor(string $hookPoint): bool` | Reports whether the endpoint has a configured slot. |
| `processor(string $hookPoint): ResultProcessor|callable|string|null` | Returns the stored processor reference unchanged, or `null`. |
| `clearProcessor(string $hookPoint): bool` | Removes the slot and reports whether one existed. |
| `setRenderer(string $hookPoint, Renderer|callable|string $renderer): self` | Stores/replaces the same slot used by `setProcessor()`. |
| `process(string $hookPoint, mixed ...$arguments): mixed` | Collects raw results, invokes the configured processor with `ProcessingContext`, and returns processor output unchanged. Missing configuration throws `MissingProcessorException`. |
| `render(string $hookPoint, mixed ...$arguments): string` | Collects raw results, invokes the configured renderer, and requires string output. Missing or invalid renderer configuration throws `MissingRendererException` or `InvalidRendererException`. |

Processors and renderers apply to collectors only. `collect()` bypasses the shared slot even when a processor or renderer is configured.

Sources: [`Hooks.php#L128-L200`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L128-L200), [`ResultProcessor.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/ResultProcessor.php), [`Renderer.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Renderer.php), [`ProcessingContext.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/ProcessingContext.php), and [`ProcessingContractsTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/ProcessingContractsTest.php).

`ProcessingContext` exposes only:

- `hookPoint(): string`;
- `arguments(): array` containing the original invocation arguments.

### Inspection, handles, and removal

| Method | Released behavior |
| --- | --- |
| `has(string $hookPoint): bool` | True if any action, filter, or collector registration exists at the point. |
| `hasAction/hasFilter/hasCollector(string $hookPoint, array|callable|null $callback = null, int $priority = 10): bool` | Type-aware inspection; callback checks include priority. Omitting the callback checks whether any registration of that type exists. |
| `count(?string $hookPoint = null): int` | Counts registrations across types, optionally limited to a hook point. |
| `listeners(string $hookPoint): array` | Returns handles for all types, sorted by priority then registration id. |
| `actions/filters/collectors(string $hookPoint): array` | Return handles for one exact hook type in dispatch order. |
| `removeAction/removeFilter/removeCollector(string $hookPoint, array|callable $callback, int $priority = 10): bool` | Removes the first matching callback of the requested type and priority. It does not accept handles. |
| `removeAll(?string $hookPoint = null): int` | Removes all types for one point, or the entire registry, and returns the number removed. |
| `removeAllActions/removeAllFilters/removeAllCollectors(?string $hookPoint = null): int` | Bulk removal for one type, optionally one point. |

Each registration returns a `RegistrationHandle` with:

- `id(): int`;
- `hookPoint(): string`;
- `type(): string`;
- `priority(): int`;
- `remove(): bool`, which removes that exact registration and returns `false` after it is already removed;
- `belongsTo(Hooks $hooks): bool`, which uses exact object ownership.

Callback-based matching compares callback identity and priority. Handle removal is registration-id based, so it remains exact even when equivalent callbacks or duplicate callbacks exist. Equal priorities retain registration order because registration ids are monotonic.

Sources: [`Hooks.php#L202-L374`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L202-L374), [`Hooks.php#L576-L655`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L576-L655), [`RegistrationHandle.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/RegistrationHandle.php), and [`RegistrationHandleTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/RegistrationHandleTest.php).

### Ordering and mutation semantics

- Lower numeric priorities run first.
- Default priority is `10`.
- Equal priorities preserve registration order.
- Dispatch uses a sorted listener snapshot; additions or removals during the current invocation affect later invocations only.
- Nested `collect()`, `process()`, and `render()` calls remain isolated.
- Exceptions bubble to the caller; subsequent invocations remain usable.

Sources: [`Hooks.php#L694-L741`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L694-L741), [`DispatchMutationTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/DispatchMutationTest.php), and [`NestedProcessingTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/NestedProcessingTest.php).

### Callback and resolver behavior

Accepted callback forms are closures/callables, object method arrays, and class-name method arrays. A callable array or static method is used directly when PHP considers it callable. A non-static class method array is resolved through `Resolver`, then invoked on the resolved object.

Core resolver contracts:

- `Resolver::resolve(string $className): object`;
- `NativeResolver::resolve()` returns `new $className()`;
- `new Hooks()` uses `NativeResolver` automatically;
- custom resolvers can be injected into `Hooks`.

Class-name processors are resolved and must implement `ResultProcessor`, otherwise `InvalidProcessorException` is thrown. Class-name renderers are resolved and must implement `Renderer`; a renderer slot containing a non-renderer processor is invalid. Callable renderers are checked for string output and throw `InvalidRendererException` for non-string results.

Sources: [`Hooks.php#L380-L457`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Hooks.php#L380-L457), [`Resolver.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Resolver.php), [`NativeResolver.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/NativeResolver.php), [`ResolverTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/ResolverTest.php), and [`CallbackTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/CallbackTest.php).

## Released built-in processors and renderer

All built-ins implement the `ResultProcessor` or `Renderer` contract and receive `(array $results, ProcessingContext $context)`.

| Class | Input expectation | Return and empty-result behavior | Failure behavior |
| --- | --- | --- | --- |
| `FirstProcessor` | Any result list | First entry or `null` | None beyond normal invocation errors |
| `LastProcessor` | Any result list | Last entry or `null` | None beyond normal invocation errors |
| `FirstNonNullProcessor` | Any result list | First non-`null` entry or `null` | None beyond normal invocation errors |
| `BooleanAndProcessor` | Every entry must be `bool` | `true` for empty results; short-circuits to `false` | `UnexpectedValueException` for non-boolean entries |
| `BooleanOrProcessor` | Every entry must be `bool` | `false` for empty results; short-circuits to `true` | `UnexpectedValueException` for non-boolean entries |
| `MergeProcessor` | Every entry must be an array | Empty result produces `[]`; uses `array_merge()` semantics | `UnexpectedValueException` for non-array entries |
| `FlattenProcessor` | Every top-level entry must be an array | Empty result produces `[]`; flattens values by configured depth (`-1` unlimited, `0` top-level only) and discards array keys | Constructor rejects depth below `-1`; non-array entries throw `UnexpectedValueException` |
| `ConcatenateRenderer` | Any values supported by its stringification rules | Empty result produces `''`; joins rendered entries with the configured separator | `UnexpectedValueException` for unsupported values; accepts `null`, strings, scalars, and `Stringable` |

Sources: [`src/Processors`](https://github.com/magdicom/hooks/tree/a3e10dc8674968ea4062b924706e6ea7ed83b876/src/Processors), [`BooleanProcessorsTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/BooleanProcessorsTest.php), [`FlattenProcessorTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/FlattenProcessorTest.php), [`MergeProcessorTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/MergeProcessorTest.php), [`ProcessorDispatchTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/ProcessorDispatchTest.php), and [`RendererDispatchTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/RendererDispatchTest.php).

## One-off processing and rendering

The audited `magdicom/hooks` `v2.0.0-beta.2` release includes the one-off finalization methods on `Magdicom\\Hooks`:

| Method | Behavior | Verification |
| --- | --- | --- |
| `processWith(string $hookPoint, ResultProcessor\|callable\|string $processor, mixed ...$arguments): mixed` | Collects the endpoint once and applies the supplied processor without reading or changing persistent processor configuration. | [`OneOffProcessingTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/OneOffProcessingTest.php) |
| `renderWith(string $hookPoint, Renderer\|callable\|string $renderer, mixed ...$arguments): string` | Collects the endpoint once and applies the supplied renderer without reading or changing persistent processor configuration. | [`OneOffProcessingTest.php`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/tests/OneOffProcessingTest.php) |

Both methods are released APIs in beta.2. Use them when a call needs a temporary processor or renderer; use `setProcessor()` or `setRenderer()` when the choice should remain configured for later calls.

## Laravel integration truth set

### Service provider and access paths

`ServiceProvider::register()` binds `LaravelResolver`, `Resolver`, and `Hooks` as singletons, then aliases `Hooks::class` to `'hooks'`. The core `Hooks` singleton receives the container-backed resolver at first resolution.

The following access paths resolve the same application singleton:

- `app(\\Magdicom\\Hooks::class)`;
- `app('hooks')`;
- `hooks()`;
- `Magdicom\\LaravelHooks\\Facades\\Hooks` and its facade root.

The global helper has signature `hooks(): Magdicom\\Hooks`. Passing arguments throws `InvalidArgumentException`; invocation arguments belong on `doAction()`, `applyFilters()`, `collect()`, `process()`, or `render()`.

Sources: [`ServiceProvider.php`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/src/ServiceProvider.php), [`helpers.php`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/src/helpers.php), [`Facades/Hooks.php`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/src/Facades/Hooks.php), and [`ContainerIntegrationTest.php`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/tests/ContainerIntegrationTest.php).

### Laravel resolver

`LaravelResolver` delegates class construction to the Laravel container. It supports constructor injection and rejects a container result that is not an object with `RuntimeException`. Static callable methods follow core callable behavior and do not require container resolution.

Applications/packages may rebind `Magdicom\\Resolver` before `Magdicom\\Hooks` is first resolved. After the singleton is resolved, changing the binding does not replace the resolver held by that existing `Hooks` instance.

### Long-running processes

The registry is application-singleton state. Runtime registrations remain in the singleton until the application instance is refreshed or registrations are explicitly removed. Documentation must recommend stable boot-time registration and deliberate cleanup/isolation for Octane workers, queue workers, daemons, and similar long-running processes.

Source: [`README.md`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/README.md#singleton-lifecycle) and [`AGENTS.md`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/AGENTS.md#documentation).

## Migration truth set

The released upgrade guides agree on these mappings:

| Version 1 | Version 2 |
| --- | --- |
| `register()` for side effects | `addAction()` + `doAction()` |
| `register()` for transformations | `addFilter()` + `applyFilters()` |
| `register()`/`all()` for result gathering | `addCollector()` + `collect()` |
| `all()->toArray()` | `collect()` |
| `first()` / `last()` | collector processors such as `FirstProcessor` / `LastProcessor` |
| global parameter arrays | explicit invocation arguments or typed context objects |
| `toString()` | `ConcatenateRenderer` + `render()` |
| shared output/chaining state | explicit raw collection and processing/rendering steps |

Removed version-1 APIs explicitly named by the released guides include `register()`, `all()`, `first()`, `last()`, `toArray()`, `toString()`, `__toString()`, `setParameter()`, `setParam()`, `setParameters()`, and `setParams()`.

Sources: core [`UPGRADE.md`](https://github.com/magdicom/hooks/blob/a3e10dc8674968ea4062b924706e6ea7ed83b876/UPGRADE.md) and Laravel [`UPGRADE.md`](https://github.com/magdicom/laravel-hooks/blob/5003de56228c53934548a6b704f4d51ece4b9472/UPGRADE.md).

## Discrepancies and documentation cautions

No contradiction was found between the released implementation and focused tests for the behaviors required by the documentation MVP.

The following are documentation cautions rather than implementation defects:

1. The core README describes the core package as framework-independent and its deferred-integration section says framework-specific integrations are outside the core branch. The Laravel wrapper is a separate package and must be documented separately, not as a core dependency or core feature.
2. `setProcessor()` and `setRenderer()` share one untyped collector slot. A custom processor/renderer may be narrower than `list<mixed>`, so endpoint-to-processor result compatibility remains the consumer's responsibility.
3. A callable string such as a named function or static method string is executed as a callable before a non-callable string is treated as a resolver-backed class name.
4. The Laravel wrapper's requirement is Laravel 12 or 13 only. Laravel 9, 10, and 11 must not appear in installation guidance for this beta tag.

## Audit completion checklist

- [x] Exact core and Laravel tags checked out and commit hashes recorded.
- [x] Composer requirements and prerelease installation commands recorded.
- [x] Public hook, inspection, removal, processing, rendering, resolver, and handle APIs inventoried.
- [x] Built-in processor/renderer input, output, empty, and failure behavior recorded.
- [x] Laravel auto-discovery, access paths, singleton, resolver replacement, and helper behavior recorded.
- [x] Focused tests inspected for empty behavior, ordering, snapshots, nested calls, callbacks, and integration.
- [x] Migration mappings and removed APIs recorded.
- [x] No unreleased branch behavior used as documentation authority.
