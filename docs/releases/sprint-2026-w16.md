---
title: "Sprint W16 — Apr 14–20, 2026"
sidebar_label: "W16 (Apr 14–20)"
---

# Sprint W16 Release Notes

**Period:** Monday April 14 – Sunday April 20, 2026
**Primary focus:** Cross-country registry parity + NorthData coverage fix + Prague demo prep (April 23)
**Validated:** Komerční banka run #4 end-to-end; KBO live lookup on KBC Groep NV (27 directors); 34 unit tests passing

---

## Highlights

### NorthData coverage breakthrough for CZ (and every IČO-only registry)

The NorthData search → detail fallback quietly returned `None` for every Czech company that did not match the direct-by-`registerId` lookup. Root cause: the search API wraps each hit in `{"company": {...}}`, but the retry code read `first["name"]` / `first["id"]` off the outer envelope and always saw empty strings.

After unwrapping the envelope and switching to NorthData's internal numeric `id` (first-class key that returns 200 deterministically), **Komerční banka now returns 49.9 KB of data with 21 years of financials** (Revenue 2025 = 106 B CZK, BalanceTotal = 1.6 T CZK).

Impact: every CZ/SK/non-DE-registered regulated entity that previously showed empty FHRs now has aggregator-sourced financials flowing into the investigation — the `_build_fhr_from_northdata` safety net (ADR-0040) finally triggers.

### KBO parser rewrite — 27 directors instead of 1 garbage blob

The KBO HTML parser silently broke on large boards. It assumed each director sits on its own `<tr>` with two `<td>` cells — but KBO packs 25+ directors into a single `<tr>` with 82 `<td>` cells in triplets of (role, name, date) following one concatenated-summary `<td>`.

For **KBC Groep NV (0403.227.515)** the parser returned exactly one "director" whose name was `"Bestuurder"` and whose role field was a 2 KB concatenated blob of every director. Every large Belgian corporate had been silently broken — the bug was masked because small companies (SOFT4U, small merchants) fit the pair-layout and worked.

After the rewrite: **27 directors extracted correctly** — 18 Director + 7 Executive Committee Member + 2 Managing Director. Johan Thijs correctly identified as Managing Director since 2012-05-03 (actual KBC CEO).

### Cross-country legal form decoders

Three registries were emitting raw numeric codes straight to the UI, risk engine, and network graph:

| Registry | Before | After |
|---|---|---|
| CZ ARES | `legal_form: "121"` | `"a.s."` (+ 25 other codes) |
| FR INSEE | `legal_form: "5710"` | `"SAS"` (95 Nomenclature NJ codes) |
| CH Zefix | `legal_form: "0111"` | `"AG"` (18 legalFormId codes) |

Unknown codes fall back to `"Code XXXX"` so display never shows a bare number without context. The other nine registries (BE/DE/NL/RO/NO/DK/SK/FI/EE) already returned human-readable text — no decoder needed.

### Uniform `directors_detailed` shape across 12 countries

Every country registry emitted a `role` field, but downstream consumers read `job_title`. Only CZ had the alias. Every other country silently displayed empty job titles.

Added `job_title=role` alias + explicit `source` tag to all 8 affected registries (FR INPI, NO Brreg, DK CVR, SK OR SR, CH Zefix, EE Äriregister, NL KvK, RO ONRC). Also propagated `directors_detailed` from KBO into `registry_data` in `_query_be` — previously only the flat names list was lifted, so the BE Phase 2 shortcut fell back to reconstructing dicts with `role="unknown"` (same silent bug CZ had).

### Country-aware FHR reconciliation

The synthesis LLM narrates "the Czech Collection of Deeds did not return financial statements" based on the registry phase alone. By the time the narrative is written, NorthData (or a country-specific fallback) may have built a populated `FinancialHealthReport` — creating a direct contradiction in the officer's report.

The post-processor now:

- Recognises 30+ stale-financials phrasings including country-native variants (`"NBB did not return"` for BE, `"jaarrekening not deposited"` for NL, `"bilans absents"` for FR, `"Bundesanzeiger keine"` for DE, `"sbírka listin"` for CZ).
- Rewrites matched findings with an accurate aggregator-fallback description that names the **correct local supervisor per country** (CNB for CZ, NBB/FSMA for BE, ACPR for FR, BaFin for DE, DNB/AFM for NL, FINMA for CH, NBS for SK, 17 supervisors total).

