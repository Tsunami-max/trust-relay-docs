---
sidebar_position: 42
title: "Transaction Monitoring"
description: "Transaction ingestion, counter-account analysis, financial cross-referencing, and tax engine"
components:
  - app/services/transaction_ingestion_service.py
  - app/services/counter_account_service.py
  - app/services/financial_cross_reference.py
  - app/services/tax_engine.py
  - app/services/tax_engine_mock_data.py
last_verified: 2026-03-30
status: implemented
---

# Transaction Monitoring

Transaction monitoring infrastructure for AML compliance covering payment ingestion, counter-account analysis, financial cross-referencing against investigation data, and tax obligation calculations. Supports detection of structuring, round-tripping, and other suspicious transaction patterns.

## Components

| Module | Purpose |
|--------|---------|
| `transaction_ingestion_service.py` | Payment and transaction data ingestion and normalization |
| `counter_account_service.py` | Counter-account (beneficiary) analysis and risk scoring |
| `financial_cross_reference.py` | Cross-referencing financial data against investigation findings |
| `tax_engine.py` | Tax obligation calculation and fiscal analysis |
| `tax_engine_mock_data.py` | Mock data for tax engine development and testing |
