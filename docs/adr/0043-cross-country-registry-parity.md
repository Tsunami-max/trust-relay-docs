---
id: 0043-cross-country-registry-parity
sidebar_position: 44
title: "ADR-0043: Cross-Country Registry Parity"
---

# ADR-0043: Cross-Country Registry Parity — Decoders, Director Shapes, and the KBO Packed-Layout Bug

**Status:** Accepted
**Date:** 2026-04-17

## Context

Trust Relay supports 12 country registries (ADR-0034). Each registry returns its own shape of director records, legal form codes, and narrative style. Over time, cosmetic inconsistencies accumulated into real UX and correctness problems:

1. **Legal form codes displayed as raw numbers.** CZ ARES returned `"121"` (akciová společnost), FR INSEE returned `"5710"` (SAS), CH Zefix returned `"0111"` (AG). These codes flowed straight to the UI, risk engine, and network graph with no decoding. A compliance officer reviewing a Czech case saw `legal_form: "121"` — meaningless.

2. **Directors appeared to have no roles.** Every registry emitted a `role` field on `directors_detailed`, but downstream consumers (NorthData scrape path, network insight generator, UI director tab) read `job_title`. Only CZ (after a local fix) emitted the `job_title` alias. Every other country silently displayed blank job titles even when the role was present.

3. **KBO large boards returned garbage.** The KBO HTML parser assumed each director sits on its own `<tr>` with two `<td>` cells (role, name). In reality, KBO packs large boards — 25+ directors on KBC Groep NV — into a single `<tr>` with 82 `<td>` cells in triplets of (role, name, date) following one concatenated-summary `<td>`. The parser returned exactly **one** "director" whose name was `"Bestuurder"` and whose role was a 2KB blob of every director concatenated. Every Belgian bank or corporate group with a real board was broken. Small companies (SOFT4U, small merchants) fit the pair layout and worked fine — so nobody caught it.

4. **FHR "no financials" narratives were stale.** The synthesis LLM narrates "the Czech Collection of Deeds did not return financial statements" based on the registry phase alone. But by the time the narrative is written, a `FinancialHealthReport` may have been built from NorthData or a country-specific fallback (ADR-0040). The UI then showed a populated FHR and a contradictory finding saying no financials existed. Reconciliation existed for CZ but with hard-coded "CNB for CZ" language that was wrong in every other jurisdiction.

5. **NorthData lost cross-country filings.** Société Générale SA (DE filing) and Societe Generale SA (FR filing) were treated as different entities because `seen_ids` dedup keyed only on `registerId`. The graph showed SG twice and inflated shared-director patterns.

6. **Network insights flagged holding companies as directors.** Shared-director detection produced findings like *"Director 'Société Générale SA' appears in 2 network entities"* — a holding company listed as its own subsidiary's legal representative is normal corporate structure, not an AML cross-linkage signal. These false positives buried the real shared-director patterns (actual natural persons on multiple boards).

## Decision

Deliver cross-country parity in one pass:

### 1. Country-specific legal form decoders

Add decoders next to each registry service:

- **`decode_cz_legal_form()`** — 26 ČSÚ pravní forma codes (a.s., s.r.o., v.o.s., k.s., SA, družstvo, příspěvková organizace, OSVČ, Fyzická osoba, …). Decodes `"121"` → short `"a.s."` + full Czech name `"Akciová společnost"`.
- **`decode_fr_legal_form()`** — 95 INSEE "Catégorie juridique" codes (Nomenclature NJ 2003). Decodes `"5710"` → `"SAS"`, `"5499"` → `"SARL"`, `"1000"` → `"EI"`, etc.
- **`decode_ch_legal_form()`** — 18 Zefix legalFormId codes (AG, GmbH, Einzelunternehmen, Kollektivgesellschaft, Verein, Stiftung, Genossenschaft, SICAF, SICAV, …).

Unknown codes fall back to `"Code XXXX"` so the display never shows a bare number without context.

