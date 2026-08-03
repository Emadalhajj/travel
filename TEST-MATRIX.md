# Payment test matrix

| Scenario | Automated | Required integration check |
|---|---:|---|
| Repeated initialize/idempotency | Pending DB integration test | Same active transaction is returned |
| Duplicate webhook | Pending DB integration test | One booking and one final transition |
| HyperPay PA success/failure | Unit request/result tests | Verify against TEST credentials |
| HyperPay CP success/failure | Unit request/result tests | Booking only after CP success |
| HyperPay RF success/failure | Unit request/result tests | Local refund only after provider success |
| HyperPay RV success/failure | Unit request/result tests | Local cancel only after provider success |
| Bank approve/reject | Pending DB integration test | Timeline, audit, reviewer fields |
| Booking conversion failure | Pending DB integration test | `paid_pending_booking` retained |
| Booking summary after refund | Pending DB integration test | Paid and remaining totals recalculated |
| Secret/raw payload exclusion | Pending audit integration test | No credentials, metadata, or raw response |

Unit tests mock the HyperPay HTTP boundary. Tests marked pending require an isolated MongoDB test database and must not target production data.
