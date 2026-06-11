---
id: 0046-nbb-cbso-csv-endpoint-degradation
sidebar_position: 47
title: "ADR-0046: NBB CBSO Honest Data-Gap Surfacing"
---

# ADR-0046 — NBB CBSO CSV endpoint degradation and honest data-gap surfacing

**Status**: Accepted
**Date**: 2026-04-22
**Supersedes**: none
**Superseded by**: none

## Context

During the Proximus NV regression test on 2026-04-22, the "Financial
Health" card surfaced a **"stable"** label alongside **all-N/A line
items** (Total Assets, Equity, Revenue, Profit/Loss, Employees).

Root cause: the National Bank of Belgium's Central Balance Sheet Office
(CBSO) endpoint used by `nbb_service.download_deposit_csv()` —

```
GET https://consult.cbso.nbb.be/external/broker/public/deposits/consult/csv/{deposit_id}
Accept: text/csv
```

— currently returns **HTTP 200 OK with Content-Type `text/html`** and
the body of the Angular consultation SPA (~5 KB HTML shell). Probed
from multiple Accept headers, User-Agent strings, with and without
session cookies and Referer headers: every request produces the same
SPA shell. One probe on an earlier run returned 406
`application/problem+json` with `"path":"/external/broker/public/..."`,
indicating the backend does exist but no longer produces `text/csv` for
this route. This is consistent with an undocumented deprecation or a
routing change on NBB's side.

The consuming code:

```python
csv_text = await self.download_deposit_csv(deposit_id)
if csv_text is not None:
    latest_financials = self._parse_financial_csv(csv_text)
    if all(v is None for v in latest_financials.values()):
        latest_financials = None
```

accepted the HTML body as valid text, passed it to `csv.reader`, found
zero rubric-code matches, set `latest_financials = None`, and proceeded
without logging. Downstream, `_assess_financial_health` returned
`"stable"` because `total_filings > 0` (the filings listing endpoint —
a different URL — still works), which is how the misleading
"stable + all N/A" card was rendered to the officer.

## Decision

1. **Content-type + body-sniff guard** on `download_deposit_csv`. When
   the response content-type is `text/html` OR the body begins with
   `<!DOCTYPE html>` / `<html`, return `None` and log a WARNING
   identifying the deposit ID and observed content-type. This converts a
   silent failure into an observable, grep-able event.

2. **Honest health-label propagation**. `_assess_financial_health` now
   accepts a `has_parsed_financials` flag. When filings exist but the
   line-item parser yielded nothing, the label becomes `"filings_only"`
   rather than `"stable"`. The UI renders `"filings_only"` with the
   amber palette used for `unknown` — NOT the emerald of genuine stable
   tiers — so an at-a-glance read of the card does not imply positive
   signal we have not earned.

3. **Scoped, not blanket**. We do not fail the entire investigation when
   NBB CSV is unavailable. Filings metadata (deposit IDs, filing years,
   filing regularity) still comes back from the listing endpoint and is
   surfaced as normal. Only the line-item-dependent assessment is
   degraded, and degraded visibly.

## Consequences

### Positive

- Officers reviewing a BE case with degraded NBB access now see an
  explicit "Filings only" amber chip with a tooltip explaining the gap.
  No more "stable + N/A N/A N/A" false comfort.
- The WARNING log line gives operators a grep-able hook to monitor
  endpoint health without adding dedicated health checks.
- Test coverage for the HTML guard (body sniff + content-type) prevents
  regression if NBB fixes their end and the parser is re-enabled.

### Negative

- Until NBB restores CSV or we switch to a different data source, BE
  financial line items are unavailable for every investigation. Risk
  engines that depend on `solvency_ratio` / `debt_ratio` get null
  inputs and should fall back to `financial_health_signal` +
  `filing_regularity` only.
- The "filings_only" status is a new value the UI has to render. Three
  files learn about it: `backend/app/services/nbb_service.py`,
  `frontend/src/lib/colors.ts`, `frontend/src/components/dashboard/
  FinancialHealthCard.tsx`. Future consumers of
  `financial_health_report.health_status` must tolerate the new
  enum value.

## Follow-ups (tracked separately)

- **Endpoint migration**: investigate where CBSO moved the machine-
  readable financials to. Candidates: `/deposits/xbrl/:depositId`
  (XBRL — referenced in the SPA bundle), the `/rs-consult/` JSON
  namespace, or a new credentialed broker. See plan file
  `docs/superpowers/plans/2026-04-22-nbb-financials-recovery.md`
  (TBD).
- **PDF + Docling fallback**: the `/pdf/:depositId` endpoint is subject
  to the same SPA-shell 200 regression today; if it recovers we can
  switch to PDF extraction via the existing Docling pipeline.
- **Alternative data source**: NorthData has pay-for-access Belgian
  annual accounts. Worth modelling the cost.
- **Rule-engine review**: audit every call site that reads
  `financial_health_report.health_status` to ensure `"filings_only"`
  does NOT trigger any rule that previously fired only on `"stable"`.

## Related

- ADR-0012 — Hybrid scraping tool selection per data source
- ADR-0032 — Circuit breakers for OSINT pipeline resilience (the NBB
  circuit remains the right place to isolate repeated failures)
- The cross-reference service address-robustness fix landed the same
  day — see plan
  `docs/superpowers/plans/2026-04-22-address-cross-reference-fix.md`.