The other registries (NO, DK, NL, RO, SK, FI, BE, DE, EE) already return human-readable text from their sources — no decoder needed.

### 2. Uniform `directors_detailed` shape across all countries

Every country registry now emits, per director:

```python
{
    "name": "Full Name",
    "role": "Director",           # English (translated from native label)
    "job_title": "Director",       # alias for consumers that read job_title
    "source": "<registry name>",   # e.g. "INPI RNE", "KBO/BCE Public Search"
    "mandate_start": "2025-04-30", # ISO date
    # ... country-specific extras (mandate_end, date_of_birth, ...)
}
```

Eight registries needed the `job_title` alias + `source` added: FR INPI, NO Brreg, DK CVR, SK OR SR, CH Zefix, EE Äriregister, NL KvK, RO ONRC (source was already present on RO).

### 3. KBO packed-layout parser rewrite

`_parse_directors_detailed()` in `kbo_service.py`:

- Detect the packed layout: a `<tr>` with more than 3 `<td>` cells where `td[0]` is a summary blob not matching `_ROLE_TRANSLATIONS` and longer than 40 characters.
- Iterate `td[1:]` in triplets of (role, name, date).
- Fall back to the classic 2-`<td>` (role, name) layout for small boards.

`_parse_directors()` (the flat-names variant) applies the same detection so flat and detailed views stay consistent.

Also expanded `_ROLE_TRANSLATIONS` from 13 to 27 entries (added Executive Committee Member, Chairman, Vice-Chairman, Secretary, Treasurer across NL/FR/DE).

### 4. Phase 2 shortcut preserves `directors_detailed`

`osint_agent.py:975` previously reconstructed `directors_detailed` from the flat names list, hard-coding `role="unknown"`. Now prefers `_phase2_registry["directors_detailed"]` when present. Same bug existed for BE — `_query_be` was only lifting the flat `directors` list into `registry_data`, silently discarding the rich KBO `directors_detailed`. Fixed by adding `registry_data["directors_detailed"] = kbo_data.get("directors_detailed", [])`.

### 5. Country-aware FHR reconciliation

The post-processor in `osint_agent.py` now:

- Recognises 30+ stale-financials phrasings including country-specific variants (`"NBB did not return"` for BE, `"jaarrekening not deposited"` for NL, `"bilans absents"` for FR, `"Bundesanzeiger keine"` for DE, `"collection of deeds"` / `"sbírka listin"` for CZ).
- Rewrites matched findings with an accurate aggregator-fallback description that names the **correct local supervisor** per country via a map:
  - CZ → CNB (Czech National Bank)
  - BE → NBB / FSMA
  - FR → ACPR
  - DE → BaFin
  - NL → DNB / AFM
  - SK → NBS, PL → KNF, CH → FINMA, …

Supervisor map covers 17 countries.

### 6. LEI-first entity dedup + normalized-name fallback

`extract_connections_from_scan()` in `network_scan_service.py`:

1. Extract LEI from NorthData `filings[]` (where `source == "Lei"`) — global identifier.
2. Build `entity_id = lei or registerId or euId or name`.
3. Compute `name_key = "nm:" + NFKD(lowercase(name)) with trailing legal-form suffix stripped`.
4. Dedup on both `entity_id` and `name_key` — either being seen skips the entity.

`osint_agent.py` seeds `seen_entities` at network-scan start with the primary company's name_key and propagates consistently across scan iterations.

### 7. Legal-entity filter on shared-director insights

In `corroborate_network()`, skip any "director" whose name ends with a recognised legal suffix: `a.s.`, `s.r.o.`, ` sa`, ` ag`, ` gmbh`, ` bv`, ` n.v.`, ` ltd`, ` plc`, ` llc`, ` inc`, etc.

A small but important detail: the filter pads the name with spaces (`" " + name + " "`) so suffix substrings match at word boundaries. The first version used `" ".join(name.split())` which stripped the padding and broke trailing-suffix matches — fixed by preserving padding explicitly.

## Consequences

### Positive

