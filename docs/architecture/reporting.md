---
sidebar_position: 38
title: "Reporting"
description: "Investigation report generation and data assembly for compliance documentation"
components:
  - app/services/report_service.py
  - app/services/report_data_builder.py
  - app/api/case_analysis.py
last_verified: 2026-06-11
status: implemented
---

# Reporting

Report generation pipeline that assembles investigation data into structured, **PDF-rendered** compliance documents. The two-layer design cleanly separates data assembly from rendering:

- `ReportDataBuilder` (`report_data_builder.py`) queries Temporal, PostgreSQL, and MinIO and produces a fully typed `ReportData` dataclass — no dicts, no `Any`, all sanitization done here.
- `report_service.py` receives the typed `ReportData` and renders it to PDF via **Jinja2 + WeasyPrint**. It does no data assembly and no DB queries.

The typed model lives in the shared `trustrelay_models.report` package (re-exported through `app/models/report.py`), comprising dataclasses such as `CompanyIdentity`, `Finding`, `Discrepancy`, `DirectorRecord`, `UBORecord`, `ConfidenceBreakdown`, `FollowUpTask`, `ReportAuditEvent`, and `BrandingConfig`, aggregated into `ReportData`.

## Report Types

| Function | Output | Template |
|----------|--------|----------|
| `generate_compliance_report(data)` | 10-section KYB Compliance Report (PDF) | `templates/compliance_report.html` |
| `generate_audit_ledger(data)` | 14-section Audit Ledger (PDF, or JSON) | `templates/audit_ledger_v2.html` |

Both functions return PDF bytes. Jinja2 is configured with custom filters for formatting dates, currency (`€` with M/K abbreviation), percentages, booleans, trend arrows, and RAG/severity color codes.

## API Endpoints

Exposed through `app/api/case_analysis.py`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cases/{workflow_id}/report` | KYB Compliance Report as PDF |
| GET | `/cases/{workflow_id}/audit-ledger` (alias `/cases/{workflow_id}/report/audit-ledger`) | Audit Ledger as PDF (`?format=json` returns the raw `ReportData`) |

Each endpoint resolves the case, builds a `ReportData` via `ReportDataBuilder` (passing the Temporal client from app state), renders, and streams the result with a `Content-Disposition` attachment header.

## Components

| Module | Purpose |
|--------|---------|
| `report_data_builder.py` | Data assembly from Temporal/PostgreSQL/MinIO into a typed `ReportData` |
| `report_service.py` | Jinja2 + WeasyPrint PDF rendering of the Compliance Report and Audit Ledger |
| `case_analysis.py` | FastAPI endpoints exposing the two reports |
