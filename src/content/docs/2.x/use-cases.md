---
title: Use Cases
description: Practical ways to use Hooks for integrations, customization, and contributed results.
---

# Use Cases

Hooks is useful when one part of an application should offer a stable place for other code to participate. The original class owns the hook point; modules add behavior without forcing that class to know every integration.

The examples on this page use a recommended naming style: lowercase, dot-separated names such as `invoice.paid` and `dashboard.widgets`. Hook names are plain string identifiers, so treat them as stable public contracts. The package does not enforce this naming style, and names are case-sensitive: `invoice.paid` and `Invoice.Paid` are different hook points.

The snippets focus on the important lines, so they omit `<?php` and `declare(strict_types=1);`. Your application can use strict types according to its own project conventions; Hooks does not require that declaration specifically.

## Invoice-paid extensions with an action

### The problem

When an invoice is paid, several independent modules may need to react. The billing code should not have to know about the receipt mailer, CRM, analytics service, and accounting provider.

### Expose the hook point

The invoice service publishes `invoice.paid` after the payment has been recorded:

```php
use Magdicom\Hooks;

final class InvoiceService
{
    public function __construct(private Hooks $hooks)
    {
    }

    public function markPaid(int $invoiceId): void
    {
        // Persist the payment first.
        $this->hooks->doAction('invoice.paid', $invoiceId);
    }
}
```

### Add extensions

Separate modules register their own callbacks. The invoice service has no direct dependency on any of them:

```php
$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Send the receipt.
});

$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Update the CRM.
});

$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Record an analytics conversion.
});

$hooks->addAction('invoice.paid', static function (int $invoiceId): void {
    // Notify the accounting integration.
});
```

`doAction()` returns `void`. Actions are the right choice because each module performs a side effect and none of the return values belongs in the invoice service's result.

## Customizing an invoice total with a filter

### The problem

Different parts of checkout may adjust an invoice total. Directly calling a discount service, then a service-charge service, makes the invoice class responsible for the order and every future adjustment.

### Expose and extend the value

The invoice code passes the total in cents through `invoice.total`:

```php
$hooks->addFilter('invoice.total', static function (int $total): int {
    return $total - 1000; // Apply a $10 discount.
}, priority: 10);

$hooks->addFilter('invoice.total', static function (int $total): int {
    return $total + 500; // Add a $5 service charge.
}, priority: 20);

$total = $hooks->applyFilters('invoice.total', 10000);
// 9500 cents
```

Filters pass the current value to the next callback. The discount runs first because priority `10` comes before `20`, so the service charge is applied to the discounted total. Changing priorities changes the final value; equal priorities keep registration order.

`applyFilters()` returns the original value when no listener is registered. Use a filter when there should be one final value, not one independent result per module.

## Dashboard widgets from independent modules

### The problem

An administration dashboard may contain widgets from billing, support, and inventory packages. Editing the dashboard every time a package adds a widget creates unnecessary coupling.

### Expose and collect widgets

The dashboard asks every module for its own definition:

```php
$hooks->addCollector('dashboard.widgets', static function (int $userId): array {
    return ['key' => 'revenue', 'title' => 'Revenue', 'user_id' => $userId];
});

$hooks->addCollector('dashboard.widgets', static function (int $userId): array {
    return ['key' => 'tickets', 'title' => 'Open tickets', 'user_id' => $userId];
});

$widgets = $hooks->collect('dashboard.widgets', $userId);
```

`collect()` returns one raw entry per listener, in priority and registration order. It does not merge or flatten widget definitions, leaving the dashboard free to render or process the shape it needs. A collector returns `[]` when no module has registered a widget.

## Extensible payment methods

### The problem

Payment packages should be able to add Stripe, bank transfer, or purchase-order options without editing the checkout implementation. The checkout should ask for available methods rather than maintain a growing list of package dependencies.

### Let packages contribute capabilities

Each payment package contributes a definition to `checkout.payment_methods`:

```php
$hooks->addCollector('checkout.payment_methods', static fn (): array => [
    'id' => 'card',
    'label' => 'Credit card',
    'driver' => CardPayment::class,
]);

$hooks->addCollector('checkout.payment_methods', static fn (): array => [
    'id' => 'bank_transfer',
    'label' => 'Bank transfer',
    'driver' => BankTransferPayment::class,
]);

$paymentMethods = $hooks->collect('checkout.payment_methods');
```

The checkout implementation receives every definition and decides how to display or validate it. A collector fits because each package owns an independent payment-method record.

## Navigation output with a renderer

### The problem

Several modules may contribute navigation items, but the layout should have one place that turns those contributions into the final navigation output.

### Collect fragments and render them

Collectors return strings that the built-in `ConcatenateRenderer` can accept. The separator is explicit, and the renderer returns one final string:

```php
use Magdicom\Processor\ConcatenateRenderer;

$hooks->addCollector('navigation.items', static fn (): string => '<a href="/account">Account</a>');
$hooks->addCollector('navigation.items', static fn (): string => '<a href="/help">Help</a>');
$hooks->setRenderer('navigation.items', new ConcatenateRenderer(separator: "\n"));

$navigation = $hooks->render('navigation.items');
// '<a href="/account">Account</a>\n<a href="/help">Help</a>'
```

`ConcatenateRenderer` accepts strings, scalar values, `null`, and `Stringable` objects. It returns an empty string for an empty result list and throws `UnexpectedValueException` for an unsupported value. Renderers apply to collectors, not actions or filters.

## Application decisions with boolean processors

### The problem

Checkout may be allowed only when every relevant rule agrees. Inventory, fraud checks, and account status can live in separate modules, while checkout still needs one boolean decision.

### Collect strict decisions and process them

Use `BooleanAndProcessor` to require every contribution to be `true`:

```php
use Magdicom\Processor\BooleanAndProcessor;

$hooks->addCollector('checkout.allowed', static fn (int $userId): bool => true);
$hooks->addCollector('checkout.allowed', static fn (int $userId): bool => $userId !== 0);
$hooks->setProcessor('checkout.allowed', new BooleanAndProcessor());

$allowed = $hooks->process('checkout.allowed', $userId);
```

Each collector must return a real `bool`; values are not coerced. `BooleanAndProcessor` returns `true` for an empty result list, so an application that requires at least one rule should check registration separately. `process()` returns the processor's boolean result, making this a good fit for a single application decision.

## Laravel container integration

### The problem

An extension callback may need a mailer, repository, or API client. Constructing that callback manually in every service makes configuration and testing harder.

### Let Laravel build the callback

The Laravel integration resolves non-static class method callbacks through the service container:

```php
final class SendInvoiceReceipt
{
    public function __construct(private ReceiptMailer $mailer)
    {
    }

    public function handle(int $invoiceId): void
    {
        $this->mailer->sendForInvoice($invoiceId);
    }
}

hooks()->addAction('invoice.paid', [SendInvoiceReceipt::class, 'handle']);
hooks()->doAction('invoice.paid', $invoiceId);
```

Laravel resolves `ReceiptMailer` when the callback is prepared, so the module can use normal constructor injection. The hook point and its arguments stay explicit, while Laravel handles the callback's dependencies. Static callables follow the core behavior and do not need container resolution.

Continue with the [actions](/docs/2.x/actions), [filters](/docs/2.x/filters), and [collectors](/docs/2.x/collectors) guides for detailed hook behavior, or review the [Laravel integration](/docs/2.x/laravel) page for singleton and long-running-process considerations.