### LEI-first entity dedup + legal-entity filter on shared-director insights

Two network-graph fixes:

1. **LEI-first dedup** in `extract_connections_from_scan` collapses cross-country filings of the same entity via their global LEI (e.g. Société Générale DE and Societe Generale FR → one entity). Normalized-name fallback catches cases where LEI is absent but the company is literally the same (diacritic variants, case differences).

2. **Legal-entity filter** on shared-director insights skips holding-company "directors" that end in legal suffixes (`a.s.`, `s.r.o.`, ` sa`, ` ag`, ` gmbh`, ` bv`, ` n.v.`, ` ltd`, ` plc`, ` llc`, `inc`, …). Previously every SG subsidiary showed an insight saying *"Director 'Société Générale SA' appears in 2 network entities"* — holding-company corporate structure is not an AML cross-linkage signal.

Real signal that was **buried** before and now surfaces: three legitimate shared directors between SG SA and SG Effekten GmbH (Mannsfeldt, Zapf, Schröder) — an actual board-interlock pattern that AML officers are supposed to notice.

### Accurate GLEIF/VIES rule text

`eu_generic_vies_invalid` and `eu_generic_gleif_no_lei` were titled to imply the underlying data was bad ("VAT Number Invalid", "No LEI Found") but what they actually checked was `SOURCE_MISSING`. That created a direct contradiction in the same report when a verified GLEIF finding (LEI confirmed active) sat next to a rule-generated "No LEI Found" finding.

Retitled to what the rules actually detect: "VIES check not performed" / "GLEIF not consulted". Added a pre-enrichment source bridge in `osint_agent.py:1670` that injects `gleif`/`vies`/`northdata`/`website`/`brightdata` into `sources_present` based on `additional_data` so the rules stop firing when those sources *were* consulted — closing a 400-line-ordering race between findings emission and reasoning evaluation.

---

## Test evidence

### Unit tests — 34 / 34 passing

```bash
$ pytest tests/test_legal_form_decoders.py tests/test_network_scan_filters.py -v
# 34 passed, 68 warnings in 0.45s
```

Covers all three decoders (known codes, unknown-code graceful fallback, empty/None handling, whitespace stripping), shared-director legal-entity filter (entity suffixes filtered, persons with diacritics kept), and LEI-first dedup (SG-DE/SG-FR collapse, same-name collapse without LEI, distinct-entity preservation).

### Live validation — KBC Groep NV (0403.227.515)

```
Legal name: KBC Groep
Legal form: 'Naamloze vennootschap'
Flat directors (27):
  - Michiel Allaerts
  - Alain Bostoen
  ... (25 more)

Role distribution across 27 directors:
  18x Director
  7x Executive Committee Member
  2x Managing Director

Last 3 directors:
  'Johan Thijs'  role='Managing Director'  start=2012-05-03  ← KBC CEO ✓
```

### Live validation — Komerční banka (IČO 45317054)

KB run #4 end-to-end through REVIEW_PENDING. All eleven fixes verified:

- `legal_form: 'a.s.'` (not "121")
- 6 directors with Czech roles (`'člen'`, `'Člen statutárního orgánu'`, `'předseda'` for Jan Juchelka = KB CEO) + `source='ARES VR'`
- Financial series 2005–2025, 21 filing periods, Revenue 2025 = 106 B CZK
- Financial health finding reconciled: *"Financial statements retrieved via aggregator fallback (NorthData pan-European registry). 21 filing period(s) covered; latest year 2025. Local commercial-register deposit did not host machine-readable filings — common for regulated financial institutions whose statutory reports are published through the national supervisor (CNB (Czech National Bank))."*
- Zero false-positive legal entities in shared-director insights (previously: `"Komerční Banka a.s. appears in 5 network entities"` and `"Société Générale SA appears in 2 network entities"`)
- Only ONE "Société Générale SA" in `related_companies` (DE/FR filings collapsed via LEI)
- SG Effekten GmbH correctly preserved as a distinct entity — three real board interlocks with SG SA now surface

---

## Commits

