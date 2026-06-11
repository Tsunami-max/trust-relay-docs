---
title: Shell Company Detection
components:
  - backend/app/services/shell_company_detector.py
  - backend/app/services/pure_mailbox_detector.py
  - backend/app/agents/osint_phases.py
  - backend/app/agents/osint_agent.py
  - packages/trustrelay-models/src/trustrelay_models/investigation.py
last_verified: 2026-06-11
---

# Shell Company Detection

Trust Relay automatically detects shell company patterns through two complementary detectors:

1. **Address-mismatch detection** (`shell_company_detector.py`) — a company whose legal registered address is in a different postal code zone from all of its operating establishment units. This mismatch — a mailbox registration separate from actual operations — is a documented AML risk indicator under EU law. Emits a `HIGH`-severity finding.
2. **Pure-mailbox detection** (`pure_mailbox_detector.py`, ADR-0041) — an *active, mature* company with **zero** registered establishment units, where the registered seat is the only known address. This catches registration-only entities that have no establishments to compare against (so the address-mismatch detector returns nothing). Emits a `MEDIUM`-severity finding.

The two are mutually exclusive by construction: pure-mailbox detection returns `None` the moment any establishment exists, deferring to the address-mismatch detector.

## What It Does

After the registry agent fetches company data, Trust Relay extracts the registered address postal code and compares it against the postal codes of every establishment unit returned by the registry. If the registered postal code does not appear in any establishment address, a `HIGH`-severity `Finding` is appended to the investigation result.

The finding includes:
- The registered postal code and city
- The full list of establishment postal codes found
- A plain-language description linking the mismatch to shell company structures
- A `regulatory_basis` field citing EU-AMLR Art. 28 §2(a)

This finding flows through the standard pipeline: it is included in the evidence bundle (ADR-0021), contributes to the EBA risk matrix (ADR-0020), and surfaces in the officer dashboard's Conflicts Panel.

## Regulatory Basis

**EU-AMLR Art. 28 §2(a)** — geographic risk factors: unusual business structures where the registered address differs from all operating locations. Obliged entities must apply enhanced due diligence when this pattern is present.

## Supported Countries

| Country | Registry source | Establishment data | Postal code format |
|---|---|---|---|
| BE | KBO (Crossroads Bank for Enterprises) | `vestigingseenheid` via `/api/vestigingen` | 4-digit (e.g. `1000`) |
| CZ | ARES RŽP endpoint (`/ekonomicke-subjekty-res/rest/ekonomicke-subjekty/{ico}/provozovny`) | `provozovny` list | 5-digit, optionally space-split (e.g. `110 00` or `11000`) |

## Algorithm

1. **Extract registered postal code** — reads `registered_address.postal_code` from the merged `result_dict`. Normalizes by stripping whitespace.

2. **Extract establishment postal codes** — for each entry in `establishments`, runs a country-specific regex against the `address` string field:
   - BE: `\b(\d{4})\b`
   - CZ: `\b(\d{3}\s?\d{2})\b`

3. **Normalize** — CZ codes strip internal spaces so `"110 00"` and `"11000"` compare equal. BE codes are only `.strip()`-ed.

4. **Set comparison** — if the registered postal code appears in the set of establishment postal codes, no finding is generated. If the set is non-empty and the registered code is absent, a `Finding` is returned with `severity=Severity.HIGH`.

5. **Safe defaults** — the function returns `None` (no finding) when:
   - The country is not in the supported list (prevents false positives on unsupported registries)
   - `registered_address` is None or has no `postal_code` field
   - `establishments` is empty (no data to compare against — handed off to the pure-mailbox detector)
   - No establishment address yields a parseable postal code

### Pure-mailbox conditions (ADR-0041)

`detect_pure_mailbox_pattern` returns a `MEDIUM`-severity finding only when **all three** conditions hold; it prefers false negatives on incomplete data over false positives:

