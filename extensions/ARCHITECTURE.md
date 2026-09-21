# Extension runtime architecture

All supported extensions load `scripts/protocol-v2.js` before their background runtime. The protocol provides versioned request envelopes, unique request IDs, correlated responses, sender validation, bounded request timeouts, and compatibility adapters for legacy `{type: ...}` messages.

Background message listeners must be registered synchronously at script evaluation time. Initialization may run afterward; listeners must not be hidden behind asynchronous setup. Persistent work that must survive background/service-worker restarts belongs in extension storage rather than module-only memory.

Protocol v2 envelopes use `protocol: "scriptexts-extension"`, `version: 2`, `requestId`, `action`, and `payload`. Unknown versions/actions fail explicitly. Legacy messages remain accepted while callers migrate incrementally.

The architecture regression suite is `npm run test:extensions:architecture`. It protects listener registration, protocol compatibility/correlation, timeout behavior, identical protocol implementations across packaged extensions, and restart-safe Stardew download identity.