| # | Commit | Description |
|---|---|---|
| 1 | `9569b7d4` | `fix(northdata): unwrap company envelope in search→detail fallback` |
| 2 | `73bc33cc` | `fix(osint): reconcile stale narratives, bridge pre-enrichment sources, preserve rich directors` |
| 3 | `eb8cca7f` | `fix(kbo): parse packed-board HTML + expand role translations + propagate directors_detailed` |
| 4 | `c1d795af` | `fix(ares): decode Czech legal form codes + preserve ARES director roles` |
| 5 | `585d5361` | `feat(registries): job_title + source aliases across 8 country registries` |
| 6 | `d2524845` | `feat(registries): FR INSEE + CH Zefix legal form decoders` |
| 7 | `0008b972` | `fix(network): filter legal entities from shared-director + LEI-first entity dedup` |
| 8 | `d2e84ef6` | `test(registries): unit tests for legal form decoders + network scan filters` |
| 9 | `9c4e20cd` | `docs(adr): ADR-0043 cross-country registry parity + CLAUDE.md update` |
| 10 | `a1f0d611` | `docs(docusaurus): sprint W16 release notes + ADR-0043 mirror` |
| 11 | `c962d0fe` | `fix(docling): per-PDF timeout + demo prewarm scripts` |
| 12 | `9d529d9c` | `fix(registries): SK role/legal_form parsing + NO Brreg list-shape crash` |
| 13 | `a57e50a0` | `fix(ui): KBOEvidenceCard reads mandate_start/mandate_end + job_title` |
| 14 | `c327ec48` | `test(kbo): contract test against KBC Groep fixture for packed layout` |
| 15 | `0545218e` | `prompt(synthesis): forbid parenthetical hedging in source field` |
| 16 | `1363c62e` | `feat(kbo): expand role translations with supervisory + statutory auditor roles` |
| 17 | `e98e950a` | `test(canary): end-to-end shape assertions against a REVIEW_PENDING case` |
| 18 | `ddcf9434` | `feat(establishments): per-unit geocoding + location-risk enrichment (Gino #2)` |
| 19 | `3db99dec` | `feat(ui): Google Maps links on all rendered addresses` |
| 20 | `44174920` | `feat(reconciliation): NACE (declared) vs MCC (inferred) divergence finding (Gino #1)` |

---

## Gino (KBC Merchant Services) roadmap — three items shipped this sprint

Originally planned as 1–2-week items after the 2026-04-13 meeting. All
three landed in this sprint:

| # | Gino-priority item | Status |
|---|---|---|
| #1 | **NACE vs MCC reconciliation** — divergence finding for night-shop-with-betting archetype | ✅ shipped (commit 20) |
| #2 | **Establishment-unit fetch + per-unit risk** — geocoding + virtual-office + FATF overlays | ✅ shipped (commit 18) |
| #4 | **Conditional approval** (`APPROVED_WITH_RESTRICTIONS`) — structured blocked_mcc, volume caps, secondary-review flag | ✅ verified (already implemented end-to-end but unticked in plan doc) |

Gino's remaining items (#3 supply-chain edges, #5 sanctions FP suppression, #7 professional-license registries, #8 perpetual KYC, #9 regulatory deadline board) are captured in `docs/ROADMAP.md`.

---

## Known follow-ups

- **End-to-end API-path run** validating pre-enrichment → workflow → REVIEW_PENDING for BE + FR (deferred due to Docling PDF-extraction slowness blocking direct-workflow-start test timelines — Docling on MPS takes 14+ min per large NBB annual-accounts PDF; mitigated this sprint by adding a 90s per-PDF timeout).
- **Decoder refresh cadence** — annual review of INSEE NJ / ČSÚ pravní forma / Zefix legalFormId code lists against authoritative sources.
- **`_ROLE_TRANSLATIONS` completeness audit** — some less-common Dutch/French roles (e.g. *Lid Raad van Commissarissen*, *Conseil de surveillance*) still pass through untranslated. Supervisory/auditor roles now covered (commit 16); polishing remains.
- **DK CVR / NL KvK lookup debugging** for largest local banks (Danske Bank, ING Bank) — both returned empty in this sprint's silent-bug scan; likely API auth / wrong-reg-number issues, not parser bugs.
- **goAML export integration with `decision_restrictions`** — restrictions are persisted and auditable but not yet included in goAML XML output.

See also:
- [ADR-0043](../adr/0043-cross-country-registry-parity) for the decision record behind the cross-country parity work.
- [ROADMAP.md](https://github.com/Tsunami-max/trust-relay-workflow/blob/master/docs/ROADMAP.md) for the consolidated project roadmap.
