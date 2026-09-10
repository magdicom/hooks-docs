// Public API inventory audited from immutable package commits recorded in source-audit.md.
// Core: magdicom/hooks v2.0.0-beta.2 @ a3e10dc8674968ea4062b924706e6ea7ed83b876
// Laravel: magdicom/laravel-hooks v2.0.0-beta.3 @ 5003de56228c53934548a6b704f4d51ece4b9472
export const coreMethods = new Set([
  '__construct', 'addAction', 'addFilter', 'addCollector', 'doAction', 'applyFilters', 'collect',
  'setProcessor', 'hasProcessor', 'processor', 'clearProcessor', 'setRenderer', 'process',
  'processWith', 'render', 'renderWith', 'has', 'hasAction', 'hasFilter', 'hasCollector', 'count',
  'listeners', 'actions', 'filters', 'collectors', 'removeAction', 'removeFilter', 'removeCollector',
  'removeAll', 'removeAllActions', 'removeAllFilters', 'removeAllCollectors',
])
export const handleMethods = new Set(['id', 'hookPoint', 'type', 'priority', 'remove', 'belongsTo'])
export const contextMethods = new Set(['__construct', 'hookPoint', 'arguments'])
export const contractMethods = new Set(['resolve', 'process'])
export const facadeMethods = new Set([...coreMethods].filter((method) => method !== '__construct'))
export const methodReferenceNames = new Set([
  ...coreMethods,
  ...handleMethods,
  'ProcessingContext::__construct',
  'ProcessingContext::hookPoint',
  'ProcessingContext::arguments',
])
