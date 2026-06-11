---
sidebar_position: 42
title: "Transaction Monitoring"
description: "Precious-metals transaction ingestion, counter-account IBAN locking, financial source cross-referencing, and the Belgian gold tax engine"
components:
  - app/services/transaction_ingestion_service.py
  - app/services/counter_account_service.py
  - app/services/financial_cross_reference.py
  - app/services/tax_engine.py
  - app/services/tax_engine_mock_data.py
last_verified: 2026-06-11
status: implemented
---

# Transaction Monitoring

Transaction-handling infrastructure built for the precious-metals (Goud999) use case: ingesting metal buy/sell transactions, locking customer payout IBANs behind Verification-of-Payee (VoP) results, cross-referencing investigation financial sources, and computing Belgian gold capital-gains tax. This is transaction **record-keeping and payout-control** plus tax calculation — it does not implement statistical AML pattern detection (structuring, round-tripping, etc.).

## Components

| Module | Purpose |
|--------|---------|
| `transaction_ingestion_service.py` | Insert/retrieve `MetalTransaction` records in the `metal_transactions` table (tenant-scoped). Computes net per-metal holdings from buy/sell history (`ingest_transaction`, `ingest_batch`, `get_customer_transactions`, `get_customer_portfolio`) |
| `counter_account_service.py` | Counter-account (payout IBAN) **lock** helpers: after a VoP full_match the IBAN is locked; officer-approved partial_match (CMTC) is allowed; enforces a cool-off window on IBAN changes (`create_counter_account_lock`, `request_iban_change`, `is_cooling_off`) |
| `financial_cross_reference.py` | Compares overlapping NBB vs. NorthData financial figures for a Belgian company; consistent values raise confidence, discrepancies are injected as findings (`cross_reference_financials`, `inject_cross_reference_findings`) |
| `tax_engine.py` | Stateless Belgian Gold capital-gains tax engine: FIFO register, gain/loss calculator, exemption state machine, and `TaxCapsule` generation using `Decimal` arithmetic (`BelgianGoldTaxEngine`) |
| `tax_engine_mock_data.py` | Deterministic transaction scenarios with expected results for tax-engine tests (`get_scenario_*`) |

## Notes

- `transaction_ingestion_service` is metal-transaction specific (the `metal_transactions` table), not a generic payment-feed ingester.
- `counter_account_service` controls payout IBANs (lock + cool-off) rather than scoring beneficiary risk.
- `financial_cross_reference` cross-references two **registry financial sources** (NBB / NorthData) for a company, not transaction data against investigation findings.