1. **Zero establishments** — `establishments` is empty (if any exist, it defers to the address-mismatch detector).
2. **Active** — `company_status` is not a terminal/inactive state (liquidation, dissolved). Inactive companies naturally have no establishments, so this is not suspicious.
3. **Mature** — `creation_date` is at least **180 days** ago (`_MIN_AGE_DAYS`). Young startups that have not yet registered formal establishments are excluded.

The finding records `company_age_months` and cites EU-AMLR Art. 28 §2(a) (companies without apparent business activity as a geographic risk factor).

## Pipeline Integration

Both detectors are invoked from `backend/app/agents/osint_phases.py` (the post-registry phase extracted from `osint_agent.py`), after the registry data populates `result_dict` with `registered_address` and `establishments`. `detect_shell_company_pattern` is imported lazily inside the phase helper, and the pure-mailbox detector runs via `detect_pure_mailbox_and_emit` (called from `osint_agent.py`):

```python
from app.services.shell_company_detector import detect_shell_company_pattern

_shell_finding = detect_shell_company_pattern(
    result_dict.get("registered_address"),
    result_dict.get("establishments", []),
    country=country.upper() if country else "BE",
)
if _shell_finding:
    result_dict.setdefault("findings", []).append(_shell_finding.model_dump())

# Pure-mailbox detector (ADR-0041) — runs when there are zero establishments
from app.services.pure_mailbox_detector import detect_pure_mailbox_pattern

mailbox_finding = detect_pure_mailbox_pattern(
    result_dict.get("establishments", []),
    result_dict.get("company_status"),
    result_dict.get("creation_date"),
    country=country.upper() if country else "BE",
)
```

The guard-and-swallow pattern (ADR-0009) ensures that a parsing failure in either detector never blocks or errors the investigation. The `setdefault` mutation is separated from the detection block so a partial failure cannot create an empty `findings` key.

## Example Finding

For a Belgian company registered at a Brussels accountant's address (`postal_code: "1000"`) but with both establishments in Ghent and Antwerp:

```json
{
  "category": "shell_company_indicator",
  "title": "Registered address differs from all operating establishments",
  "description": "The company's registered address (postal code: 1000, city: Brussels) does not match any of its 2 establishment unit address(es) (postal codes: 2000, 9000). This pattern — a legal seat used as a mailbox separate from actual operations — is associated with shell company structures and requires heightened due diligence.",
  "source": "be_registry",
  "severity": "HIGH",
  "details": {
    "registered_postal_code": "1000",
    "establishment_postal_codes": ["2000", "9000"],
    "establishment_count": 2,
    "country": "BE"
  },
  "regulatory_basis": "EU-AMLR Art. 28 Sec2(a) -- geographic risk factors: unusual business structures where registered address differs from all operating locations"
}
```

## Limitations

- **Legitimate domiciliation is indistinguishable** — SMEs legally registered at a fiduciary or business center address will trigger a HIGH finding on every investigation. Officers must apply judgment; the finding is an input to a risk-based decision, not an automated rejection.

- **Holding companies with remote subsidiaries** — a holding entity that has no physical establishment in its own postal code (because all operations are at subsidiaries) will trigger the finding. The detector has no cross-entity graph awareness.

- **Single postal code comparison only** — the algorithm compares postal codes, not full addresses or city names. Two different streets in the same postal code zone will not produce a finding even if the physical addresses differ significantly.

- **No CZ Justice cross-reference** — for CZ entities, the registered address from ARES's core record is compared to RŽP `provozovny`. A separate validation against the Czech Justice company register (`justice.cz`) address is not yet implemented.

## Extending to New Countries

1. Add a regex pattern to `_POSTAL_CODE_REGEXES` in `backend/app/services/shell_company_detector.py`:
   ```python
   "FR": re.compile(r"\b(\d{5})\b"),  # French 5-digit postal codes
   ```

2. If the country's regex requires normalization (e.g., space stripping), add a branch to `_normalize_postal_code`.

3. Ensure the country's registry agent populates `RegistryAgentOutput.establishments` — this is the only data source the detector reads.

No changes to the call site in `osint_phases.py` are needed.
