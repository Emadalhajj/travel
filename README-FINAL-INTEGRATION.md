# Payment integration

The payment flow uses server-resolved `PaymentConfiguration` records. Provider checkout creates a HyperPay pre-authorization (`PA`). A booking is not created until a successful capture (`CP`). Refund and reversal operations use `RF` and `RV` respectively and update local state only after a successful provider response.

## Administrative routes

- `GET /api/payment-transactions`
- `GET /api/payment-transactions/:id`
- `PATCH /api/payment-transactions/:id/bank-transfer/approve`
- `PATCH /api/payment-transactions/:id/bank-transfer/reject`
- `PATCH /api/payment-transactions/:id/capture`
- `PATCH /api/payment-transactions/:id/refund`
- `PATCH /api/payment-transactions/:id/cancel`

## Legacy migration

Run the migration without `APPLY_PAYMENT_TX_MIGRATION` first. Review the count and the `paymenttransaction_legacy_backups` collection. Set `APPLY_PAYMENT_TX_MIGRATION=true` only after a database backup and maintenance approval. Remove the compatibility fields from the Mongoose model only after validating migrated production data.

## Verification

Run `npm test` inside `backend`, then run `npm run build` at the repository root. A real HyperPay TEST-environment smoke test remains required before production.