- **Every officer-facing legal_form value is now human-readable.** No more `"121"` / `"5710"` / `"0111"` showing up in case reviews.
- **Director data has a uniform shape across 12 countries.** The UI, network graph, and network insight generator can rely on `role`, `job_title`, `source` existing on every director record.
- **KBC Groep (and every similarly-large BE entity) now returns 27 directors with correct roles.** Johan Thijs correctly identified as Managing Director since 2012-05-03. Before the fix: one garbage director with a 2KB concatenated blob.
- **FHR narratives no longer contradict the populated financial data.** Aggregator fallback is explicitly named; correct local supervisor cited for audit defensibility.
- **Network graph collapses SG-DE/SG-FR into one entity via LEI.** Shared-director insights between SG SA and SG Effekten GmbH (three real board interlocks: Mannsfeldt, Zapf, Schröder) now surface instead of being buried by false-positive "SG as director" noise.
- **Regulatory defence:** source provenance preserved at director-level granularity for AMLR Art. 28 CDD audit trails.

### Negative

- **Legal form decoders are curated lists, not authoritative nomenclatures.** Every 3–5 years the source authority (ČSÚ, INSEE, Zefix) publishes updates. Maintenance is manual — there's no automated sync against the source.
- **KBO parser is HTML-structure dependent.** If KBO Public Search redesigns its HTML (they have in the past), the packed-layout detection needs re-examination. A contract test against a real KBC fixture would catch that, but none exists yet.
- **`_ROLE_TRANSLATIONS` is still incomplete for less-common roles** (e.g. Dutch `"Lid Raad van Commissarissen"` / French `"Conseil de surveillance"` are not yet mapped). Untranslated roles pass through as-is — not broken, just inconsistent.

### Risks

- **FHR reconciliation can mask real gaps.** If the aggregator fallback (NorthData) reports stale or wrong data, the reconciliation message will say "filings retrieved" without catching the data quality issue. Partially mitigated by cross-reference findings, but a deliberate "aggregator disagrees with primary source" rule would be safer.
- **Shared-director legal-entity filter can hide genuine entity-as-nominee structures.** If an offshore shell uses a holding company as the formal representative on multiple boards (a known nominee pattern), our filter will suppress the signal. The current implementation accepts this trade-off because false positives on normal corporate structure were more damaging for demo/officer UX.

## Validation

- **34 unit tests** in `tests/test_legal_form_decoders.py` and `tests/test_network_scan_filters.py` — all pass in 0.45s.
- **Live KBO lookup on KBC Groep NV (0403.227.515):** 27 directors correctly extracted, 18 Director + 7 Executive Committee Member + 2 Managing Director. Johan Thijs since 2012-05-03 verified as KBC CEO.
- **Live NorthData lookup on KB (IČO 45317054):** after the NorthData search→detail fallback fix (committed separately), 21 years of financials retrieved via aggregator, FHR narrative reconciled to "NorthData pan-European registry … CNB (Czech National Bank)".
- **KB workflow run #4:** all 10 fixes verified end-to-end (directors with Czech roles, legal form 'a.s.', financial series 2005–2025, no false-positive legal-entity directors, single SG SA in related_companies, three legitimate SG SA ↔ SG Effekten interlocks surfaced).

## Follow-ups

- **Contract test** against a captured KBC HTML fixture covering the packed layout.
- **Decoder refresh cadence** — annual review of INSEE NJ, ČSÚ pravní forma, Zefix legalFormId code lists.
- **Untranslated role audit** — enumerate roles that pass through `_ROLE_TRANSLATIONS` unchanged across a full demo-tenant scan; add missing entries.
- **End-to-end API-path run** validating pre-enrichment → workflow → REVIEW_PENDING with all fixes live (deferred due to Docling PDF-extraction slowness blocking direct-workflow-start test timelines).
- **Belgian supervisor mapping** — NBB/FSMA is the right label today but Belgian banking supervision moved to the ECB SSM for systemically important banks. Consider finer-grained mapping for SSM banks.
